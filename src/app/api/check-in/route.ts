/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/check-in/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const TICKET_SIGNING_SECRET = process.env.TICKET_SIGNING_SECRET || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TABLE_CHECKINS = "event_checkins";

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

function b64urldecode(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  return Buffer.from(s + "=".repeat(pad), "base64");
}

export async function GET(req: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: "Server missing Supabase credentials." }, { status: 500 });
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    if (!token) return NextResponse.json({ ok: false, error: "Missing token." }, { status: 400 });
    if (!TICKET_SIGNING_SECRET) return NextResponse.json({ ok: false, error: "Server missing signing secret." }, { status: 500 });

    const [h, p, sig] = token.split(".");
    if (!h || !p || !sig) return NextResponse.json({ ok: false, error: "Malformed token." }, { status: 400 });

    const body = `${h}.${p}`;
    const expected = crypto.createHmac("sha256", TICKET_SIGNING_SECRET).update(body).digest();
    const expectedB64 = expected.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
    if (sig !== expectedB64) return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });

    const payload = JSON.parse(b64urldecode(p).toString("utf8")) as { tid: string; eid: string; em: string; iat: number; exp: number };
    const now = Math.floor(Date.now()/1000);
    if (payload.exp && now > payload.exp) return NextResponse.json({ ok: false, error: "Ticket expired." }, { status: 400 });

    // Try to insert check-in; if conflict, it was already used
    const { error: insErr } = await supabaseAdmin.from(TABLE_CHECKINS).insert({
      event_id: payload.eid,
      ticket_id: payload.tid,
      attendee_email: payload.em,
    });
    if (insErr) {
      // naive conflict detection: unique constraint error
      if (String(insErr.message || "").toLowerCase().includes("duplicate")) {
        return NextResponse.json({ ok: true, status: "already_checked_in", ticket: payload });
      }
      // some Supabase drivers return code "23505" for unique violation
      if ((insErr as any).code === "23505") {
        return NextResponse.json({ ok: true, status: "already_checked_in", ticket: payload });
      }
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "valid", ticket: payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
