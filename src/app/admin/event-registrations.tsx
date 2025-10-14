/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/admin/event-registrations.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowRight, ChevronDown, Mail } from "lucide-react";

type StatusFilter = "All" | "Paid" | "Free";

type RegRow = {
  id: string;
  created_at: string;
  attendee_email: string | null;
  attendee_name: string | null;
  attendee_phone: string | null;
  status: "Paid" | "Free" | string | null;
  display_price: string | null;
  event_id: string | null;
  event_title: string | null;

  // enriched from events table:
  event_date?: string | null;
  event_time?: string | null;
  hosting_url?: string | null; // for type
};

const PAGE_SIZE = 12;

function isLive(hosting_url?: string | null) {
  const s = (hosting_url || "").trim();
  return s.length > 8; // crude but works with your data
}
function asType(hosting_url?: string | null) {
  return isLive(hosting_url) ? "Live stream" : "In-person";
}

export default function EventRegistrations() {
  const [rows, setRows] = useState<RegRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const [q, setQ] = useState(""); // search by event_title
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allOnPageSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected[r.id]),
    [rows, selected]
  );
  const selectedRows = useMemo(() => rows.filter((r) => selected[r.id]), [rows, selected]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, q]);

  useEffect(() => {
    void fetchPaged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, q]);

  async function fetchPaged() {
    setLoading(true);
    try {
      // 1) Count
      let countQ = supabase.from("event_registrations").select("*", { count: "exact", head: true });
      if (statusFilter !== "All") countQ = countQ.eq("status", statusFilter);
      if (q.trim()) countQ = countQ.ilike("event_title", `%${q.trim()}%`);
      const { count: c } = await countQ;
      setCount(c || 0);

      // 2) Page data
      let listQ = supabase
        .from("event_registrations")
        .select(
          "id, created_at, attendee_email, attendee_name, attendee_phone, status, display_price, event_id, event_title"
        )
        .order("created_at", { ascending: false });

      if (statusFilter !== "All") listQ = listQ.eq("status", statusFilter);
      if (q.trim()) listQ = listQ.ilike("event_title", `%${q.trim()}%`);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await listQ.range(from, to);
      if (error) throw error;

      const baseRows = (data || []) as RegRow[];

      // 3) Enrich visible page with event details (date/time/hosting_url)
      const eventIds = Array.from(new Set(baseRows.map((r) => r.event_id).filter(Boolean))) as string[];
      let meta: Record<string, { event_date: string | null; event_time: string | null; hosting_url: string | null }> = {};
      if (eventIds.length) {
        const { data: evs } = await supabase
          .from("events")
          .select("id, event_date, event_time, hosting_url")
          .in("id", eventIds);
        for (const e of evs || []) {
          meta[e.id] = { event_date: e.event_date, event_time: e.event_time, hosting_url: e.hosting_url };
        }
      }

      const merged = baseRows.map((r) => ({
        ...r,
        event_date: meta[r.event_id || ""]?.event_date ?? null,
        event_time: meta[r.event_id || ""]?.event_time ?? null,
        hosting_url: meta[r.event_id || ""]?.hosting_url ?? null,
      }));

      setRows(merged);

      // keep selection for visible ids
      setSelected((prev) => {
        const next: Record<string, boolean> = {};
        for (const r of merged) if (prev[r.id]) next[r.id] = true;
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
    const t = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${mo} ${day}, ${yr} • ${t}`;
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

  function mailtoHref(r: RegRow) {
    const to = (r.attendee_email || "").trim();
    const subject = encodeURIComponent(`Your registration for "${r.event_title || "event"}"`);
    const body = encodeURIComponent(
      [
        `Hi${r.attendee_name ? " " + r.attendee_name : ""},`,
        "",
        `Thanks for registering for "${r.event_title || "the event"}".`,
        `Date: ${(r.event_date || "").trim()}  Time: ${(r.event_time || "").trim()}`,
        `Type: ${asType(r.hosting_url)}`,
        "",
        "If you have any questions, just reply here.",
        "",
        "Best regards,",
        "CDS Labs",
      ].join("\n")
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  // CSV (selected or current page)
  function toCsv(items: RegRow[]) {
    const headers = [
      "created_at",
      "attendee_email",
      "attendee_name",
      "attendee_phone",
      "event_id",
      "event_title",
      "event_date",
      "event_time",
      "event_type",
      "status",
      "display_price",
      "id",
    ];
    const lines = [headers.join(",")];
    for (const r of items) {
      const row = [
        r.created_at ?? "",
        r.attendee_email ?? "",
        r.attendee_name ?? "",
        r.attendee_phone ?? "",
        r.event_id ?? "",
        r.event_title ?? "",
        r.event_date ?? "",
        r.event_time ?? "",
        asType(r.hosting_url),
        r.status ?? "",
        r.display_price ?? "",
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
    a.download = `event-registrations-${statusFilter.toLowerCase()}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 px-6 md:px-8 pb-8">
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5">
        {/* Header Row */}
        <div className="flex items-center justify-between px-4 md:px-5 pt-4">
          <div className="text-base font-medium text-white">Event Register</div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search event title"
              className="w-56 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />

            {/* Status filter */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-[#C7CBD1]"
              >
                Status: <span className="text-white">{statusFilter}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md bg-[#151515] ring-1 ring-white/10 py-1 z-10">
                  {(["All", "Paid", "Free"] as StatusFilter[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setStatusFilter(opt);
                        setFilterOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm ${
                        statusFilter === opt ? "text-white" : "text-[#C7CBD1] hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CSV */}
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

        {/* Columns */}
        <div className="mt-4 px-4 md:px-5 pb-3">
          <div className="grid grid-cols-[28px_160px_1fr_170px_120px_170px_120px_120px] items-center gap-2 text-xs text-[#9AA0A6]">
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
            <div>Registered</div>
            <div>Email</div>
            <div>Full Name</div>
            <div>WhatsApp</div>
            <div>Event</div>
            <div>Type</div>
            <div className="text-right pr-1">Manage</div>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Rows */}
        {(loading ? [] : rows).map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-[28px_160px_1fr_170px_120px_170px_120px_120px] items-center gap-2 px-4 md:px-5 py-3 text-sm hover:bg-white/[0.02] border-t border-white/5 first:border-t-0"
          >
            {/* Select */}
            <div>
              <input
                type="checkbox"
                checked={!!selected[r.id]}
                onChange={() => toggleOne(r.id)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
            </div>

            {/* Registered at */}
            <div className="text-[#C7CBD1]">{formatDate(r.created_at)}</div>

            {/* Email */}
            <div className="text-white truncate">{r.attendee_email || "-"}</div>

            {/* Name */}
            <div className="text-white truncate">{r.attendee_name || "-"}</div>

            {/* WhatsApp */}
            <div className="text-white truncate">{r.attendee_phone || "-"}</div>

            {/* Event */}
            <div className="text-white truncate">
              {r.event_title || "-"}
              <div className="text-xs text-[#9AA0A6]">
                {(r.event_date || "").trim()} {(r.event_time ? "• " + r.event_time : "")}
              </div>
            </div>

            {/* Type */}
            <div>
              <span className={`inline-flex items-center rounded-full ${isLive(r.hosting_url) ? "bg-[#2D6FFF]/20 text-[#8FB2FF]" : "bg-[#0ED678]/20 text-[#0ED678]"} px-2.5 py-0.5 text-xs`}>
                {asType(r.hosting_url)}
              </span>
            </div>

            {/* Manage */}
            <div className="flex items-center justify-end gap-2 pr-1">
              <a
                href={mailtoHref(r)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#1A1A1A] px-3 py-1.5 text-sm text-white ring-1 ring-white/10"
                title="Email attendee"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            </div>
          </div>
        ))}

        {!loading && rows.length === 0 && (
          <div className="px-5 py-6 text-sm text-[#9AA0A6]">No registrations found.</div>
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
        Sorted by <span className="text-white">latest registration</span>. Filter by <span className="text-white">Paid</span> or <span className="text-white">Free</span>.
      </div>
    </div>
  );
}
