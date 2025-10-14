/* app/admin/books.tsx */
"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronDown, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import AddBooks from "./addbooks";
import { supabase } from "@/lib/supabase";

type Tab = "Works" | "Books" | "Events";
type SortOpt = "All" | "Ascending" | "Descending";

type BooksProps = {
  onNav?: (t: Tab) => void;
  onAddNew?: () => void; // <-- make sure this exists
};

type BookListRow = {
  id: string;
  created_at: string;
  title: string | null;
  price: string | null;
  cover_url_front?: string | null;
  cover_url_back?: string | null;
};

type BookRowFull = {
  id: string;
  title: string | null;
  subtitle: string | null;
  price: string | null;
  author_name: string | null;
  x_link: string | null;
  instagram_link: string | null;
  about: string | null;
  cover_url_front: string | null;
  cover_url_back: string | null;
};

const PAGE_SIZE = 8;

function parseSupabasePublicUrl(url?: string | null): { bucket: string; path: string } | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

export default function Books({ onAddNew }: BooksProps) {
  const [rows, setRows] = useState<BookListRow[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortOpt>("All");
  const [sortOpen, setSortOpen] = useState(false);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInitial, setEditingInitial] = useState<BookRowFull | null>(null);

  useEffect(() => {
    if (editingId) return;
    void fetchPaged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, sort, editingId]);

  useEffect(() => {
    setPage(1);
  }, [q, sort]);

  async function fetchPaged() {
    setLoading(true);
    try {
      let countQ = supabase.from("books").select("*", { count: "exact", head: true });
      if (q.trim()) countQ = countQ.ilike("title", `%${q.trim()}%`);
      const { count } = await countQ;
      setCount(count || 0);

      let listQ = supabase
        .from("books")
        .select("id, created_at, title, price, cover_url_front, cover_url_back");

      if (q.trim()) listQ = listQ.ilike("title", `%${q.trim()}%`);

      if (sort === "Ascending") listQ = listQ.order("title", { ascending: true, nullsFirst: true });
      else if (sort === "Descending") listQ = listQ.order("title", { ascending: false, nullsFirst: false });
      else listQ = listQ.order("created_at", { ascending: false });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await listQ.range(from, to);
      if (error) throw error;
      setRows((data || []) as BookListRow[]);
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
    const ok = confirm("Delete this book and its covers?");
    if (!ok) return;

    try {
      const { data } = await supabase
        .from("books")
        .select("cover_url_front, cover_url_back")
        .eq("id", id)
        .single();

      const { error: delErr } = await supabase.from("books").delete().eq("id", id);
      if (delErr) throw delErr;

      setRows((prev) => prev.filter((r) => r.id !== id));
      setCount((c) => Math.max(0, c - 1));

      const toRemove: Record<string, string[]> = {};
      const add = (url?: string | null) => {
        const p = parseSupabasePublicUrl(url);
        if (!p) return;
        toRemove[p.bucket] ??= [];
        toRemove[p.bucket].push(p.path);
      };
      add(data?.cover_url_front);
      add(data?.cover_url_back);

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
      await fetchPaged();
    }
  }

  async function handleEdit(id: string) {
    setEditingId(id);
    setEditingInitial(null);
    const { data, error } = await supabase
      .from("books")
      .select(
        "id, title, subtitle, price, author_name, x_link, instagram_link, about, cover_url_front, cover_url_back"
      )
      .eq("id", id)
      .single();
    if (error) {
      console.error(error);
      alert("Failed to load book.");
      setEditingId(null);
      return;
    }
    setEditingInitial(data as BookRowFull);
  }

  function backFromEdit() {
    setEditingId(null);
    setEditingInitial(null);
    void fetchPaged();
  }

  if (editingId) {
    const mappedInitial =
      editingInitial
        ? {
            id: editingInitial.id,
            title: editingInitial.title ?? undefined,
            subtitle: editingInitial.subtitle ?? undefined,
            price: editingInitial.price ?? undefined,
            author_name: editingInitial.author_name ?? undefined,
            x_link: editingInitial.x_link ?? undefined,
            instagram_link: editingInitial.instagram_link ?? undefined,
            about: editingInitial.about ?? undefined,
            cover_url_front: editingInitial.cover_url_front ?? null,
            cover_url_back: editingInitial.cover_url_back ?? null,
          }
        : undefined;

    return <AddBooks onBack={backFromEdit} initial={mappedInitial} />;
  }

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 px-6 md:px-8 pb-8">
      {/* Left column */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5">
        {/* Tabs
        <div className="flex items-center gap-3 px-4 md:px-5 pt-4">
          {[
            { label: "Works", active: false },
            { label: "Books", active: true },
            { label: "Events", active: false },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => onNav?.(t.label as Tab)}
              className={`rounded-lg px-3.5 py-1.5 text-sm ${
                t.active ? "bg-[#191919] text-white" : "text-[#AEB4BB] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div> */}

        {/* Search + Sort */}
        <div className="mt-4 px-4 md:px-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg bg-[#141414] ring-1 ring-white/10 px-9 py-2.5 text-sm placeholder:text-[#7A7F87] outline-none focus:ring-white/20"
                placeholder="Search book title"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none" />
            </div>

            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm text-[#C7CBD1]"
              >
                Sort by: <span className="text-white">{sort}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-md bg-[#151515] ring-1 ring-white/10 py-1">
                  {(["All", "Ascending", "Descending"] as SortOpt[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSort(opt);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm ${
                        sort === opt ? "text-white" : "text-[#C7CBD1] hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          <div className="grid grid-cols-[140px_1fr_120px_120px] items-center gap-2 px-4 md:px-5 py-3 text-xs text-[#9AA0A6]">
            <div>Date</div>
            <div>Title</div>
            <div>Price</div>
            <div className="text-right pr-2">Manage</div>
          </div>
          <div className="h-px bg-white/5" />

          {(loading ? [] : rows).map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[140px_1fr_120px_120px] items-center gap-2 px-4 md:px-5 py-3 text-sm hover:bg-white/[0.02] border-t border-white/5 first:border-t-0"
            >
              <div className="text-[#C7CBD1]">{formatDate(r.created_at)}</div>
              <div className="text-white truncate">{r.title || "-"}</div>
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
            <div className="px-5 py-6 text-sm text-[#9AA0A6]">No books found.</div>
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
            <Image src="/images/ic-books.svg" alt="" width={32} height={32} className="opacity-90" />
          </div>
          <div>
            <div className="text-lg font-medium">Add a New Book</div>
            <div className="mt-1 text-xs text-[#AEB4BB] max-w-[240px] leading-5">
              List your book here so readers can discover, preview, and purchase directly from your portfolio.
            </div>
          </div>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 rounded-md bg-white text-black px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add New Book
          </button>
        </div>
      </div>
    </div>
  );
}
