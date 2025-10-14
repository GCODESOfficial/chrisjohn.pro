/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/api/admin/orders/delivered/route.ts */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, error: "Server missing Supabase service role credentials." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    const delivered = body?.delivered === true;

    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("book_purchases")
      .update({ delivered })
      .eq("id", id)
      .select("id, delivered")
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, updated: data?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
