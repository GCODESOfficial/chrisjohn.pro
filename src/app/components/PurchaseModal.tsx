/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/PurchaseModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window { PaystackPop?: any; }
}

type Props = { onClose: () => void; bookId: string; };
type BookRow = {
  id: string;
  title: string | null;
  price: string | null;         // "₦5,000" or "5000"
  book_pdf_url?: string | null; // optional
  book_audio_url?: string | null;
};

function parsePriceNGN(raw: string | null): number {
  if (!raw) return 0;
  const numeric = parseFloat((raw.match(/[\d.,]+/g)?.join("") || "0").replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

type Phase = "form" | "paying" | "verifying" | "success" | "failed";

export default function PurchaseModal({ onClose, bookId }: Props) {
  // Paystack script
  const [paystackReady, setPaystackReady] = useState(false);
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.async = true;
    s.onload = () => setPaystackReady(true);
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch {} };
  }, []);

  // Lock scroll
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, []);

  // Load book
  const [book, setBook] = useState<BookRow | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingBook(true);
        setLoadErr(null);

        const r1 = await supabase
          .from("books")
          .select("id, title, price, book_pdf_url, book_audio_url")
          .eq("id", bookId)
          .single();

        if (!r1.error) {
          if (!cancel) setBook(r1.data as BookRow);
        } else {
          const r2 = await supabase
            .from("books")
            .select("id, title, price")
            .eq("id", bookId)
            .single();
          if (r2.error) throw r2.error;
          if (!cancel) setBook(r2.data as BookRow);
        }
      } catch (e: any) {
        if (!cancel) setLoadErr(e?.message || "Failed to load book.");
      } finally {
        if (!cancel) setLoadingBook(false);
      }
    })();
    return () => { cancel = true; };
  }, [bookId]);

  // Form
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    format: "Hardcover" as "Hardcover" | "Audio" | "eBook (PDF)",
    quantity: 1,
    address: "",
    notes: "",
  });
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(p => ({ ...p, [k]: v }));
  const showAddress = form.format === "Hardcover";

  // Price math
  const unitAmount = useMemo(() => parsePriceNGN(book?.price ?? null), [book?.price]);
  const qty = Math.max(1, form.quantity);
  const total = useMemo(() => unitAmount * qty, [unitAmount, qty]);

  // UX
  const [phase, setPhase] = useState<Phase>("form");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); // non-fatal notices (e.g., email failed)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (!book) return setErr("Book not loaded yet.");
    if (!paystackReady || !window.PaystackPop) return setErr("Payment library not ready. Please try again.");
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
    if (!/^pk_(test|live)_/i.test(key)) return setErr("Invalid Paystack public key.");

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim())
      return setErr("Please enter your name, email, and phone number.");
    if (showAddress && !form.address.trim())
      return setErr("Please provide a shipping address for Hardcover.");
    if (unitAmount <= 0) return setErr("This book has an invalid price.");
    if (total <= 0) return setErr("Total cannot be ₦0.");

    setPhase("paying");
    const reference = `book_${bookId}_${Date.now()}`;
    const amountKobo = Math.max(100, Math.round(total * 100));

    try {
      const handler = window.PaystackPop.setup({
        key,
        email: form.email.trim(),
        amount: amountKobo,
        currency: "NGN",
        ref: reference,
        metadata: {
          book_id: bookId,
          book_title: book.title ?? undefined,
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          format: form.format === "eBook (PDF)" ? "PDF" : form.format,
          quantity: qty,
          address: showAddress ? form.address.trim() : undefined,
          notes: form.notes || undefined,
        },
        callback: (response: any) => {
          // Paystack says success → now verify on server
          setPhase("verifying");
          (async () => {
            try {
              const normalizedFormat = form.format === "eBook (PDF)" ? "PDF" : form.format;
              const res = await fetch("/api/notify-purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  reference: response.reference,
                  bookId,
                  bookTitle: book.title,
                  buyer_name: form.fullName.trim(),
                  buyer_email: form.email.trim(),
                  buyer_phone: form.phone.trim(),
                  format: normalizedFormat,
                  quantity: qty,
                  currency: "NGN",
                  unitPrice: unitAmount,
                  total,
                  address: showAddress ? form.address.trim() : undefined,
                  notes: form.notes || undefined,
                  pdfUrl: (book as any).book_pdf_url || undefined,
                  audioUrl: (book as any).book_audio_url || undefined,
                }),
              });

              const json = await res.json().catch(() => ({}));
              if (!res.ok || !json?.ok) {
                setErr(json?.error || "We could not verify your payment. If you were charged, contact support.");
                setPhase("failed");
                return;
              }

              if (json.mailed === false) {
                setInfo("Order saved. Email delivery failed; we’ll resend shortly.");
              }
              setPhase("success");
              setTimeout(() => onClose(), 1800);
            } catch (e: any) {
              console.error(e);
              setErr("Network error while verifying payment. If you were charged, contact support.");
              setPhase("failed");
            }
          })();
        },
        onClose: () => {
          if (phase === "paying") setPhase("form");
        },
      });

      handler.openIframe();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Could not open the payment window. Check your Paystack key and price.");
      setPhase("form");
    }
  }

  return (
    <div className="fixed inset-0 z-50 w-full h-full flex justify-center items-start overflow-y-auto scrollbar-hide bg-[#0f0f0f]">
      <div className="w-full max-w-4xl p-10 text-white relative min-h-screen">
        <button onClick={onClose} className="absolute top-6 right-6 text-sm text-white">Close ✕</button>

        <h2 className="text-2xl font-semibold text-center mb-2 mt-6">Get Your Copy</h2>
        <p className="text-center text-sm text-gray-400 mb-8">Fill in your details below and we’ll send your book straight to your inbox or doorstep.</p>

        {loadingBook && (
          <div className="mx-auto mb-6 max-w-2xl rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Loading book info…
          </div>
        )}
        {loadErr && (
          <div className="mx-auto mb-6 max-w-2xl rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {loadErr}
          </div>
        )}
        {err && (
          <div className="mx-auto mb-3 max-w-2xl rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}
        {info && (
          <div className="mx-auto mb-3 max-w-2xl rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {info}
          </div>
        )}
        {phase === "verifying" && (
          <div className="mx-auto mb-3 max-w-2xl rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Paystack reports success ✓ — verifying on our server…
          </div>
        )}
        {phase === "success" && (
          <div className="mx-auto mb-3 max-w-2xl rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            ✓ Payment successful. Order recorded!
          </div>
        )}
        {phase === "failed" && (
          <div className="mx-auto mb-3 max-w-2xl rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            We could not complete your order. Please try again.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="col-span-2">
            <label className="text-sm block mb-1">Full Name *</label>
            <input value={form.fullName} onChange={(e) => setF("fullName", e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md" placeholder="Enter your full name" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block mb-1">Email *</label>
            <input value={form.email} onChange={(e) => setF("email", e.target.value)} type="email" className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md" placeholder="you@example.com" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block mb-1">Phone Number *</label>
            <input value={form.phone} onChange={(e) => setF("phone", e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md" placeholder="+234 801 234 5678" />
          </div>

          <div>
            <label className="text-sm block mb-1">Book Format *</label>
            <select value={form.format} onChange={(e) => setF("format", e.target.value as any)} className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md">
              <option>Hardcover</option>
              <option>Audio</option>
              <option>eBook (PDF)</option>
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1">Quantity *</label>
            <input type="number" min={1} value={form.quantity} onChange={(e) => setF("quantity", Math.max(1, Number(e.target.value) || 1))} className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md" />
          </div>

          {showAddress && (
            <div className="col-span-2">
              <label className="text-sm block mb-1">Shipping Address *</label>
              <input value={form.address} onChange={(e) => setF("address", e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md" placeholder="123 Example Street, Lekki Phase 1, Lagos" />
            </div>
          )}

          <div className="col-span-2">
            <label className="text-sm block mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => setF("notes", e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md" rows={3} placeholder="Message" />
          </div>

          {/* Totals (NGN) */}
          <div className="col-span-2 flex items-center justify-between bg-[#121212] border border-white/10 rounded-md px-4 py-3">
            <div className="text-sm text-white/70">
              Unit price: <span className="text-white">₦{unitAmount.toLocaleString()}</span> NGN
            </div>
            <div className="text-sm font-semibold">
              Total: ₦{total.toLocaleString()} NGN
            </div>
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              disabled={phase === "paying" || phase === "verifying" || loadingBook}
              className="w-full bg-white text-black py-2 rounded-md hover:bg-gray-200 transition disabled:opacity-60"
            >
              {phase === "paying" ? "Opening Paystack…" : phase === "verifying" ? "Verifying payment…" : "Proceed to payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
