/* app/admin/events.tsx */
"use client";

import { ArrowLeft, ArrowRight, Calendar, ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AddEvents from "./addevents";

type Tab = "Works" | "Books" | "Events";
type StatusFilter = "All" | "Free" | "Paid";

type EventsProps = {
  onNav?: (t: Tab) => void;
  onAddNew?: () => void; // optional: parent can still control "Add New"
};

type EventListRow = {
  id: string;
  created_at: string;
  topic: string | null;
  status: "Free" | "Paid" | null;
  price: string | null;
  cover_url?: string | null;
};

type EventRowFull = {
  id: string;
  topic: string | null;
  event_date: string | null;
  event_time: string | null;
  status: "Free" | "Paid" | null;
  price: string | null;
  host_name: string | null;
  x_link: string | null;
  instagram_link: string | null;
  about: string | null;
  cover_url: string | null;
  hosting_url: string | null;
};

const PAGE_SIZE = 8;

function parseSupabasePublicUrl(url?: string | null): { bucket: string; path: string } | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

export default function Events({ onAddNew }: EventsProps) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [sortOpen, setSortOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<EventListRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // NEW: edit-mode state (mirrors Books)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInitial, setEditingInitial] = useState<EventRowFull | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  useEffect(() => {
    setPage(1);
  }, [q, filter]);

  useEffect(() => {
    if (editingId) return; // pause list fetch while editing, like Books
    void fetchPaged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, filter, editingId]);

  async function fetchPaged() {
    setLoading(true);
    try {
      let c = supabase.from("events").select("*", { count: "exact", head: true });
      if (filter !== "All") c = c.eq("status", filter);
      if (q.trim()) c = c.ilike("topic", `%${q.trim()}%`);
      const { count: ct } = await c;
      setCount(ct || 0);

      let qy = supabase
        .from("events")
        .select("id, created_at, topic, status, price, cover_url")
        .order("created_at", { ascending: false });

      if (filter !== "All") qy = qy.eq("status", filter);
      if (q.trim()) qy = qy.ilike("topic", `%${q.trim()}%`);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await qy.range(from, to);
      if (error) throw error;
      setRows((data || []) as EventListRow[]);
    } catch (e) {
      console.error(e);
      setRows([]);
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

  async function handleDelete(id: string) {
    const ok = confirm("Delete this event and its cover file?");
    if (!ok) return;
    try {
      const { data } = await supabase.from("events").select("cover_url").eq("id", id).single();

      const { error: delErr } = await supabase.from("events").delete().eq("id", id);
      if (delErr) throw delErr;

      setRows((prev) => prev.filter((r) => r.id !== id));
      setCount((c) => Math.max(0, c - 1));

      const p = parseSupabasePublicUrl(data?.cover_url || undefined);
      if (p) {
        try {
          await supabase.storage.from(p.bucket).remove([p.path]);
        } catch (e) {
          console.warn("storage remove failed", p.bucket, e);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete.");
      await fetchPaged();
    }
  }

  // NEW: Edit just like Books
  async function handleEdit(id: string) {
    setEditingId(id);
    setEditingInitial(null);
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, topic, event_date, event_time, status, price, host_name, x_link, instagram_link, about, cover_url, hosting_url"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("Failed to load event.");
      setEditingId(null);
      return;
    }
    setEditingInitial(data as EventRowFull);
  }

  function backFromEdit() {
    setEditingId(null);
    setEditingInitial(null);
    void fetchPaged();
  }

  // When editing, render the AddEvents form with initial values (like Books -> AddBooks)
  if (editingId) {
    const mappedInitial =
      editingInitial
        ? {
            id: editingInitial.id,
            topic: editingInitial.topic ?? undefined,
            event_date: editingInitial.event_date ?? undefined,
            event_time: editingInitial.event_time ?? undefined,
            status: (editingInitial.status as "Free" | "Paid" | null) ?? undefined,
            price: editingInitial.price ?? undefined,
            host_name: editingInitial.host_name ?? undefined,
            x_link: editingInitial.x_link ?? undefined,
            instagram_link: editingInitial.instagram_link ?? undefined,
            about: editingInitial.about ?? undefined,
            cover_url: editingInitial.cover_url ?? null,
            hosting_url: editingInitial.hosting_url ?? undefined,
          }
        : undefined;

    return <AddEvents onBack={backFromEdit} initial={mappedInitial} />;
  }

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 px-6 md:px-8 pb-8">
      {/* Left column */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5">
        {/* Search + Sort */}
        <div className="mt-4 px-4 md:px-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg bg-[#141414] ring-1 ring-white/10 px-9 py-2.5 text-sm placeholder:text-[#7A7F87] outline-none focus:ring-white/20"
                placeholder="Search event topic"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none" />
            </div>

            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-[#C7CBD1]"
              >
                Sort by: <span className="text-white">{filter}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-md bg-[#151515] ring-1 ring-white/10 py-1">
                  {(["All", "Free", "Paid"] as StatusFilter[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setFilter(r);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm ${
                        filter === r ? "text-white" : "text-[#C7CBD1] hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          <div className="grid grid-cols-[140px_1fr_120px_120px_120px] items-center gap-2 px-4 md:px-5 py-3 text-xs text-[#9AA0A6]">
            <div>Date</div>
            <div>Topic</div>
            <div>Status</div>
            <div>Price</div>
            <div className="text-right pr-2">Manage</div>
          </div>
          <div className="h-px bg-white/5" />

          {(loading ? [] : rows).map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[140px_1fr_120px_120px_120px] items-center gap-2 px-4 md:px-5 py-3 text-sm hover:bg-white/[0.02] border-t border-white/5 first:border-t-0"
            >
              <div className="text-[#C7CBD1]">{formatDate(r.created_at)}</div>
              <div className="text-white">{r.topic || "-"}</div>
              <div>
                {r.status === "Paid" ? (
                  <span className="inline-flex items-center rounded-full bg-[#FF8A00]/20 px-2.5 py-0.5 text-xs text-[#FF8A00]">
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#0ED678]/20 px-2.5 py-0.5 text-xs text-[#0ED678]">
                    Free
                  </span>
                )}
              </div>
              <div className="font-semibold">{r.price || "-"}</div>
              <div className="flex items-center justify-end gap-3 pr-1">
                <button
                  className="rounded-md bg-[#1A1A1A] px-3 py-1.5 text-sm text-white ring-1 ring-white/10"
                  onClick={() => handleEdit(r.id)}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  aria-label="remove"
                  className="grid place-items-center h-6 w-6 rounded-full border border-red-500"
                  title="Delete"
                >
                  <span className="text-red-500 -mt-0.5 text-base leading-none">–</span>
                </button>
              </div>
            </div>
          ))}

          {!loading && rows.length === 0 && (
            <div className="px-5 py-6 text-sm text-[#9AA0A6]">No events found.</div>
          )}
        </div>

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

      {/* Right column card */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-6 grid place-items-center text-center">
        <div className="grid place-items-center gap-4">
          <div className="grid place-items-center h-16 w-16 rounded-xl bg-[#151515] ring-1 ring-white/10">
            <Calendar className="w-8 h-8 opacity-90" />
          </div>
          <div>
            <div className="text-lg font-medium">Add a New Event</div>
            <div className="mt-1 text-xs text-[#AEB4BB] max-w-[240px] leading-5">
              Create and share upcoming events. Let your audience stay informed and engaged with what&apos;s next.
            </div>
          </div>
          <button
            onClick={() =>
              onAddNew
                ? onAddNew()
                : alert("Wire onAddNew in AdminDashboard to open AddEvents, or inline-create here if preferred.")
            }
            className="inline-flex items-center gap-2 rounded-md bg-white text-black px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add New Event
          </button>
        </div>
      </div>
    </div>
  );
}
