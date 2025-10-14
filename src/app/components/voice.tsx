/* eslint-disable react-hooks/exhaustive-deps */
// app/components/voice.tsx (or app/voice.tsx)
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------- Types ---------------------- */
type MediaPhoto = {
  media_key: string;
  type: "photo";
  url?: string;
  width?: number;
  height?: number;
};
type MediaVideo = {
  media_key: string;
  type: "video" | "animated_gif";
  preview_image_url?: string;
  width?: number;
  height?: number;
  variants?: { url: string; content_type: string; bitrate?: number }[];
};
type Media = MediaPhoto | MediaVideo;

type Post = {
  id: string;
  text: string;
  created_at: string;
  url: string;
  author: { id: string; name: string; username: string; avatar?: string | null } | null;
  media: Media[];
  metrics: Record<string, number> | null;
};

type ApiResponse =
  | { posts: Post[]; source?: string; reason?: string }
  | { error: string };

/* -------------------- Utilities -------------------- */
const USERNAME = "thechrisjohn_"; // change if needed

const isPhoto = (m: Media): m is MediaPhoto => m.type === "photo";
const isVideo = (m: Media): m is MediaVideo => m.type === "video";
const isGif = (m: Media): m is MediaVideo => m.type === "animated_gif";

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function linkify(text: string) {
  const safe = escapeHtml(text);
  return safe
    .replace(
      /(https?:\/\/[^\s]+)/g,
      (m) => `<a class="underline" href="${m}" target="_blank" rel="noreferrer">${m}</a>`
    )
    .replace(/@([a-zA-Z0-9_]{1,20})/g, (_m, u) => `<a class="underline" href="https://x.com/${u}" target="_blank" rel="noreferrer">@${u}</a>`)
    .replace(/#(\w+)/g, (_m, h) => `<a class="underline" href="https://x.com/hashtag/${h}" target="_blank" rel="noreferrer">#${h}</a>`);
}

/* -------------------- Components ------------------- */
function PostCard({ p }: { p: Post }) {
  // decide what to render in the “media slot”
  const photo = p.media?.find(isPhoto);
  const video = p.media?.find(isVideo);
  const allowedMedia = photo || video;
  const isTextOnly = !allowedMedia && (p.media?.length ?? 0) === 0;

  return (
    <a
      href={p.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl bg-neutral-800/80 hover:bg-neutral-800 transition-colors overflow-hidden border border-white/5 h-[360px] md:h-[380px] flex-col"
    >
      {/* Header (fixed area) */}
      <div className="flex items-center gap-3 p-3 shrink-0">
        <div className="relative h-8 w-8">
          <Image
            src={p.author?.avatar || "/fallback-avatar.png"}
            alt={p.author?.username || "author"}
            fill
            className="rounded-full object-cover"
            sizes="32px"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm leading-tight">
            <span className="font-semibold">{p.author?.name || "Unknown"}</span>{" "}
            <span className="text-white/60">@{p.author?.username}</span>{" "}
            <span className="text-white/40">· {timeAgo(p.created_at)}</span>
          </div>
        </div>
      </div>

      {/* MEDIA SLOT — always same height (keeps cards equal) */}
      <div className="relative w-full shrink-0" style={{ aspectRatio: "10 / 9" }}>
        {photo?.url ? (
          <Image
            src={photo.url}
            alt="photo"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 600px"
          />
        ) : video?.preview_image_url ? (
          <Image
            src={video.preview_image_url}
            alt="video preview"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 600px"
          />
        ) : isTextOnly ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="text-white/90 text-base md:text-[15px] leading-relaxed text-center"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 6, // clamp lines to keep it tidy in the slot
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              dangerouslySetInnerHTML={{ __html: linkify(p.text) }}
            />
          </div>
        ) : (
          // Fallback for rare cases
          <div className="absolute inset-0 bg-neutral-900/50" />
        )}
      </div>

      {/* For media posts, we skip extra caption block to keep focus on media */}
      {!isTextOnly && (
        <div className="p-3 text-xs text-white/60 line-clamp-2">
          {/* tiny caption or empty spacer for consistent bottom padding */}
          {p.text?.slice(0, 1) ? (
            <span
              dangerouslySetInnerHTML={{
                __html: linkify(p.text),
              }}
            />
          ) : (
            <span>&nbsp;</span>
          )}
        </div>
      )}
    </a>
  );
}

/* ---------------------- Page ----------------------- */
export default function Voice() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshMs, setRefreshMs] = useState<number>(60_000); // 60s refresh
  const inFlight = useRef<AbortController | null>(null);
  const didInit = useRef(false); // avoid double-load in dev

  const load = async () => {
    inFlight.current?.abort();
    const ac = new AbortController();
    inFlight.current = ac;

    try {
      setErr(null);
      const res = await fetch(`/api/x/recent?username=${encodeURIComponent(USERNAME)}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) {
        if ("error" in data) setErr(data.error);
        if (res.status === 429) {
          setErr("Rate limited by X. Showing last good cache when available.");
          setRefreshMs((prev) => Math.min(Math.max(prev * 2, 120_000), 300_000)); // back off
        }
        if ("posts" in data) setPosts(data.posts);
        return;
      }

      if (refreshMs !== 60_000) setRefreshMs(60_000);
      if ("posts" in data) setPosts(data.posts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      if (msg !== "The user aborted a request.") setErr(msg);
    }
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    load();
  }, []);

  useEffect(() => {
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  // 1) Filter: only photo/video posts OR pure text posts. Exclude GIF-only.
  const filtered = useMemo(() => {
    const arr = (posts || []);
    return arr.filter((p) => {
      const hasPhoto = p.media?.some(isPhoto) ?? false;
      const hasVideoOnly = p.media?.some(isVideo) ?? false;
      const hasGifOnly = p.media?.length ? p.media.every(isGif) : false;

      if (hasPhoto || hasVideoOnly) return true;     // allowed media
      if (!p.media || p.media.length === 0) return true; // text-only
      if (hasGifOnly) return false;                  // exclude GIF-only
      return false;
    });
  }, [posts]);

  // 2) Round-robin into 4 columns
  const cols = useMemo(() => {
    const c: Post[][] = [[], [], [], []];
    filtered.forEach((p, i) => c[i % 4].push(p));
    return c;
  }, [filtered]);

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-40 px-4">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-semibold">My Thoughts,</h1>
        <h2 className="text-6xl mt-2 font-[Monotype]">My Voice.</h2>
        <div className="mt-2 text-white/60 text-sm">
          Latest 12 posts from @{USERNAME} · photo · video · text
        </div>
        {err && <div className="mt-3 text-red-400 text-sm">{err}</div>}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full mx-auto">
        {(!posts || posts.length === 0) &&
          [0, 1, 2, 3].map((col) => (
            <div key={col} className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-neutral-800 animate-pulse h-[360px] md:h-[380px]"
                />
              ))}
            </div>
          ))}

        {filtered.length > 0 &&
          cols.map((col, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              {col.map((p) => (
                <PostCard key={p.id} p={p} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
