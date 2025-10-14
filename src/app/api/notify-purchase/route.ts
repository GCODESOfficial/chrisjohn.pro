/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";

export const runtime = "nodejs";

// ---- ENV ----
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Email (SMTP)
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@example.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// Supabase admin (service role) for trusted reads/writes + storage
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

// ---------- Helpers ----------
function parseSupabasePublicUrl(url: string) {
  // https://PROJECT.supabase.co/storage/v1/object/public/<bucket>/<path...>
  const m = url.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

function guessContentTypeByExt(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".aac") return "audio/aac";
  return "application/octet-stream";
}

function makeSafeFilename(name: string) {
  return (name || "book")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._ -]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function preferredExt(format: string, fallbackByContentType?: string, fallbackByPath?: string) {
  const t = (fallbackByContentType || "").toLowerCase();
  const p = (fallbackByPath || "").toLowerCase();
  if (format === "PDF") return "pdf";
  if (format === "Audio") {
    if (t.includes("mpeg")) return "mp3";
    if (t.includes("mp4")) return "m4a";
    if (t.includes("wav")) return "wav";
    if (t.includes("aac")) return "aac";
    if (/\.(mp3)(\?|$)/.test(p)) return "mp3";
    if (/\.(m4a)(\?|$)/.test(p)) return "m4a";
    if (/\.(wav)(\?|$)/.test(p)) return "wav";
    if (/\.(aac)(\?|$)/.test(p)) return "aac";
    return "mp3";
  }
  return path.extname(p).replace(".", "") || "bin";
}

async function downloadFromStorage(publicUrl?: string | null) {
  if (!publicUrl || !supabaseAdmin) return null;
  const parsed = parseSupabasePublicUrl(publicUrl);
  if (!parsed) return null;

  const { data, error } = await supabaseAdmin.storage.from(parsed.bucket).download(parsed.path);
  if (error || !data) return null;

  const ab = await data.arrayBuffer();
  const buffer = Buffer.from(ab);
  const filename = path.basename(parsed.path);
  const contentType = guessContentTypeByExt(filename);

  return { buffer, filename, contentType, size: buffer.length, path: parsed.path, bucket: parsed.bucket };
}

async function createSignedIfPossible(publicUrl?: string | null, downloadName?: string | null) {
  if (!publicUrl || !supabaseAdmin) return null;
  const parsed = parseSupabasePublicUrl(publicUrl);
  if (!parsed) return publicUrl;

  const opts = downloadName ? { download: downloadName } : undefined;
  const { data, error } = await supabaseAdmin.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, 60 * 60 * 24, opts);
  if (error || !data?.signedUrl) return publicUrl;
  return data.signedUrl as string;
}

async function verifyPaystack(reference: string) {
  if (!PAYSTACK_SECRET_KEY) {
    return { ok: false, payload: { error: "PAYSTACK_SECRET_KEY is missing on server" } };
  }
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    return { ok: false, payload: await res.json().catch(() => ({})) };
  }
  const payload = await res.json();
  return payload?.data?.status === "success"
    ? { ok: true, payload }
    : { ok: false, payload };
}

// ---------- Route ----------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      reference,
      bookId,
      bookTitle,

      // prefer buyer_* but keep fallbacks for older client
      buyer_name,
      buyer_email,
      buyer_phone,
      full_name,
      email,
      phone,

      format,     // 'PDF' | 'Audio' | 'Hardcover'
      quantity,
      currency,
      unitPrice,
      total,
      address,
      notes,

      // optional from client; we’ll also fetch from DB if missing
      pdfUrl,
      audioUrl,
    } = body || {};

    if (!reference || !bookId || !format || !quantity) {
      return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, error: "Server is missing Supabase service role credentials." },
        { status: 500 }
      );
    }

    // 1) Verify payment with Paystack
    const verified = await verifyPaystack(reference);
    if (!verified.ok) {
      return NextResponse.json(
        { ok: false, error: "Unable to verify payment with Paystack.", details: verified.payload },
        { status: 400 }
      );
    }

    // 2) If digital URLs weren’t provided, fetch them by bookId
    let pdf = pdfUrl;
    let audio = audioUrl;

    if ((format === "PDF" || format === "Audio") && (!pdf || !audio)) {
      const { data: bookRow, error: bookErr } = await supabaseAdmin
        .from("books")
        .select("title, pdf_url, audio_url")
        .eq("id", bookId)
        .single();

      if (!bookErr && bookRow) {
        if (!bookTitle && bookRow.title) (body as any).bookTitle = bookRow.title;
        pdf = pdf || bookRow.pdf_url || null;
        audio = audio || bookRow.audio_url || null;
      }
    }

    // 3) Insert purchase row  ✅ set delivered correctly
    const nameFinal = buyer_name || full_name || "Customer";
    const emailFinal = buyer_email || email || "";
    const phoneFinal = buyer_phone || phone || "";

    const deliveredInitial = format === "Hardcover" ? false : true;

    const { error: insErr } = await supabaseAdmin.from("book_purchases").insert({
      book_id: bookId,

      // identity
      buyer_name: nameFinal,
      buyer_email: emailFinal,
      buyer_phone: phoneFinal,
      full_name: nameFinal,
      email: emailFinal,
      phone: phoneFinal,

      // order
      format, // 'Hardcover' | 'PDF' | 'Audio'
      quantity,
      shipping_address: address || null,
      notes: notes || null,
      payment_status: "paid",

      currency: currency || "NGN",
      unit_price: unitPrice ?? null,
      total_amount: total ?? null,
      payment_ref: reference,

      // 🚀 make DB reflect the UI
      delivered: deliveredInitial,
    });

    if (insErr) {
      return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
    }

    // 4) Email the buyer (attach file or send signed link for digital)
    let mailed = false;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS && emailFinal) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        const titleBase = makeSafeFilename(bookTitle || "Book");

        const MAX_ATTACH = 20 * 1024 * 1024;
        const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
        let digitalLine = "";

        if (format === "PDF") {
          const file = await downloadFromStorage(pdf || undefined);
          const ext = preferredExt("PDF", file?.contentType, file?.filename || (pdf as string) || "");
          const desiredName = `${titleBase}.${ext}`;

          if (file && file.size <= MAX_ATTACH) {
            attachments.push({
              filename: desiredName,
              content: file.buffer,
              contentType: file.contentType || "application/pdf",
            });
            digitalLine = "Your PDF is attached to this email.";
          } else {
            const link = await createSignedIfPossible(pdf || undefined, desiredName);
            digitalLine = link
              ? `Your PDF is ready here (24h link): ${link}`
              : "We’ll send your PDF shortly.";
          }
        } else if (format === "Audio") {
          const file = await downloadFromStorage(audio || undefined);
          const ext = preferredExt("Audio", file?.contentType, file?.filename || (audio as string) || "");
          const desiredName = `${titleBase}.${ext}`;

          if (file && file.size <= MAX_ATTACH) {
            attachments.push({
              filename: desiredName,
              content: file.buffer,
              contentType: file.contentType || "audio/mpeg",
            });
            digitalLine = "Your audio file is attached to this email.";
          } else {
            const link = await createSignedIfPossible(audio || undefined, desiredName);
            digitalLine = link
              ? `Your audio is ready here (24h link): ${link}`
              : "We’ll send your audio file shortly.";
          }
        }

        const lines: string[] = [];
        lines.push(`Hi ${nameFinal},`);
        lines.push("");
        lines.push(`Thank you for your purchase${bookTitle ? ` — ${bookTitle}` : ""}!`);
        lines.push(`Reference: ${reference}`);
        lines.push("");
        lines.push(`Format: ${format}`);
        lines.push(`Quantity: ${quantity}`);
        if (currency && unitPrice != null) lines.push(`Unit Price: ${currency} ${unitPrice}`);
        if (currency && total != null) lines.push(`Total: ${currency} ${total}`);
        if (format === "Hardcover") {
          lines.push("");
          lines.push(`Shipping address: ${address || "N/A"}`);
          lines.push("We’ll follow up with delivery details soon.");
        } else {
          lines.push("");
          lines.push(digitalLine || "We’ll deliver your digital file shortly.");
        }
        lines.push("");
        lines.push("If anything looks off, just reply to this email and we’ll help.");

        await transporter.sendMail({
          from: EMAIL_FROM,
          to: emailFinal,
          bcc: ADMIN_EMAIL || undefined,
          subject: `Your purchase${bookTitle ? ` — ${bookTitle}` : ""}`,
          text: lines.join("\n"),
          attachments,
        });

        mailed = true;
      } catch (e) {
        console.error("[notify-purchase] email error:", e);
      }
    }

    return NextResponse.json({ ok: true, mailed });
  } catch (e: any) {
    console.error("[notify-purchase] server error:", e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
