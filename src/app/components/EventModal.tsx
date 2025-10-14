// components/EventModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";

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

type EventModalProps = {
  event: EventRow;
  onClose: () => void;
  onRequestAccess: () => void;
};

const MONTHS: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
const stripWeekdayPrefix = (s: string) => s.replace(/^\s*[A-Za-z]{3,9},\s*/g, "");
const ensureYear = (s: string) => (/\d{4}/.test(s) ? s : `${s}, ${new Date().getFullYear()}`);
const cleanTime = (t: string) => t.replace(/GMT\s*\+?1/gi, "").trim();
function manualParse(dateStr: string, timeStr: string) {
  const m = dateStr.match(/^\s*([A-Za-z]{3,})\s+(\d{1,2})(?:,)?\s+(\d{4})\s*$/);
  if (!m) return null;
  const mon = MONTHS[m[1].slice(0,3).toLowerCase()];
  const day = Number(m[2]); const year = Number(m[3]);
  const tm = timeStr.match(/^\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*$/i);
  if (!tm) return null;
  let hour = Number(tm[1]); const minute = tm[2] ? Number(tm[2]) : 0;
  const ap = tm[3]?.toUpperCase(); if (ap){ if(ap==="PM"&&hour<12)hour+=12; if(ap==="AM"&&hour===12)hour=0; }
  const iso = `${year}-${String(mon+1).padStart(2,"0")}-${String(day).padStart(2,"0")}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00+01:00`;
  const d = new Date(iso); return isNaN(d.getTime()) ? null : d;
}
function parseLagosDate(d?: string|null,t?: string|null){ if(!d||!t) return null; const ds=ensureYear(stripWeekdayPrefix(d)); const ts=cleanTime(t); const c1=new Date(`${ds} ${ts} +01:00`); if(!isNaN(c1.getTime())) return c1; const c2=new Date(`${ds} ${ts}`); if(!isNaN(c2.getTime())) return manualParse(ds,ts)??c2; return manualParse(ds,ts); }
function formatForDisplay(d: Date){ const date=d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}); const time=d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}); return {date,time:`${time} GMT +1`}; }
function inferType(hosting_url?: string | null, x?: string | null, ig?: string | null) {
  const has = (s?: string | null) => !!s && s.trim().length > 8 && s.trim() !== "https://";
  return has(hosting_url) || has(x) || has(ig) ? "Live stream" : "In-person";
}
function displayPrice(status?: string | null, price?: string | null) {
  const p = (price ?? "").trim();
  if ((status ?? "").toLowerCase() === "free") return "Free";
  if (p === "" || /^(\$|₦)?0+(\.0+)?$/i.test(p)) return "Free";
  return p || "—";
}
function normalizeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s || s === "https://" || s === "#" || s === "-") return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try { return new URL(s).href; } catch { return null; }
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onRequestAccess }) => {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const startsAt = useMemo(() => parseLagosDate(event.event_date ?? "", event.event_time ?? ""), [event.event_date, event.event_time]);
  const when = startsAt ? formatForDisplay(startsAt) : null;
  const typeLabel = inferType(event.hosting_url, event.x_link, event.instagram_link);
  const isVideo = !!event.cover_url && /\.(mp4|mov|webm|ogg)$/i.test(event.cover_url);

  const igUrl = useMemo(() => normalizeUrl(event.instagram_link), [event.instagram_link]);
  const xUrl  = useMemo(() => normalizeUrl(event.x_link), [event.x_link]);

  async function copyLink() {
    const url = `${window.location.origin}/events?e=${event.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // optionally handle copy errors with a toast
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5">
      <div className="relative w-full max-w-md h-full max-h-[90vh] overflow-y-auto scrollbar-hide bg-[#111] text-white rounded-xl shadow-lg font-[Lato]">
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-neutral-900 z-10">
          <button
            onClick={copyLink}
            className={`text-sm px-2 py-1 rounded-md transition ring-1 ring-transparent ${
              copied
                ? "bg-emerald-900/40 text-emerald-300 ring-emerald-500/40"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            aria-live="polite"
          >
            {copied ? (
              <span className="inline-flex items-center gap-1">
                <Check className="w-4 h-4" />
                Copied
              </span>
            ) : (
              "Copy link"
            )}
          </button>
          <button className="text-sm text-gray-400 hover:text-white" onClick={onClose}>
            Close ✕
          </button>
        </div>

        <div className="relative bg-neutral-800 h-40 w-full overflow-hidden">
          {event.cover_url ? (
            isVideo ? (
              <video src={event.cover_url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.cover_url} alt={event.topic ?? "Event cover"} className="w-full h-full object-cover" />
            )
          ) : null}
          {event.status ? (
            <span className="absolute top-2 right-2 bg-zinc-800 text-xs px-2.5 py-1 rounded-full text-gray-300">
              {event.status}
            </span>
          ) : null}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{event.topic ?? "Untitled event"}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <span>👤 Hosted by {event.host_name ?? "—"}</span> • <span>{typeLabel}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium text-base">{displayPrice(event.status, event.price)}</p>
              <p className="text-sm text-gray-400">Price</p>
            </div>
          </div>

          {when && (
            <div className="text-sm text-gray-300 flex items-start gap-3">
              <Image src="/images/calender.svg" alt="Approval" width={28} height={28} className="pt-2" />
              <div>
              <div className="flex items-center gap-2 mb-1"><span>{when.date}</span></div>
              <div className="text-gray-400">{when.time}</div>
              </div>
            </div>
          )}

          <div className="bg-neutral-900 border border-zinc-800 rounded-lg p-4 text-sm space-y-2">
            <div className="flex gap-3 mb-4">
              <div>
                <Image src="/images/approval.svg" alt="Approval" width={28} height={28} className="pt-2" />
              </div>
              <div>
                <p className="text-sm">Approval Needed</p>
                <p className="text-gray-400">Your registration will be reviewed by the event host.</p>
              </div>
            </div>

            <button onClick={onRequestAccess} className="w-full mt-2 bg-white text-black rounded-md py-2 font-semibold">
              Request Access
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">About event</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              {event.about?.trim() || "No description provided."}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mt-4 mb-2">Contact Host</h4>
            <div className="flex items-center gap-3 mt-4 border-t border-zinc-800 pt-4">
              <p className="text-sm">{event.host_name ?? "—"}</p>
              <div className="ml-auto flex gap-2">
                {igUrl && (
                  <a className="text-gray-400 hover:text-white" href={igUrl} target="_blank" rel="noreferrer">
                    <Image src="/images/instagram.svg" alt="Instagram" width={20} height={20} />
                  </a>
                )}
                {xUrl && (
                  <a className="text-gray-400 hover:text-white" href={xUrl} target="_blank" rel="noreferrer">
                    <Image src="/images/twitter.svg" alt="X" width={20} height={20} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
