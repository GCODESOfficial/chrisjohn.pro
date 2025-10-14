/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/RegisterModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

declare global {
  interface Window { PaystackPop?: any }
}

type EventRow = {
  id: string;
  topic: string | null;
  event_date: string | null;
  event_time: string | null;
  status: "Free" | "Paid" | string | null;
  price: string | null;
  host_name: string | null;
  x_link: string | null;
  instagram_link: string | null;
  about: string | null;
  cover_url: string | null;
  hosting_url: string | null;
};

type Props = {
  onClose: () => void;
  event: EventRow;
};

function parsePriceNGN(raw: string | null): number {
  if (!raw) return 0;
  const numeric = parseFloat((raw.match(/[\d.,]+/g)?.join("") || "0").replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

type Phase = "form" | "paying" | "verifying" | "success" | "failed";

export default function RegisterModal({ onClose, event }: Props) {
  useEffect(() => { document.body.classList.add("overflow-hidden"); return () => document.body.classList.remove("overflow-hidden"); }, []);
  const [paystackReady, setPaystackReady] = useState(false);
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.async = true;
    s.onload = () => setPaystackReady(true);
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch {} };
  }, []);

  const unitAmount = useMemo(() => parsePriceNGN(event?.price ?? null), [event?.price]);
  const isFree = (event?.status ?? "").toLowerCase() === "free" || unitAmount <= 0;

  const [phase, setPhase] = useState<Phase>("form");
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(p => ({ ...p, [k]: v }));

  async function submitFreeRegistration() {
    setPhase("verifying");
    try {
      const reference = `evt_free_${event.id}_${Date.now()}`;
      const res = await fetch("/api/register-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          free: true,
          reference,
          eventId: event.id,
          eventTitle: event.topic,
          attendee_name: form.fullName.trim(),
          attendee_email: form.email.trim(),
          attendee_phone: form.phone.trim(),
          status: event.status ?? "Free",
          price: event.price ?? "₦0",
          currency: "NGN",
          unitPrice: 0,
          total: 0,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setErr(json?.error || "Could not save your registration. Please try again.");
        setPhase("failed");
        return;
      }
      setPhase("success");
      setTimeout(() => onClose(), 1500);
    } catch (e: any) {
      setErr(e?.message || "Network error. Please try again.");
      setPhase("failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setErr("Please enter your name, email, and WhatsApp phone.");
      return;
    }

    if (isFree) {
      await submitFreeRegistration();
      return;
    }

    if (!paystackReady || !window.PaystackPop) {
      setErr("Payment library not ready. Please try again.");
      return;
    }
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
    if (!/^pk_(test|live)_/i.test(key)) {
      setErr("Invalid Paystack public key.");
      return;
    }
    if (unitAmount <= 0) {
      setErr("This event has an invalid price.");
      return;
    }

    setPhase("paying");
    const reference = `evt_${event.id}_${Date.now()}`;
    const amountKobo = Math.max(100, Math.round(unitAmount * 100));

    try {
      const handler = window.PaystackPop.setup({
        key,
        email: form.email.trim(),
        amount: amountKobo,
        currency: "NGN",
        ref: reference,
        metadata: {
          event_id: event.id,
          event_title: event.topic ?? undefined,
          attendee_name: form.fullName.trim(),
          attendee_phone: form.phone.trim(),
        },
        callback: (response: any) => {
          setPhase("verifying");
          (async () => {
            try {
              const res = await fetch("/api/register-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  reference: response.reference,
                  eventId: event.id,
                  eventTitle: event.topic,
                  attendee_name: form.fullName.trim(),
                  attendee_email: form.email.trim(),
                  attendee_phone: form.phone.trim(),
                  status: event.status ?? "Paid",
                  price: event.price ?? `₦${unitAmount}`,
                  currency: "NGN",
                  unitPrice: unitAmount,
                  total: unitAmount,
                }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok || !json?.ok) {
                setErr(json?.error || "We could not verify your payment. If you were charged, contact support.");
                setPhase("failed");
                return;
              }
              setPhase("success");
              setTimeout(() => onClose(), 1500);
            } catch (e: any) {
              setErr("Network error while verifying payment. If you were charged, contact support.");
              setPhase("failed");
            }
          })();
        },
        onClose: () => { if (phase === "paying") setPhase("form"); },
      });

      handler.openIframe();
    } catch (e: any) {
      setErr(e?.message || "Could not open the payment window. Check your Paystack key and price.");
      setPhase("form");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-black text-white rounded-xl w-full max-w-md p-6 font-[Lato] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-sm text-white">Close ✕</button>

        <h2 className="text-xl font-semibold text-center">Register for {event?.topic ?? "Event"}</h2>
        <p className="text-sm text-gray-400 text-center mt-1">{isFree ? "This event is free to attend." : `Ticket price: ₦${unitAmount.toLocaleString()}`}</p>

        {err && (<div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{err}</div>)}
        {phase === "verifying" && (<div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">Processing your registration…</div>)}
        {phase === "success" && (<div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">✓ Registration successful.</div>)}
        {phase === "failed" && (<div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">We couldn’t complete your registration. Please try again.</div>)}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-sm mb-1">Full Name *</label>
            <input type="text" value={form.fullName} onChange={(e) => setF("fullName", e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="you@example.com" className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm mb-1">WhatsApp Phone No *</label>
            <input type="tel" value={form.phone} onChange={(e) => setF("phone", e.target.value)} placeholder="07012340000" className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:outline-none" required />
          </div>

          <button type="submit" disabled={phase === "paying" || phase === "verifying"} className="w-full bg-white text-black font-medium py-2 rounded-md mt-4 disabled:opacity-60">
            {isFree ? (phase === "verifying" ? "Submitting…" : "Submit")
              : phase === "paying" ? "Opening Paystack…" : phase === "verifying" ? "Verifying payment…" : "Proceed to payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
