/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/admin/page.tsx */
"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AddWork } from "./addwork";
import Books from "./books";
import AddBooks from "./addbooks";
import Events from "./events";
import AddEvents from "./addevents";
import Orders from "./orders";
import EventRegistrations from "./event-registrations";
import EventCheckins from "./event-checkins";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Tab = "Works" | "Books" | "Events" | "Orders" | "Event Register" | "Event Check-in";
type RoleFilter = "All" | "Brand Designer" | "Product Designer" | "Consultant";

type WorkListRow = {
  id: string;
  created_at: string;
  project_name: string | null;
  role: string | null;
  cover_url?: string | null;
};

type WorkRowFull = {
  id: string;
  role: string | null;
  schedule: string | null;
  project_name: string | null;
  brief: string | null;
  cover_url: string | null;
  media_data:
    | Array<{
        url: string;
        type: "image" | "video";
        position: number;
        isFullWidth: boolean;
        expandedLevel: number;
      }>
    | null;
};

const PAGE_SIZE = 8;

/** Parse a Supabase public URL into { bucket, path } so we can delete files from storage */
function parseSupabasePublicUrl(url?: string | null): { bucket: string; path: string } | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

/** Tiny hook: animate numbers from old -> new to “depict the number” while loading */
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState<number>(target);
  const prevRef = useRef<number>(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;
    prevRef.current = to;

    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("Works");

  // Works state
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [editingInitial, setEditingInitial] = useState<WorkRowFull | null>(null);

  const [works, setWorks] = useState<WorkListRow[]>([]);
  const [worksCount, setWorksCount] = useState<number>(0);
  const [loadingWorks, setLoadingWorks] = useState(false);

  // Books stat count
  const [booksCount, setBooksCount] = useState<number>(0);
  const [loadingBooksCount, setLoadingBooksCount] = useState<boolean>(false);

  // Events stat counts (animated)
  const [eventsFreeCount, setEventsFreeCount] = useState<number>(0);
  const [eventsPaidCount, setEventsPaidCount] = useState<number>(0);
  const [loadingEventsCounts, setLoadingEventsCounts] = useState<boolean>(true);
  const [eventsReady, setEventsReady] = useState<boolean>(false);

  // Orders stat count
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [loadingOrdersCount, setLoadingOrdersCount] = useState<boolean>(false);

  // filters
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [sortOpen, setSortOpen] = useState(false);

  // pagination
  const [page, setPage] = useState(1);

  // Books / Events add toggles
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // ---- SIGN OUT ----
  async function handleSignOut() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  }

  // ---- BOOKS COUNT ----
  async function fetchBooksCount() {
    try {
      setLoadingBooksCount(true);
      const { count, error } = await supabase.from("books").select("*", { count: "exact", head: true });
      if (error) throw error;
      setBooksCount(count || 0);
    } catch (e) {
      console.error(e);
      setBooksCount(0);
    } finally {
      setLoadingBooksCount(false);
    }
  }
  useEffect(() => {
    void fetchBooksCount();
    const channel = supabase
      .channel("books_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "books" }, () => {
        void fetchBooksCount();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    if (!isAddingBook) void fetchBooksCount();
  }, [isAddingBook]);

  // ---- EVENTS COUNTS ----
  async function fetchEventsCounts() {
    try {
      setLoadingEventsCounts(true);
      const freeQ = supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "Free");
      const paidQ = supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "Paid");
      const [{ count: freeCount, error: freeErr }, { count: paidCount, error: paidErr }] = await Promise.all([
        freeQ,
        paidQ,
      ]);
      if (freeErr) throw freeErr;
      if (paidErr) throw paidErr;
      setEventsFreeCount(freeCount || 0);
      setEventsPaidCount(paidCount || 0);
      setEventsReady(true);
    } catch (e) {
      console.error(e);
      setEventsFreeCount(0);
      setEventsPaidCount(0);
    } finally {
      setLoadingEventsCounts(false);
    }
  }
  useEffect(() => {
    void fetchEventsCounts();
    const channel = supabase
      .channel("events_counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        void fetchEventsCounts();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    if (!isAddingEvent) void fetchEventsCounts();
  }, [isAddingEvent]);

  // ---- ORDERS COUNT ----
  async function fetchOrdersCount() {
    try {
      setLoadingOrdersCount(true);
      const { count, error } = await supabase.from("book_purchases").select("*", { count: "exact", head: true });
      if (error) throw error;
      setOrdersCount(count || 0);
    } catch (e) {
      console.error(e);
      setOrdersCount(0);
    } finally {
      setLoadingOrdersCount(false);
    }
  }
  useEffect(() => {
    void fetchOrdersCount();
    const channel = supabase
      .channel("orders_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "book_purchases" }, () => {
        void fetchOrdersCount();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // ---- WORKS LIST + COUNT ----
  useEffect(() => {
    if (activeTab !== "Works") return;
    if (isAddingWork) return;
    void fetchPagedWorks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAddingWork, page, q, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [q, roleFilter]);

  async function fetchPagedWorks() {
    setLoadingWorks(true);
    try {
      let countQuery = supabase.from("works").select("*", { count: "exact", head: true });
      if (roleFilter !== "All") countQuery = countQuery.eq("role", roleFilter);
      if (q.trim()) countQuery = countQuery.ilike("project_name", `%${q.trim()}%`);
      const { count } = await countQuery;
      setWorksCount(count || 0);

      let listQuery = supabase
        .from("works")
        .select("id, created_at, project_name, role, cover_url")
        .order("created_at", { ascending: false });

      if (roleFilter !== "All") listQuery = listQuery.eq("role", roleFilter);
      if (q.trim()) listQuery = listQuery.ilike("project_name", `%${q.trim()}%`);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await listQuery.range(from, to);
      if (error) throw error;
      setWorks((data || []) as WorkListRow[]);
    } catch (e) {
      console.error(e);
      setWorks([]);
    } finally {
      setLoadingWorks(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(worksCount / PAGE_SIZE));

  function formatDate(iso: string) {
    const d = new Date(iso);
    const mo = d.toLocaleString("en-US", { month: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    const yr = d.getFullYear();
    return `${mo} ${day}, ${yr}`;
  }

  async function handleDeleteWork(id: string) {
    const ok = confirm("Delete this work and its files?");
    if (!ok) return;

    try {
      const { data, error } = await supabase
        .from("works")
        .select("cover_url, media_data")
        .eq("id", id)
        .single();
      if (error) throw error;

      const { error: delErr } = await supabase.from("works").delete().eq("id", id);
      if (delErr) throw delErr;

      setWorks((prev) => prev.filter((w) => w.id !== id));
      setWorksCount((c) => Math.max(0, c - 1));

      const toRemove: Record<string, string[]> = {};
      const add = (url?: string | null) => {
        const p = parseSupabasePublicUrl(url || undefined);
        if (!p) return;
        toRemove[p.bucket] ??= [];
        toRemove[p.bucket].push(p.path);
      };

      add(data?.cover_url);
      (data?.media_data || []).forEach((m: any) => add(m?.url));

      await Promise.all(
        Object.entries(toRemove).map(async ([bucket, paths]) => {
          try {
            await supabase.storage.from(bucket).remove(paths);
          } catch (e) {
            console.warn("storage remove failed", bucket, e);
          }
        })
      );
    } catch (e) {
      console.error(e);
      alert("Failed to delete.");
      await fetchPagedWorks();
    }
  }

  async function handleEditWork(id: string) {
    setIsAddingWork(true);
    setEditingInitial(null);

    const { data, error } = await supabase
      .from("works")
      .select("id, role, schedule, project_name, brief, cover_url, media_data")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("Failed to load work for editing.");
      setIsAddingWork(false);
      return;
    }
    setEditingInitial(data as WorkRowFull);
  }

  function backFromWork() {
    setIsAddingWork(false);
    setEditingInitial(null);
    void fetchPagedWorks();
  }

  const animFree = useCountUp(eventsFreeCount);
  const animPaid = useCountUp(eventsPaidCount);
  const animTotal = Math.max(0, animFree + animPaid);
  const freePct = animTotal > 0 ? Math.round((animFree / animTotal) * 100) : 0;

  const addWorkInitial =
    editingInitial
      ? {
          id: editingInitial.id,
          role: editingInitial.role ?? undefined,
          schedule: editingInitial.schedule ?? undefined,
          project_name: editingInitial.project_name ?? undefined,
          brief: editingInitial.brief ?? undefined,
          cover_url: editingInitial.cover_url ?? null,
          media_data: editingInitial.media_data ?? undefined,
        }
      : undefined;

  return (
    <div className="mx-auto w-full min-h-screen bg-[#0B0B0B] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] font-[Lato] md:px-10">
      {/* Header row (static) */}
      <div className="flex items-center justify-between px-6 md:px-8 pt-6">
        <div className="flex items-center gap-4">
          <Image
            src="/images/logo.svg"
            alt="Chris John"
            width={72}
            height={28}
            style={{ width: "auto", height: "auto" }}
            className="h-7 w-auto opacity-95"
          />
          <div className="hidden md:block h-6 w-px bg-white/10" />
          <div className="text-sm leading-5 hidden md:block">
            <div className="text-[#9AA0A6]">Hello, Admin</div>
            <div className="mt-1 text-2xl font-semibold">Welcome back CJ</div>
          </div>
        </div>

        <div className="text-xs text-[#B9B9B9]">
          <a
            href="/admin/check-in"
            className="inline-flex items-center mr-3 rounded-md bg-[#121212] hover:bg-[#000000] px-3 py-2"
          >
            Check in
          </a>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center rounded-md bg-[#121212] hover:bg-[#000000] px-3 py-2"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="text-sm leading-5 px-6 pt-6 md:hidden">
            <div className="text-[#9AA0A6]">Hello, Admin</div>
            <div className="mt-1 text-2xl font-semibold">Welcome back CJ</div>
          </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 px-6 md:px-8 pt-6">
        {/* Works */}
        <div className="rounded-xl bg-[#121212] ring-1 ring-white/5 p-5">
          <div className="flex items-center gap-2 text-sm text-[#C7CBD1]">
            <Image src="/images/ic-template.svg" alt="" width={16} height={16} />
            <span>Works</span>
          </div>
          <div className="pt-6 text-4xl font-semibold tracking-tight">
            {loadingWorks ? "…" : worksCount}
          </div>
        </div>

        {/* Books */}
        <div className="rounded-xl bg-[#121212] ring-1 ring-white/5 p-5">
          <div className="flex items-center gap-2 text-sm text-[#C7CBD1]">
            <Image src="/images/ic-books.svg" alt="" width={16} height={16} />
            <span>Books</span>
          </div>
          <div className="pt-6 text-4xl font-semibold tracking-tight">
            {loadingBooksCount ? "…" : booksCount}
          </div>
        </div>

        {/* Events */}
        <div className="rounded-xl bg-[#121212] ring-1 ring-white/5 p-5">
          <div className="flex items-center gap-2 text-sm text-[#C7CBD1]">
            <Image src="/images/ic-template.svg" alt="" width={16} height={16} />
            <span>Upcoming Events</span>
            {loadingEventsCounts && (
              <span className="ml-2 inline-block h-3 w-3 rounded-full border border-white/30 border-t-transparent animate-spin" />
            )}
          </div>

          {/* Progress pill */}
          <div className="mt-5 h-3 rounded-full bg-[#0D0D0D] ring-1 ring-white/5 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#0ED678] transition-[width] duration-500"
              style={{ width: `${freePct}%` }}
            />
          </div>

          {/* Free / Paid */}
          <div className="mt-4 grid grid-cols-2 divide-x divide-white/10">
            <div className="flex items-center gap-3 pr-4">
              <div className="h-8 w-[72px] rounded-full bg-[#0ED678]/20" />
              <div>
                <div className="text-xs text-[#AEB4BB]">Free</div>
                <div className="text-2xl font-semibold tabular-nums">
                  {eventsReady ? animFree : loadingEventsCounts ? "…" : animFree}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-4">
              <div className="h-8 w-[72px] rounded-full bg-[#FF8A00]/20" />
              <div>
                <div className="text-xs text-[#AEB4BB]">Paid</div>
                <div className="text-2xl font-semibold tabular-nums">
                  {eventsReady ? animPaid : loadingEventsCounts ? "…" : animPaid}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-xl bg-[#121212] ring-1 ring-white/5 p-5">
          <div className="flex items-center gap-2 text-sm text-[#C7CBD1]">
            <Image src="/images/ic-template.svg" alt="" width={16} height={16} />
            <span>Orders</span>
          </div>
          <div className="pt-6 text-4xl font-semibold tracking-tight">
            {loadingOrdersCount ? "…" : ordersCount}
          </div>
        </div>
      </div>

     {/* PERSISTENT TABS (always visible) */}
<div className="px-6 md:px-8 pt-6 md:block hidden">
  <div className="flex items-center gap-3">
    {(["Works", "Books", "Events", "Orders", "Event Register", "Event Check-in"] as const).map((label) => (
      <button
        key={label}
        onClick={() => {
          setActiveTab(label);
          setIsAddingWork(false);
          setIsAddingBook(false);
          setIsAddingEvent(false);
        }}
        className={`rounded-lg px-3.5 py-1.5 text-sm ${
          activeTab === label ? "bg-[#191919] text-white" : "text-[#AEB4BB] hover:text-white"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>

{/* MOBILE/TABLET NOTICE */}
<div className="lg:hidden px-6 md:px-8 pt-8 pb-12">
  <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-6">
    <div className="text-base md:text-lg text-[#C7CBD1] leading-6">
      For now, the admin tables are desktop-only. Please use a laptop/desktop (≥1024px) to view and manage items.
    </div>
  </div>
</div>

{/* DESKTOP CONTENT ONLY */}
<div className="hidden lg:block">
  {/* MAIN CONTENT */}
  {activeTab === "Works" && isAddingWork ? (
    <AddWork onBack={backFromWork} initial={addWorkInitial} />
  ) : activeTab === "Books" && isAddingBook ? (
    <AddBooks onBack={() => setIsAddingBook(false)} />
  ) : activeTab === "Events" && isAddingEvent ? (
    <AddEvents onBack={() => setIsAddingEvent(false)} />
  ) : activeTab === "Books" ? (
    <Books onAddNew={() => setIsAddingBook(true)} />
  ) : activeTab === "Events" ? (
    <Events onAddNew={() => setIsAddingEvent(true)} />
  ) : activeTab === "Orders" ? (
    <Orders />
  ) : activeTab === "Event Register" ? (
    <EventRegistrations />
  ) : activeTab === "Event Check-in" ? (
    <EventCheckins />
  ) : (
    /* Works list */
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 px-6 md:px-8 pb-8">
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
                placeholder="Search work title"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none" />
            </div>

            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-[#C7CBD1]"
              >
                Sort by: <span className="text-white">{roleFilter}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-md bg-[#151515] ring-1 ring-white/10 py-1">
                  {(["All", "Brand Designer", "Product Designer", "Consultant"] as RoleFilter[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRoleFilter(r);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm ${
                        roleFilter === r ? "text-white" : "text-[#C7CBD1] hover:text-white"
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
          <div className="grid grid-cols-[140px_1fr_180px_120px] items-center gap-2 px-4 md:px-5 py-3 text-xs text-[#9AA0A6]">
            <div>Date</div>
            <div>Title</div>
            <div>Role</div>
            <div className="text-right pr-2">Manage</div>
          </div>
          <div className="h-px bg-white/5" />

          {(loadingWorks ? [] : works).map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[140px_1fr_180px_120px] items-center gap-2 px-4 md:px-5 py-3 text-sm hover:bg-white/[0.02] border-t border-white/5 first:border-t-0"
            >
              <div className="text-[#C7CBD1]">{formatDate(r.created_at)}</div>
              <div className="text-white">{r.project_name || "-"}</div>
              <div className="text-[#C7CBD1]">{r.role || "-"}</div>
              <div className="flex items-center justify-end gap-3 pr-1">
                <button
                  className="rounded-md bg-[#1A1A1A] px-3 py-1.5 text-sm text-white ring-1 ring-white/10"
                  onClick={() => handleEditWork(r.id)}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteWork(r.id)}
                  className="grid place-items-center h-7 w-7 rounded-full ring-1 ring-white/10"
                  title="Delete"
                >
                  <Image src="/images/ic-minus.svg" alt="" width={12} height={12} />
                </button>
              </div>
            </div>
          ))}

          {!loadingWorks && works.length === 0 && (
            <div className="px-5 py-6 text-sm text-[#9AA0A6]">No works found.</div>
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
            <Image src="/images/ic-template.svg" alt="" width={32} height={32} className="opacity-90" />
          </div>
          <div>
            <div className="text-lg font-medium">Add your Work</div>
            <div className="mt-1 text-xs text-[#AEB4BB] max-w-[240px] leading-5">
              Showcase your projects, designs, or achievements.
            </div>
          </div>
          <button
            onClick={() => {
              setEditingInitial(null);
              setIsAddingWork(true);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-white text-black px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Work
          </button>
        </div>
      </div>
    </div>
  )}
</div>

    </div>
  );
}
