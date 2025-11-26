// app/events/page.tsx
"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EventModal from "../components/EventModal";
import RegisterModal from "../components/RegisterModal";
import { parseEventDate, formatEventForDisplay } from "@/lib/dateUtils";

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
  hosting_url: string | null; // ← NEW
};

// Date parsing and formatting now handled by dateUtils
function inferType(hosting_url?: string | null, x?: string | null, ig?: string | null) {
  const has = (s?: string | null) => !!s && s.trim().length > 8 && s.trim() !== "https://";
  return has(hosting_url) || has(x) || has(ig) ? "Live stream" : "In-person";
}
const isStartingSoon = (startsAt: Date, now: Date) => {
  const diff = startsAt.getTime() - now.getTime();
  return diff > 0 && diff <= 60 * 60 * 1000;
};

// Convert event name to URL-friendly slug
function createEventSlug(topic: string | null, id: string): string {
  if (!topic) return id;
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

function EventsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selected, setSelected] = useState<EventRow | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("events").select("*");
        if (error) throw error;
        console.log("📅 Fetched events:", data);
        if (mounted) setEvents((data ?? []) as EventRow[]);
      } catch (e) {
        console.error("❌ Error fetching events:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const now = useMemo(() => new Date(), []);
  const enriched = useMemo(() => {
    const mapped = events.map((e) => {
      const startsAt = parseEventDate(e.event_date ?? "", e.event_time ?? "");
      if (!startsAt) {
        console.warn(`⚠️ Failed to parse date for event "${e.topic}":`, {
          event_date: e.event_date,
          event_time: e.event_time,
        });
      }
      return { raw: e, startsAt };
    });
    const filtered = mapped.filter((x): x is {raw: EventRow; startsAt: Date} => !!x.startsAt);
    return filtered;
  }, [events]);
  const upcoming = useMemo(() => enriched.filter(x => x.startsAt.getTime() >= now.getTime()).sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime()), [enriched, now]);
  const past = useMemo(() => enriched.filter(x => x.startsAt.getTime() < now.getTime()).sort((a,b)=>b.startsAt.getTime()-a.startsAt.getTime()), [enriched, now]);

  const openFor = (e: EventRow) => { setSelected(e); setOpenModal(true); };

  // Check URL for event slug and open modal if found
  useEffect(() => {
    if (typeof window === 'undefined' || events.length === 0) return;
    
    const eventSlug = searchParams?.get('event');
    
    if (eventSlug && !openModal) {
      const event = events.find(e => {
        const slug = createEventSlug(e.topic, e.id);
        return slug === eventSlug || e.id === eventSlug;
      });
      if (event) {
        setSelected(event);
        setOpenModal(true);
        // Clean up URL to just /events (remove query param after opening)
        const url = new URL(window.location.href);
        url.searchParams.delete('event');
        router.replace(url.pathname);
      }
    }
  }, [searchParams, events, openModal, router]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="bg-black text-white px-6 py-12 max-w-5xl mx-auto md:w-5xl pt-40 font-[Syne]">
        <h2 className="text-3xl font-semibold">Upcoming <span className="font-[Syne] text-4xl font-normal">Events</span></h2>

        {loading ? (
          <div className="mt-6 space-y-8">
            <div className="h-60 rounded-xl bg-neutral-900 animate-pulse" />
            <div className="h-60 rounded-xl bg-neutral-900 animate-pulse" />
          </div>
        ) : upcoming.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-400">No upcoming events yet.</p>
        ) : (
          <div className="mt-6 space-y-10">
            {upcoming.map(({ raw, startsAt }) => {
              const { date, time } = formatEventForDisplay(startsAt);
              const isVideo = raw.cover_url ? /\.(mp4|mov|webm|ogg)$/i.test(raw.cover_url) : false;
              return (
                <div key={raw.id} className="flex flex-col sm:flex-row sm:items-center gap-8">
                  <div className="relative bg-neutral-800 sm:w-[420px] w-full h-60 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer" onClick={()=>openFor(raw)}>
                    {raw.cover_url ? (isVideo ? (
                      <video src={raw.cover_url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={raw.cover_url} alt={raw.topic ?? "Event cover"} className="w-full h-full object-cover" />
                    )) : null}
                    {raw.status ? (
                      <span className="absolute top-2 right-2 bg-zinc-700 text-sm px-3 py-1 rounded-full text-gray-300">
                        {raw.status}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-3xl font-semibold">{raw.topic ?? "Untitled event"}</h3>
                    <div className="text-sm text-gray-400 mt-2">{date} &nbsp; | &nbsp; {time}</div>
                    <div className="text-sm text-gray-300 mt-2">{inferType(raw.hosting_url, raw.x_link, raw.instagram_link)}</div>
                    <div className="mt-10 flex items-center gap-2">
                      {isStartingSoon(startsAt, now) && (
                        <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 text-sm rounded-md">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Starting soon
                        </span>
                      )}
                      <button onClick={()=>openFor(raw)} className="bg-white text-black text-sm px-3 py-1.5 rounded-md">
                        Get your ticket
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {openModal && selected && (
          <EventModal
            event={selected}
            onClose={() => { setOpenModal(false); /* keep selected for RegisterModal */ }}
            onRequestAccess={() => {
              setOpenModal(false);
              setTimeout(() => setShowRegisterModal(true), 100);
            }}
          />
        )}

        {showRegisterModal && selected && (
          <RegisterModal
            event={selected}
            onClose={() => { setShowRegisterModal(false); setSelected(null); }}
          />
        )}

        <div className="mt-6 border-t border-zinc-700" />
      </section>

      <section className="bg-black text-white px-6 py-20 pb-40 md:w-5xl max-w-5xl mx-auto font-[Syne]">
        <h2 className="text-3xl font-semibold">Explore past <span className="font-[Syne] text-5xl font-normal">events</span></h2>
        <p className="text-[#A8A8A8] text-base mt-1">Revisit highlights, moments, and memories from our previous experiences.</p>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="h-36 bg-neutral-900 rounded-xl animate-pulse" />
            <div className="h-36 bg-neutral-900 rounded-xl animate-pulse" />
          </div>
        ) : past.length === 0 ? (
          <p className="mt-10 text-sm text-zinc-400">No past events yet.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {past.map(({ raw, startsAt }) => {
              const { date, time } = formatEventForDisplay(startsAt);
              const isVideo = raw.cover_url ? /\.(mp4|mov|webm|ogg)$/i.test(raw.cover_url) : false;
              return (
                <div className="flex gap-4 cursor-pointer" key={raw.id} onClick={()=>openFor(raw)}>
                  <div className="relative bg-[#131313] md:w-48 md:h-36 w-28 h-28 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    {raw.cover_url ? (isVideo ? (
                      <video src={raw.cover_url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={raw.cover_url} alt={raw.topic ?? "Event cover"} className="w-full h-full object-cover" />
                    )) : null}
                    {raw.status ? (
                      <span className={`absolute top-2 right-2 text-xs px-3 py-0.5 rounded-full text-gray-300 ${raw.status === "Paid" ? "bg-[#292929]" : "bg-[#060606]"}`}>
                        {raw.status}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2 mt-2">
                    <h3 className="text-lg line-clamp-1 font-semibold">{raw.topic ?? "Untitled event"}</h3>
                    <p className="text-sm text-[#A8A8A8]">{date} &nbsp; | &nbsp; {time}</p>
                    <p className="text-sm text-[#A8A8A8]">{inferType(raw.hosting_url, raw.x_link, raw.instagram_link)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white">
        <section className="bg-black text-white px-6 py-12 max-w-5xl mx-auto md:w-5xl pt-40 font-[Syne]">
          <div className="mt-6 space-y-8">
            <div className="h-60 rounded-xl bg-neutral-900 animate-pulse" />
            <div className="h-60 rounded-xl bg-neutral-900 animate-pulse" />
          </div>
        </section>
      </main>
    }>
      <EventsPageContent />
    </Suspense>
  );
}
