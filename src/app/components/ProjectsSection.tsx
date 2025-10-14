/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/work/page.tsx */
"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type WorkCard = {
  id: string;
  project_name: string | null;
  role: string | null;
  cover_url: string | null;
  created_at: string;
};

const PAGE_LIMIT = 40;

export default function WorkListingPage() {
  const [works, setWorks] = useState<WorkCard[]>([]);
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
          .select("id, project_name, role, cover_url, created_at")
          .order("created_at", { ascending: false })
          .limit(PAGE_LIMIT);
        if (error) throw error;
        if (!cancel) setWorks((data || []) as WorkCard[]);
      } catch (e: any) {
        if (!cancel) setErr(e?.message || "Failed to load works.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <section className="bg-black font-[Lato] text-white px-6 md:px-12 relative">
      {/* Title Section */}
      <div className="max-w-5xl bg-white/5 py-44 mx-auto text-center relative z-10">
        <div className="absolute bottom-0 left-0 w-full h-20 z-0 bg-gradient-to-b from-transparent to-black pointer-events-none" />
        <h2 className="text-4xl md:text-5xl font-extrabold">Crafted with Purpose,</h2>
        <p className="text-5xl text-white mb-4 font-[Monotype]">
          Driven by <span className="text-white">Impact</span>
        </p>
        <p className="text-white text-base">
          A look at some of my past projects.
          <br />
          <span className="text-base">(Projects under NDA will be shared once the agreements expire.)</span>
        </p>
      </div>

      <div className="relative z-30 -mt-20 max-w-5xl mx-auto">
        {err && (
          <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-7">
          {loading &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={`s-${i}`} className="h-56 rounded-lg bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] relative overflow-hidden">
                <div className="absolute inset-0 animate-pulse bg-white/5" />
              </div>
            ))}

          {!loading &&
            works.map((w) => {
              const title = w.project_name || "Untitled";
              const role = w.role || "—";
              return (
                <Link
                  href={`/works/${w.id}`}
                  key={w.id}
                  className="group relative bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-lg h-56 overflow-hidden"
                >
                  {w.cover_url ? (
                    <img
                      src={w.cover_url}
                      alt={title}
                      className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:scale-[1.02] group-hover:opacity-100"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#2a2a2a,transparent_60%),radial-gradient(circle_at_70%_80%,#1b1b1b,transparent_60%)]" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
                    <p className="mt-1 text-[11px] text-[#cfcfcf] bg-[#212121]/80 border border-[#292929] px-2 py-[2px] rounded-full inline-block">
                      {role}
                    </p>
                  </div>
                </Link>
              );
            })}

          {!loading && !err && works.length === 0 && (
            <div className="col-span-full text-center text-sm text-[#bdbdbd] py-10">No works published yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
