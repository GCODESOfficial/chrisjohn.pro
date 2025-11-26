/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Footer from "./footer";
import { parseEventDate, formatEventForDisplay } from "@/lib/dateUtils";

/* ---------- Types for events ---------- */
type EventRow = {
  id: string;
  topic: string | null;
  event_date: string | null;
  event_time: string | null;
  status: "Free" | "Paid" | string | null;
  cover_url?: string | null;
  hosting_url?: string | null;
  x_link?: string | null;
  instagram_link?: string | null;
};

// Date parsing and formatting now handled by dateUtils
const within = (ms: number, min: number, max: number) => ms >= min && ms <= max;
const hasUrl = (s?: string | null) => !!s && s.trim().length > 8 && s.trim() !== "https://";

/* ---------- Banner payload ---------- */
type Banner =
  | { kind: "live"; title: string; href: string }
  | { kind: "upcoming"; title: string; date: string; href: string }
  | { kind: "soon" };

const links = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/works" },
  { label: "Books", href: "/books" },
  { label: "Events", href: "/events" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Static banner shell; only content updates
  const [banner, setBanner] = useState<Banner>({ kind: "soon" });

  // --- Hard lock background scroll when menu is open (mobile dropdown) ---
  const lockY = useRef(0);
  useEffect(() => {
    if (menuOpen) {
      lockY.current = window.scrollY || window.pageYOffset || 0;
      const body = document.body;
      body.style.position = "fixed";
      body.style.top = `-${lockY.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    } else {
      const body = document.body;
      const y = -parseInt(body.style.top || "0", 10);
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      if (!Number.isNaN(y)) window.scrollTo(0, y);
    }
    return () => {
      // Cleanup if component unmounts while locked
      const body = document.body;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from("events").select("*");
        if (error) throw error;
        const events = (data ?? []) as EventRow[];

        const enriched = events
          .map(e => ({ raw: e, startsAt: parseEventDate(e.event_date ?? "", e.event_time ?? "") }))
          .filter((x): x is {raw: EventRow; startsAt: Date} => !!x.startsAt)
          .sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime());

        const now = new Date();
        const upcoming = enriched.filter(x => x.startsAt.getTime() >= now.getTime());
        const next = upcoming[0];

        if (!next) { if (mounted) setBanner({ kind: "soon" }); return; }

        const diff = next.startsAt.getTime() - now.getTime();
        const isLiveOrStartingSoon = within(diff, -90*60*1000, 60*60*1000);

        const href = hasUrl(next.raw.hosting_url) ? (next.raw.hosting_url as string) : "/events";

        if (isLiveOrStartingSoon) {
          if (mounted) setBanner({ kind: "live", title: next.raw.topic ?? "Live event", href });
        } else {
          const { date } = formatEventForDisplay(next.startsAt);
          if (mounted) setBanner({ kind: "upcoming", title: next.raw.topic ?? "Upcoming event", date, href });
        }
      } catch {
        if (mounted) setBanner({ kind: "soon" });
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Always offset nav; banner is static
  const navTopClass = "top-9 md:top-11";

  return (
    <>
      {/* ===== Static Announcement Banner (shell never unmounts) ===== */}
      <div className="fixed font-[Montserrat] top-0 inset-x-0 z-[40] bg-[#0D0D0D]">
        <div className="mx-auto px-6 md:px-32 h-9 md:h-11 flex items-center justify-center text-[13px] text-zinc-300 gap-4">
          {/* Left group */}
          <div className="flex items-center gap-2 min-w-0">
            {banner.kind === "live" && (
              <span className="relative inline-flex">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-green-500 opacity-70 animate-ping"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
            )}
            <span className="inline-block w-6 h-4 rounded-full bg-zinc-800" aria-hidden />
            <div className="truncate">
              {banner.kind === "live" && <span className="truncate">{banner.title}</span>}
              {banner.kind === "upcoming" && <span className="truncate">{banner.title} &nbsp;•&nbsp; {banner.date}</span>}
              {banner.kind === "soon" && <span className="truncate">Coming soon — new events landing shortly</span>}
            </div>
          </div>

          {/* Right CTA */}
          <div className="shrink-0">
            {banner.kind === "live" && (
              <a href={banner.href} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-100 hover:opacity-90">
                <h1 className="underline">Join Now</h1> <span aria-hidden>→</span>
              </a>
            )}
            {banner.kind === "upcoming" && (
              <a href={banner.href}
                 className="inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-100 hover:opacity-90">
                <h1 className="underline">Get Ticket</h1> <span aria-hidden>→</span>
              </a>
            )}
            {banner.kind === "soon" && (
              <Link href="/events"
                 className="inline-flex items-center gap-1 text-[13px] font-semibold text-zinc-100 hover:opacity-90">
                <h1 className="underline">Explore Events</h1> <span aria-hidden>→</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== Navbar ===== */}
      <nav
        className={clsx(
          "w-full font-[Syne] fixed bg-[#000000] text-white px-6 md:px-32 py-4 flex justify-between items-center z-50 transition-[top]",
          navTopClass
        )}
      >
        {/* Logo */}
        <Link href="/" className="block">
          <div>
            <img src="/images/logo.svg" alt="GS Labs" className="md:w-[80px] h-auto w-[104px]" />
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-sm relative",
                pathname === link.href ? "text-white" : "text-[#8E8E8E]",
                "hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <a
          href="https://t.me/thechrisjohn"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden ml-4 px-4 py-1.5 bg-white text-black rounded md:flex items-center gap-2 text-sm font-semibold"
        >
          Let&apos;s Talk
        </a>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <img src="/images/menu-04.svg" alt="" className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* ===== Mobile Fullscreen Dropdown (No scroll, footer pinned) ===== */}
        {menuOpen && (
          <div
            className="fixed inset-0 h-screen w-screen bg-[#0F0F0F] text-[#E3E3E3] z-[60] overscroll-none"
            aria-modal="true"
            role="dialog"
          >
            <div className="h-full flex flex-col py-6 overflow-hidden">
              {/* Header with Logo & Close */}
              <div className="flex justify-between items-center px-6">
                <Link href="/" className="block" onClick={() => setMenuOpen(false)}>
                  <div className="flex items-center gap-2 font-bold text-xl">
                    <img src="/images/logo.svg" alt="GS Labs" className="w-[104px]" />
                  </div>
                </Link>
                <button onClick={() => setMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex flex-col gap-4 px-6 mt-8">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "text-lg relative pb-1",
                      pathname === link.href ? "text-[#8E8E8E]" : "text-white",
                      "hover:text-white"
                    )}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href="https://t.me/thechrisjohn"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 mx-6 px-4 py-2 bg-white text-black rounded flex items-center gap-2 w-fit text-sm font-semibold"
              >
                Let&apos;s Talk
              </a>

              {/* Footer pinned to bottom */}
              <div className="mt-auto">
                <Footer />
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
