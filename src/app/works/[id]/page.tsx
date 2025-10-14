/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/work/[id]/page.tsx */
"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type MediaItem = {
  url: string;
  type: "image" | "video";
  position: number;
  isFullWidth: boolean;
  expandedLevel: number; // 0..3 (same meaning as in AddWork)
};

type WorkRow = {
  id: string;
  project_name: string | null;
  role: string | null;
  schedule: string | null;
  brief: string | null;
  cover_url: string | null;
  media_data: MediaItem[] | null;
};

function getDynamicHeight(level = 0): string | undefined {
  // identical to AddWork
  switch (level) {
    case 0:
      return "200px"; // compact
    case 1:
      return undefined; // controlled by aspect ratio (1/1)
    case 2:
      return "auto"; // natural height
    case 3:
      return undefined; // controlled by aspect ratio (16/9)
    default:
      return "200px";
  }
}

function getAspectRatio(level = 0): string | undefined {
  // identical to AddWork
  switch (level) {
    case 1:
      return "1 / 1"; // square
    case 3:
      return "16 / 9"; // wide
    default:
      return undefined; // free
  }
}

function MediaBlock({ item }: { item: MediaItem }) {
  const style: React.CSSProperties = {
    height: getDynamicHeight(item.expandedLevel),
    aspectRatio: getAspectRatio(item.expandedLevel),
    gridColumn: item.isFullWidth ? "1 / -1" : undefined,
    transition: "all 0.25s ease",
  };

  return (
    <div className="relative rounded-2xl ring-1 ring-white/5 overflow-hidden bg-[#121212]" style={style}>
      {item.type === "video" || /\.(mp4|mov|webm|ogg)$/i.test(item.url) ? (
        <video src={item.url} className="w-full h-full object-cover" controls preload="metadata" />
      ) : (
        <img src={item.url} alt="" className="w-full h-full object-cover" />
      )}
    </div>
  );
}

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<WorkRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data, error } = await supabase
          .from("works")
          .select("id, project_name, role, schedule, brief, cover_url, media_data")
          .eq("id", id)
          .single();
        if (error) throw error;
        if (!cancel) setRow((data || null) as WorkRow | null);
      } catch (e: any) {
        if (!cancel) setErr(e?.message || "Failed to load project.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const media = useMemo(
    () => (row?.media_data ? [...row.media_data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : []),
    [row?.media_data]
  );

  return (
    <main className="min-h-screen bg-black text-white font-[Lato] md:pt-16 pt-20">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-24">
        {/* Breadcrumb */}
        <p className=" leading-none text-white  mb-4 border-b border-zinc-800 pb-4">
          <Link href="/works" className="hover:text-white/60">
            Work
          </Link>{" "}
          &gt; {row?.project_name || "Project"}
        </p>

        {/* Meta */}
        <div className="mt-3 space-y-2">
          <p className="text-sm text-white/70">
            Role: <span className="text-white">{row?.role || "—"}</span>
          </p>
          <p className="text-sm text-white/70">
            Timeline: <span className="text-white">{row?.schedule || "—"}</span>
          </p>
        </div>

        {/* Cover — no forced height; preserves natural aspect */}
        <div className="mt-5 rounded-2xl ring-1 ring-white/5 overflow-hidden bg-[#121212]">
          {loading ? (
            <div className="h-48 animate-pulse" />
          ) : row?.cover_url ? (
            /\.(mp4|mov|webm|ogg)$/i.test(row.cover_url) ? (
              <video src={row.cover_url} className="w-full h-60" controls preload="metadata" />
            ) : (
              <img src={row.cover_url} alt={row.project_name ?? "Cover"} className="w-full h-60" />
            )
          ) : (
            <div className="h-40" />
          )}
        </div>

        {/* Project Brief */}
        {(row?.brief || loading) && (
          <>
            <h2 className="mt-7 text-lg font-medium">Project Brief</h2>
            <p className="mt-1 max-w-md  leading-relaxed text-white/70 whitespace-pre-wrap">
              {loading ? "Loading…" : row?.brief}
            </p>
          </>
        )}

        {/* Media — exact layout from saved flags */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {media.map((m, i) => (
            <MediaBlock key={`${m.url}-${i}`} item={m} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 mb-16 md:mb-0">
          <Link
            href="/works"
            className="rounded bg-white px-3.5 py-1.5 text-sm text-black"
          >
            <span aria-hidden>←</span> Explore More work
          </Link>
        </div>

        {err && (
          <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}
      </div>
    </main>
  );
}
