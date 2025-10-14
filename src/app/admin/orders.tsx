/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/admin/orders.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Mail } from "lucide-react";

type Format = "Hardcover" | "PDF" | "Audio";
type FilterOpt = "All" | Format;

type OrderRow = {
  id: string;
  created_at: string;
  buyer_email: string | null;
  book_title: string | null;
  format: Format | null;
  quantity: number | null;
  delivered: boolean | null;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  unit_price?: number | null;
  total?: number | null;
  reference?: string | null;
};

const PAGE_SIZE = 12;

export default function AdminOrders() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formatFilter, setFormatFilter] = useState<FilterOpt>("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allOnPageSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected[r.id]),
    [rows, selected]
  );

  // the UI checkbox state
  const [deliveredDraft, setDeliveredDraft] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPage(1);
  }, [formatFilter]);

  useEffect(() => {
    void fetchPaged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, formatFilter]);

  async function fetchPaged() {
    setLoading(true);
    try {
      // count
      let countQ = supabase.from("book_purchases").select("*", { count: "exact", head: true });
      if (formatFilter !== "All") countQ = countQ.eq("format", formatFilter);
      const { count: c } = await countQ;
      setCount(c || 0);

      // data
      let listQ = supabase
        .from("book_purchases")
        .select(`
          id,
          created_at,
          buyer_email,
          email,
          full_name,
          buyer_name,
          buyer_phone,
          phone,
          format,
          quantity,
          delivered,
          address:shipping_address,
          notes,
          unit_price,
          total:total_amount,
          reference:payment_ref,
          book_id,
          books:books(title)
        `)
        .order("created_at", { ascending: false });

      if (formatFilter !== "All") listQ = listQ.eq("format", formatFilter);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await listQ.range(from, to);
      if (error) throw error;

      const mapped: OrderRow[] =
        (data as any[])?.map((d) => ({
          id: d.id,
          created_at: d.created_at,
          buyer_email: d.buyer_email ?? d.email ?? null,
          full_name: d.full_name ?? d.buyer_name ?? null,
          phone: d.phone ?? d.buyer_phone ?? null,
          book_title: d.books?.title ?? null,
          format: d.format ?? null,
          quantity: d.quantity ?? null,
          delivered: d.delivered ?? null,
          address: d.address ?? null,
          notes: d.notes ?? null,
          unit_price: d.unit_price ?? null,
          total: d.total ?? null,
          reference: d.reference ?? null,
        })) ?? [];

      setRows(mapped);

      // ✅ Initialize draft to reflect your rules:
      // Hardcover: false unless DB true (then true)
      // Digital: always true in UI
      setDeliveredDraft(() => {
        const next: Record<string, boolean> = {};
        for (const r of mapped) {
          if (r.format === "Hardcover") {
            next[r.id] = r.delivered === true ? true : false;
          } else {
            next[r.id] = true; // PDF/Audio
          }
        }
        return next;
      });

      // keep selection for visible ids
      setSelected((prev) => {
        const next: Record<string, boolean> = {};
        for (const r of mapped) if (prev[r.id]) next[r.id] = true;
        return next;
      });
    } catch (e) {
      console.error(e);
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const mo = d.toLocaleString("en-US", { month: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    const yr = d.getFullYear();
    return `${mo} ${day}, ${yr}`;
  }

  function setDeliveredDraftFor(id: string, val: boolean) {
    setDeliveredDraft((prev) => ({ ...prev, [id]: val }));
  }

  // Persist delivered for Hardcover when "Submit" is clicked
  async function submitDelivered(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row || row.format !== "Hardcover") return;

    const dbDelivered = row.delivered === true;
    const draft = deliveredDraft[id] === true;

    // Only allow false -> true
    if (!(draft && !dbDelivered)) return;

    // optimistic
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, delivered: true } : r)));

    try {
      const res = await fetch("/api/admin/orders/delivered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id, delivered: true }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to update");

      // lock UI too
      setDeliveredDraft((prev) => ({ ...prev, [id]: true }));
    } catch (e) {
      console.error(e);
      // revert on error
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, delivered: false } : r)));
      alert("Failed to update delivery status.");
    }
  }

  function mailtoHref(r: OrderRow) {
    const to = (r.buyer_email || "").trim();
    const subject = encodeURIComponent(`Your "${r.book_title || "book"}" order`);
    const body = encodeURIComponent(
      [
        `Hi${r.full_name ? " " + r.full_name : ""},`,
        "",
        `Thanks for your order of "${r.book_title || "the book"}" (${r.format || "-"}) x${r.quantity ?? 1}.`,
        r.format === "Hardcover"
          ? "We’re confirming your delivery window now and will update you shortly."
          : "Your digital copy was sent to your email. Let us know if you need it resent.",
        "",
        "Best regards,",
        "CDS Labs",
      ].join("\n")
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const next = { ...prev };
      const target = !allOnPageSelected;
      for (const r of rows) next[r.id] = target;
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  const selectedRows = useMemo(() => rows.filter((r) => selected[r.id]), [rows, selected]);

  // CSV: Digital = YES; Hardcover uses DB value
  function toCsv(items: OrderRow[]) {
    const headers = [
      "created_at","buyer_email","full_name","phone","book_title","format","quantity","delivered",
      "address","notes","unit_price","total","reference","id",
    ];
    const lines = [headers.join(",")];
    for (const r of items) {
      const effectiveDelivered = r.format === "Hardcover" ? !!r.delivered : true;
      const row = [
        r.created_at ?? "",
        r.buyer_email ?? "",
        r.full_name ?? "",
        r.phone ?? "",
        r.book_title ?? "",
        r.format ?? "",
        (r.quantity ?? "").toString(),
        effectiveDelivered ? "YES" : "NO",
        (r.address ?? "").replace(/\n/g, " "),
        (r.notes ?? "").replace(/\n/g, " "),
        (r.unit_price ?? "").toString(),
        (r.total ?? "").toString(),
        r.reference ?? "",
        r.id,
      ].map((field) => {
        const s = String(field);
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      });
      lines.push(row.join(","));
    }
    return lines.join("\n");
  }

  function downloadCsv() {
    const items = selectedRows.length ? selectedRows : rows;
    const csv = toCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `orders-${formatFilter.toLowerCase()}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 px-6 md:px-8 pb-8">
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5">
        {/* Header Row */}
        <div className="flex items-center justify-between px-4 md:px-5 pt-4">
          <div className="text-base font-medium text-white">Orders</div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-[#C7CBD1]"
              >
                Format: <span className="text-white">{formatFilter}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md bg-[#151515] ring-1 ring-white/10 py-1 z-10">
                  {(["All", "Hardcover", "PDF", "Audio"] as FilterOpt[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setFormatFilter(opt);
                        setFilterOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm ${
                        formatFilter === opt ? "text-white" : "text-[#C7CBD1] hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={downloadCsv}
              disabled={loading || (!rows.length && !selectedRows.length)}
              className="rounded-lg bg-white text-black px-3 py-2 text-sm font-medium disabled:opacity-60"
              title={selectedRows.length ? "Download selected as CSV" : "Download current page as CSV"}
            >
              Download CSV{selectedRows.length ? ` (${selectedRows.length})` : ""}
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="mt-4 px-4 md:px-5 pb-3">
          <div className="grid grid-cols-[28px_130px_1fr_140px_100px_160px_140px] items-center gap-2 text-xs text-[#9AA0A6]">
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAllOnPage}
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
              </label>
            </div>
            <div>Date</div>
            <div>Email</div>
            <div>Book Title</div>
            <div>Format</div>
            <div>Qty & Delivered</div>
            <div className="text-right pr-1">Manage</div>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Rows */}
        {(loading ? [] : rows).map((r) => {
          const isHardcover = r.format === "Hardcover";
          const dbDelivered = r.delivered === true;

          // Draft for current render:
          const draftVal =
            deliveredDraft[r.id] ??
            (isHardcover ? (dbDelivered ? true : false) : true);

          // Show Submit only when ticking Hardcover from false -> true
          const showSubmit = isHardcover && !dbDelivered && draftVal === true;

          return (
            <div
              key={r.id}
              className="grid grid-cols-[28px_130px_1fr_140px_100px_160px_140px] items-center gap-2 px-4 md:px-5 py-3 text-sm hover:bg-white/[0.02] border-t border-white/5 first:border-t-0"
            >
              {/* Select (for CSV, optional future bulk) */}
              <div>
                <input
                  type="checkbox"
                  checked={!!selected[r.id]}
                  onChange={() => toggleOne(r.id)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
              </div>

              {/* Date */}
              <div className="text-[#C7CBD1]">{formatDate(r.created_at)}</div>

              {/* Email */}
              <div className="text-white truncate">{r.buyer_email || "-"}</div>

              {/* Title */}
              <div className="text-white truncate">{r.book_title || "-"}</div>

              {/* Format */}
              <div>
                <span className="inline-flex items-center rounded-md bg-[#1A1A1A] ring-1 ring-white/10 px-2 py-1 text-xs">
                  {r.format || "-"}
                </span>
              </div>

              {/* Qty + Delivered */}
              <div className="flex items-center gap-3">
                <span className="font-medium">{r.quantity ?? 1}</span>

                {isHardcover ? (
                  dbDelivered ? (
                    // Already delivered: lock it
                    <label className="inline-flex items-center gap-1.5" title="Already delivered">
                      <input type="checkbox" checked disabled className="h-4 w-4 rounded border-white/20 bg-transparent" />
                      <span className="text-xs text-[#9AA0A6]">Delivered</span>
                    </label>
                  ) : (
                    // Not yet delivered: start unchecked; user can tick
                    <label className="inline-flex items-center gap-1.5" title="Mark delivered (Hardcover only)">
                      <input
                        type="checkbox"
                        checked={!!draftVal}
                        onChange={(e) => setDeliveredDraftFor(r.id, e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent"
                      />
                      <span className="text-xs text-[#9AA0A6]">Delivered</span>
                    </label>
                  )
                ) : (
                  // Digital always delivered in UI
                  <label className="inline-flex items-center gap-1.5" title="Digital orders are delivered by default">
                    <input type="checkbox" checked disabled className="h-4 w-4 rounded border-white/20 bg-transparent" />
                    <span className="text-xs text-[#9AA0A6]">Delivered</span>
                  </label>
                )}
              </div>

              {/* Manage */}
              <div className="flex items-center justify-end gap-2 pr-1">
                {showSubmit && (
                  <button
                    onClick={() => submitDelivered(r.id)}
                    className="rounded-md bg-white text-black px-3 py-1.5 text-xs font-medium"
                    title="Submit delivery status"
                  >
                    Submit
                  </button>
                )}

                <a
                  href={mailtoHref(r)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#1A1A1A] px-3 py-1.5 text-sm text-white ring-1 ring-white/10"
                  title="Email buyer"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </div>
            </div>
          );
        })}

        {!loading && rows.length === 0 && (
          <div className="px-5 py-6 text-sm text-[#9AA0A6]">No orders found.</div>
        )}

        {/* Pagination */}
        <div className="px-4 md:px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-md bg-[#171717] ring-1 ring-white/10 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 min-w-8 rounded-md ring-1 ring-white/10 px-2 text-sm ${
                  p === page ? "bg-white text-black" : "bg-[#171717] text-[#C7CBD1]"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="grid h-8 w-8 place-items-center rounded-md bg-[#171717] ring-1 ring-white/10 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tiny legend */}
      <div className="text-xs text-[#8B9198]">
        <div className="inline-flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> PDF/Audio are delivered by default. For <span className="text-white">Hardcover</span>,
          tick <span className="text-white">Delivered</span> then press <span className="text-white">Submit</span> to save.
        </div>
      </div>
    </div>
  );
}
