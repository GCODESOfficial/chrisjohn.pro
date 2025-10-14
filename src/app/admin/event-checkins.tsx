/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/admin/event-checkins.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowRight, ChevronDown, Mail, Check } from "lucide-react";

type TypeFilter = "In-person" | "Live stream" | "All";

type CheckinRow = {
  id: string;
  created_at: string;
  attendee_email: string | null;
  event_id: string | null;
  ticket_id: string | null;

  // enrich:
  attendee_name?: string | null;
  event_title?: string | null;
  hosting_url?: string | null;
};

const PAGE_SIZE = 20;

function isLive(hosting_url?: string | null) {
  const s = (hosting_url || "").trim();
  return s.length > 8;
}
function asType(hosting_url?: string | null) {
  return isLive(hosting_url) ? "Live stream" : "In-person";
}

export default function EventCheckins() {
  const [rows, setRows] = useState<CheckinRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState(""); // search by event title (client-side on page)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("In-person"); // default focus
  const [filterOpen, setFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // ==== Selection (like registrations) ====
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  // Visible rows after filter/search:
  const displayRows = useMemo(() => {
    let list = rows;
    if (typeFilter !== "All") {
      list = list.filter((r) => (typeFilter === "In-person" ? !isLive(r.hosting_url) : isLive(r.hosting_url)));
    }
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((r) => (r.event_title || "").toLowerCase().includes(s));
    return list;
  }, [rows, q, typeFilter]);

  const allOnPageSelected = useMemo(
    () => displayRows.length > 0 && displayRows.every((r) => selected[r.id]),
    [displayRows, selected]
  );
  const selectedRows = useMemo(() => displayRows.filter((r) => selected[r.id]), [displayRows, selected]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  useEffect(() => {
    void fetchPaged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchPaged() {
    setLoading(true);
    try {
      // count (raw checkins)
      const { count: c } = await supabase.from("event_checkins").select("*", { count: "exact", head: true });
      setCount(c || 0);

      // page
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("event_checkins")
        .select("id, created_at, attendee_email, event_id, ticket_id")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;

      const baseRows = (data || []) as CheckinRow[];

      // enrich with (1) event meta and (2) attendee name via registrations
      const eventIds = Array.from(new Set(baseRows.map((r) => r.event_id).filter(Boolean))) as string[];
      let evMeta: Record<string, { topic: string | null; hosting_url: string | null }> = {};
      if (eventIds.length) {
        const { data: evs } = await supabase.from("events").select("id, topic, hosting_url").in("id", eventIds);
        for (const e of evs || []) evMeta[e.id] = { topic: e.topic, hosting_url: e.hosting_url };
      }

      // Try to get attendee_name by (event_id + email) from registrations (best-effort)
      let nameMeta: Record<string, string | null> = {};
      const pairs = baseRows
        .map((r) => ({ event_id: r.event_id, attendee_email: r.attendee_email }))
        .filter((p) => p.event_id && p.attendee_email) as { event_id: string; attendee_email: string }[];
      if (pairs.length) {
        const seen = new Set<string>();
        const unique = pairs.filter((p) => {
          const key = `${p.event_id}|${p.attendee_email}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // fetch names in chunks
        const chunks: { event_id: string; attendee_email: string }[][] = [];
        for (let i = 0; i < unique.length; i += 50) chunks.push(unique.slice(i, i + 50));

        for (const chunk of chunks) {
          const evIds = Array.from(new Set(chunk.map((c) => c.event_id)));
          const { data: regs } = await supabase
            .from("event_registrations")
            .select("event_id, attendee_email, attendee_name")
            .in("event_id", evIds);
          for (const r of regs || []) {
            const key = `${r.event_id}|${(r.attendee_email || "").toLowerCase()}`;
            if (!(key in nameMeta)) nameMeta[key] = r.attendee_name ?? null;
          }
        }
      }

      const merged = baseRows.map((r) => {
        const ev = evMeta[r.event_id || ""];
        const key = `${r.event_id}|${(r.attendee_email || "").toLowerCase()}`;
        return {
          ...r,
          event_title: ev?.topic ?? null,
          hosting_url: ev?.hosting_url ?? null,
          attendee_name: nameMeta[key] ?? null,
        };
      });

      setRows(merged);

      // keep selection only for visible ids after fetch
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

  function mailtoHref(r: CheckinRow) {
    const to = (r.attendee_email || "").trim();
    const subject = encodeURIComponent(`Thanks for attending "${r.event_title || "our event"}"`);
    const body = encodeURIComponent(
      [
        `Hi${r.attendee_name ? " " + r.attendee_name : ""},`,
        "",
        "Great to have you at the event today!",
        "",
        "Best regards,",
        "CDS Labs",
      ].join("\n")
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  // Select all on current filtered page
  function toggleSelectAllOnPage() {
    setSelected((prev) => {
      const next = { ...prev };
      const target = !allOnPageSelected;
      for (const r of displayRows) next[r.id] = target;
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toCsv(items: CheckinRow[]) {
    const headers = ["created_at", "attendee_email", "attendee_name", "event_id", "event_title", "event_type", "ticket_id", "id"];
    const lines = [headers.join(",")];
    for (const r of items) {
      const row = [
        r.created_at ?? "",
        r.attendee_email ?? "",
        r.attendee_name ?? "",
        r.event_id ?? "",
        r.event_title ?? "",
        asType(r.hosting_url),
        r.ticket_id ?? "",
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
    const items = selectedRows.length ? selectedRows : displayRows.length ? displayRows : rows;
    const csv = toCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `event-checkins-${typeFilter.replace(/\s+/g, "-").toLowerCase()}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 px-6 md:px-8 pb-8">
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-5 pt-4">
          <div className="text-base font-medium text-white">Event Check-in</div>

          <div className="flex items-center gap-3">
            {/* Search (event title) */}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search event title"
              className="w-56 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />

            {/* Type filter (defaults to In-person) */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-[#C7CBD1]"
              >
                Type: <span className="text-white">{typeFilter}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md bg-[#151515] ring-1 ring-white/10 py-1 z-10">
                  {(["In-person", "Live stream", "All"] as TypeFilter[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setTypeFilter(opt);
                        setFilterOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm ${
                        typeFilter === opt ? "text-white" : "text-[#C7CBD1] hover:text-white"
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
              disabled={loading || (!rows.length && !displayRows.length)}
              className="rounded-lg bg-white text-black px-3 py-2 text-sm font-medium disabled:opacity-60"
              title={selectedRows.length ? "Download selected as CSV" : "Download current page as CSV"}
            >
              Download CSV{selectedRows.length ? ` (${selectedRows.length})` : ""}
            </button>
          </div>
        </div>

        {/* Columns (added select column) */}
        <div className="mt-4 px-4 md:px-5 pb-3">
          <div className="grid grid-cols-[28px_160px_1fr_170px_170px_120px_120px] items-center gap-2 text-xs text-[#9AA0A6]">
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
            <div>Checked-in</div>
            <div>Email</div>
            <div>Name</div>
            <div>Event</div>
            <div>Type</div>
            <div className="text-right pr-1">Manage</div>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Rows */}
        {(loading ? [] : displayRows).map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-[28px_160px_1fr_170px_170px_120px_120px] items-center gap-2 px-4 md:px-5 py-3 text-sm hover:bg-white/[0.02] border-t border-white/5 first:border-t-0"
          >
            {/* Select */}
            <div>
              <input
                type="checkbox"
                checked={!!selected[r.id]}
                onChange={() => toggleOne(r.id)}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
                aria-label="Select row"
              />
            </div>

            {/* Date */}
            <div className="text-[#C7CBD1]">{formatDate(r.created_at)}</div>

            {/* Email */}
            <div className="text-white truncate">{r.attendee_email || "-"}</div>

            {/* Name */}
            <div className="text-white truncate">{r.attendee_name || "-"}</div>

            {/* Event */}
            <div className="text-white truncate">{r.event_title || "-"}</div>

            {/* Type */}
            <div>
              <span
                className={`inline-flex items-center rounded-full ${
                  isLive(r.hosting_url) ? "bg-[#2D6FFF]/20 text-[#8FB2FF]" : "bg-[#0ED678]/20 text-[#0ED678]"
                } px-2.5 py-0.5 text-xs`}
              >
                {asType(r.hosting_url)}
              </span>
            </div>

            {/* Manage: auto attended ✓ + email */}
            <div className="flex items-center justify-end gap-2 pr-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#9AA0A6]" title="Attended">
                <Check className="w-4 h-4" /> Attended
              </span>
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

        {!loading && displayRows.length === 0 && (
          <div className="px-5 py-6 text-sm text-[#9AA0A6]">No check-ins found.</div>
        )}

        {/* Pagination (server-side; rows filtered client-side) */}
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
        Sorted by <span className="text-white">latest check-in</span>. Default filter focuses on <span className="text-white">In-person</span>.
      </div>
    </div>
  );
}
