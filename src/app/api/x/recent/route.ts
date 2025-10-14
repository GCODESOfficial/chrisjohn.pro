/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/api/x/recent/route.ts */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/** ---------- Types ---------- */
type XMediaPhoto = {
  media_key: string;
  type: "photo";
  url?: string;
  width?: number;
  height?: number;
};
type XMediaVideo = {
  media_key: string;
  type: "video" | "animated_gif";
  preview_image_url?: string;
  width?: number;
  height?: number;
  variants?: { url: string; content_type: string; bitrate?: number }[];
};
type XMedia = XMediaPhoto | XMediaVideo;

type XUser = {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
};

type Tweet = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  attachments?: { media_keys?: string[] };
  public_metrics?: Record<string, number>;
};

type TweetsResp = {
  data?: Tweet[];
  includes?: {
    media?: XMedia[];
    users?: XUser[];
  };
  meta?: any;
  title?: string;
  detail?: string;
};

/** ---------- Config ---------- */
const API = "https://api.x.com/2";
const LIVE_CACHE_TTL_MS = 2 * 60_000;     // update Supabase cache at most every 2 min
const STALE_OK_MS      = 24 * 60 * 60_000; // serve stale for up to 24h if throttled

// Supabase admin (server only)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

/** ---------- Helpers ---------- */
async function getUserId(username: string, token: string): Promise<string> {
  const envId = process.env.X_USER_ID;
  if (envId) return envId; // skip lookup entirely

  const res = await fetch(`${API}/users/by/username/${encodeURIComponent(username)}?user.fields=profile_image_url`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Username->id failed (${res.status})`);
  }
  const j = await res.json();
  const id = j?.data?.id;
  if (!id) throw new Error("No id from username lookup");
  return id;
}

async function fetchTweets(userId: string, token: string): Promise<{ body: TweetsResp; status: number; resetAt?: number }> {
  const params = new URLSearchParams({
    max_results: "12",
    exclude: "replies,retweets",
    "tweet.fields": "created_at,public_metrics,attachments,author_id",
    "expansions": "attachments.media_keys,author_id",
    "media.fields": "type,url,preview_image_url,width,height,variants",
    "user.fields": "name,username,profile_image_url",
  });
  const url = `${API}/users/${userId}/tweets?${params.toString()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const resetAt = Number(res.headers.get("x-rate-limit-reset") || 0) * 1000 || undefined;
  const body = (await res.json().catch(() => ({}))) as TweetsResp;
  return { body, status: res.status, resetAt };
}

async function getCache(username: string) {
  const { data, error } = await sb
    .from("x_cache")
    .select("payload,updated_at")
    .eq("username", username)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return { payload: data.payload as any, updatedAt: new Date(data.updated_at).getTime() };
}

async function setCache(username: string, payload: any) {
  await sb.from("x_cache").upsert({ username, payload, updated_at: new Date().toISOString() });
}

/** ---------- Handler ---------- */
export async function GET(req: Request) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return NextResponse.json({ error: "X_BEARER_TOKEN missing" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") || process.env.X_DEFAULT_USERNAME || "").toLowerCase();
  if (!username) return NextResponse.json({ error: "username missing" }, { status: 400 });

  // 1) Try cache first (fresh)
  const cached = await getCache(username);
  const now = Date.now();
  if (cached && now - cached.updatedAt < LIVE_CACHE_TTL_MS) {
    return NextResponse.json(
      { posts: cached.payload.posts, source: "supabase-cache-fresh" },
      { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=300" } }
    );
  }

  // 2) Try live fetch
  try {
    const userId = await getUserId(username, token);
    const { body, status } = await fetchTweets(userId, token);

    if (status === 429) {
      // 3) Rate limited — fall back to any cache, even stale up to STALE_OK_MS
      if (cached && now - cached.updatedAt < STALE_OK_MS) {
        return NextResponse.json(
          { posts: cached.payload.posts, source: "supabase-cache-stale", reason: "rate_limited" },
          { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=600" }, status: 200 }
        );
      }
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    if (status >= 400) {
      // other upstream error
      if (cached && now - cached.updatedAt < STALE_OK_MS) {
        return NextResponse.json(
          { posts: cached.payload.posts, source: "supabase-cache-stale", reason: "upstream_error" },
          { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=600" }, status: 200 }
        );
      }
      return NextResponse.json({ error: body?.detail || "X API error", status }, { status: 502 });
    }

    const mediaArr: XMedia[] = body?.includes?.media ?? [];
    const usersArr: XUser[] = body?.includes?.users ?? [];
    const mediaMap = new Map(mediaArr.map((m) => [m.media_key, m]));
    const userMap = new Map(usersArr.map((u) => [u.id, u]));

    const posts = (body?.data ?? []).map((t) => {
      const author = userMap.get(t.author_id) ?? null;
      const media = t.attachments?.media_keys?.map((k) => mediaMap.get(k)!).filter(Boolean) ?? [];
      return {
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        author: author
          ? { id: author.id, name: author.name, username: author.username, avatar: author.profile_image_url ?? null }
          : null,
        media,
        url: `https://x.com/${author?.username ?? username}/status/${t.id}`,
        metrics: t.public_metrics ?? null,
      };
    });

    // 4) Update cache and return live
    await setCache(username, { posts });
    return NextResponse.json(
      { posts, source: "live" },
      { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" } }
    );
  } catch (e: any) {
    // catastrophic error — use stale cache if available
    if (cached && now - cached.updatedAt < STALE_OK_MS) {
      return NextResponse.json(
        { posts: cached.payload.posts, source: "supabase-cache-stale", reason: "exception" },
        { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=600" }, status: 200 }
      );
    }
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
