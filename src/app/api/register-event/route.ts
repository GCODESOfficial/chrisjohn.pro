// app/api/register-event/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { parseEventDate } from "@/lib/dateUtils";

// dynamic imports (small serverless bundle)
const pdfLibPromise = () => import("pdf-lib");
const qrcodePromise = () => import("qrcode");

export const runtime = "nodejs";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TICKET_SIGNING_SECRET = process.env.TICKET_SIGNING_SECRET || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

const TABLE_REG = "event_registrations";
const TABLE_EVENTS = "events";

function base64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function signToken(payload: any) {
  if (!TICKET_SIGNING_SECRET) throw new Error("TICKET_SIGNING_SECRET missing");
  const header = { alg: "HS256", typ: "JWT" };
  const h = Buffer.from(JSON.stringify(header));
  const p = Buffer.from(JSON.stringify(payload));
  const body = `${base64url(h)}.${base64url(p)}`;
  const sig = crypto.createHmac("sha256", TICKET_SIGNING_SECRET).update(body).digest();
  return `${body}.${base64url(sig)}`;
}

async function verifyPaystack(reference: string) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error("[verifyPaystack] PAYSTACK_SECRET_KEY is missing");
    return { ok: false, payload: { error: "PAYSTACK_SECRET_KEY is missing" } };
  }
  
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    
    if (!res.ok) {
      const errorPayload = await res.json().catch(() => ({}));
      console.error("[verifyPaystack] HTTP error:", res.status, errorPayload);
      return { ok: false, payload: errorPayload };
    }
    
    const payload = await res.json();
    console.log("[verifyPaystack] Response:", JSON.stringify(payload, null, 2));
    
    // Paystack response structure:
    // { status: true, message: "...", data: { status: "success", ... } }
    // Check both API call success and transaction status
    const apiSuccess = payload?.status === true;
    const transactionStatus = payload?.data?.status;
    const isSuccess = apiSuccess && (transactionStatus === "success" || transactionStatus === "Success");
    
    if (isSuccess) {
      console.log("[verifyPaystack] Payment verified successfully");
      return { ok: true, payload };
    } else {
      console.error("[verifyPaystack] Payment verification failed - API success:", apiSuccess, "Transaction status:", transactionStatus);
      return { ok: false, payload };
    }
  } catch (error: any) {
    console.error("[verifyPaystack] Exception:", error?.message || error);
    return { ok: false, payload: { error: error?.message || "Verification failed" } };
  }
}

// Date parsing now handled by dateUtils
function toICSDate(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(
    dt.getUTCHours()
  )}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
}
function buildICS(opts: {
  uid: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  url?: string | null;
  description?: string | null;
  location?: string | null;
}) {
  const { uid, title, startsAt, endsAt, url, description, location } = opts;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CDS Labs//Event Ticket//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(startsAt)}`,
    `DTEND:${toICSDate(endsAt)}`,
    `SUMMARY:${title.replace(/\r?\n/g, " ")}`,
    location ? `LOCATION:${location.replace(/\r?\n/g, " ")}` : "",
    `DESCRIPTION:${(description || "").replace(/\r?\n/g, " ")}${url ? `\\nLink: ${url}` : ""}`,
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}
function eventType(hosting_url?: string | null) {
  return hosting_url && hosting_url.trim().length > 8 ? "online" : "in-person";
}

/** ---------- NEW: pdf-lib ticket generator (no AFM/fonts on disk needed) ---------- */
/** ---------- Redesigned ticket (pdf-lib) with x padding + lifted footer ---------- */
async function makeTicketPDF(args: {
  attendee: { name: string; email: string };
  event: { id: string; title: string; dateText: string; timeText: string; placeLabel: string };
  tokenUrl: string;
  ticketId: string;
  price?: string | null;
  status?: string | null;
}) {
  const { PDFDocument, StandardFonts, rgb } = await pdfLibPromise();
  const { default: QR } = await qrcodePromise();

  // Layout
  const width = 298;   // ~A6 width @ 72dpi
  const height = 580;  // extra tall for airy layout
  const padX = 24;     // << left/right padding
  const footerPad = 8;      // ← vertical padding for text inside the black band
  const footerH = 40;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  // Palette
  const white = rgb(1, 1, 1);
  const bg = rgb(0.96, 0.96, 0.96);
  const band = rgb(0.18, 0.18, 0.18);
  const textDark = rgb(0.15, 0.15, 0.15);
  const mid = rgb(0.45, 0.45, 0.45);
  const light = rgb(0.73, 0.73, 0.73);

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: bg });

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Helper to sanitize text for PDF encoding (remove unsupported characters like ₦)
  const sanitizeForPDF = (text: string): string => {
    if (!text) return text;
    // Map common currency symbols to ASCII equivalents
    const currencyMap: Record<string, string> = {
      '₦': 'NGN',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      '₹': 'INR',
    };
    // Replace currency symbols first, then handle other non-ASCII characters
    let sanitized = text;
    for (const [symbol, replacement] of Object.entries(currencyMap)) {
      sanitized = sanitized.replace(new RegExp(symbol, 'g'), replacement);
    }
    // Remove any remaining non-ASCII characters that might cause encoding issues
    return sanitized.replace(/[^\x00-\x7F]/g, '');
  };

  // Helpers
  const hr = (y: number) =>
    page.drawRectangle({ x: padX, y, width: width - padX * 2, height: 0.6, color: light });

  const labelVal = (x: number, y: number, label: string, value: string) => {
    page.drawText(sanitizeForPDF(label.toUpperCase()), { x, y, size: 8, font: fontBold, color: mid });
    page.drawText(sanitizeForPDF(value), { x, y: y - 12, size: 10, font: fontReg, color: textDark });
  };

  const wrap = (text: string, font: any, size: number, maxWidth: number) => {
    const sanitized = sanitizeForPDF(text || "");
    const words = sanitized.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
      else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  };

  // draw wrapped, centered lines; returns the next y baseline after drawing
  const drawCenteredWrapped = (
    yStart: number,
    text: string,
    size: number,
    font: any,
    color: any,
    maxWidth: number,
    lineGap = 2
  ) => {
    const lines = wrap(text, font, size, maxWidth);
    let y = yStart;
    for (const ln of lines) {
      const w = font.widthOfTextAtSize(ln, size);
      page.drawText(ln, { x: (width - w) / 2, y, size, font, color });
      y -= size + lineGap;
    }
    return y;
  };

  const centerSingle = (y: number, text: string, size: number, font = fontBold, color = white) => {
    const sanitized = sanitizeForPDF(text);
    const w = font.widthOfTextAtSize(sanitized, size);
    page.drawText(sanitized, { x: (width - w) / 2, y, size, font, color });
  };

  // Header band
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: band });

  // QR (centered on white card)
  const qrPng = await QR.toBuffer(args.tokenUrl, { margin: 1, width: 280 });
  const qrImage = await pdfDoc.embedPng(qrPng);
  const qrW = 150;
  const qrH = (qrImage.height / qrImage.width) * qrW;
  const qrX = (width - qrW) / 2;
  const qrY = height - 90 - 20 - qrH;
  page.drawRectangle({ x: qrX - 10, y: qrY - 10, width: qrW + 20, height: qrH + 20, color: white });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrW, height: qrH });

  // Ticket code
  centerSingle(qrY - 24, `TKT CODE #${args.ticketId.toUpperCase()}`, 10, fontBold, band);

  // Event title — wrapped & centered with x padding
  let y = drawCenteredWrapped(
    qrY - 42,
    sanitizeForPDF((args.event.title || "Event").toUpperCase()),
    14,
    fontBold,
    textDark,
    width - padX * 2,
    2
  );

  // Attendee lines — also wrapped to respect padding (typically one line)
  y = drawCenteredWrapped(y - 6, sanitizeForPDF(`NAME: ${args.attendee.name}`), 10, fontReg, mid, width - padX * 2, 2);
  y = drawCenteredWrapped(y - 4, sanitizeForPDF(`E-MAIL: ${args.attendee.email}`), 9, fontReg, mid, width - padX * 2, 2);

  // Divider + place
  hr(y - 10);
  y -= 26;
  y = drawCenteredWrapped(y, sanitizeForPDF(`PLACE: ${args.event.placeLabel}`), 9, fontBold, textDark, width - padX * 2, 2);

  // Details (two columns)
  const colLeftX = padX;
  const colRightX = width / 2 + 6;
  const rowTop = y - 24;

  labelVal(colLeftX, rowTop, "Hour", args.event.timeText);
  labelVal(colRightX, rowTop, "Date", args.event.dateText);

  const priceText = args.price?.trim() || ((args.status || "").toLowerCase() === "free" ? "Free" : "—");
  labelVal(colLeftX, rowTop - 38, "Price", priceText);
  labelVal(colRightX, rowTop - 38, "Status", args.status || "—");

  labelVal(colLeftX, rowTop - 76, "Group", "General");
  labelVal(colRightX, rowTop - 76, "Ref", `#${args.ticketId.slice(0, 6).toUpperCase()}`);

  // Note paragraph (constrained by padding)
  const note =
    "Keep this ticket safe. Present the QR code at entry or open the link to check in.";
  page.drawText(sanitizeForPDF(note), {
    x: padX,
    y: rowTop - 112,
    size: 8.5,
    font: fontReg,
    color: mid,
    maxWidth: width - padX * 2,
    lineHeight: 10,
  });

  // Footer band lifted from bottom
  page.drawRectangle({ x: 0, y: 0, width, height: footerH, color: band });

// text baselines are lifted by `footerPad` from the very bottom of the page
centerSingle(footerPad + 16, "Powered by tickT", 9, fontReg, white);
centerSingle(footerPad + 4,  `${args.ticketId.toUpperCase()}`, 8, fontReg, light);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}


/** ------------------------------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin)
      return NextResponse.json({ ok: false, error: "Server missing Supabase credentials." }, { status: 500 });

    const body = await req.json();
    const {
      free,
      reference,
      eventId, 
      eventTitle,
      attendee_name,
      attendee_email,
      attendee_phone,
      status,
      price,
      currency = "NGN",
      unitPrice = 0,
      total = 0,
    } = body || {};

    if (!eventId || !reference || !attendee_name || !attendee_email) {
      return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    // Verify Paystack unless free
    if (!free) {
      console.log("[register-event] Verifying payment for reference:", reference);
      const verified = await verifyPaystack(reference);
      if (!verified.ok) {
        console.error("[register-event] Payment verification failed:", verified.payload);
        return NextResponse.json(
          { ok: false, error: "Unable to verify payment with Paystack.", details: verified.payload },
          { status: 400 }
        );
      }
      console.log("[register-event] Payment verified successfully");
    }

    // Load event
    const { data: ev, error: evErr } = await supabaseAdmin
      .from(TABLE_EVENTS)
      .select("id, topic, event_date, event_time, hosting_url, about, host_name")
      .eq("id", eventId)
      .single();
    if (evErr || !ev) return NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 });

    const startsAt = parseEventDate(ev.event_date, ev.event_time) || new Date();
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
    const dateText = startsAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const timeText =
      startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) + " GMT +1";

    // Save registration
    const { error: insErr } = await supabaseAdmin.from(TABLE_REG).insert({
      event_id: eventId,
      event_title: ev.topic || eventTitle || null,
      attendee_name,
      attendee_email,
      attendee_phone,
      status: status || (free ? "Free" : "Paid"),
      display_price: price || null,
      currency,
      unit_price: unitPrice ?? null,
      total_amount: total ?? null,
      payment_status: free ? "free" : "paid",
      payment_ref: reference,
    });
    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

    // Signed ticket token
    const iat = Math.floor(Date.now() / 1000);
    const exp = Math.floor((startsAt.getTime() + 24 * 60 * 60 * 1000) / 1000); // +1 day after start
    const ticketId = crypto.randomBytes(6).toString("hex");
    const token = signToken({ tid: ticketId, eid: eventId, em: attendee_email, iat, exp });

    // Verification URL
    const base = SITE_URL || new URL(req.url).origin;
    const tokenUrl = `${base}/check-in?token=${encodeURIComponent(token)}`;

    // Generate PDF ticket (pdf-lib)
   const placeLabel =
  (ev.hosting_url && ev.hosting_url.trim().length > 8) ? "Online Event" : "In-person";

const pdf = await makeTicketPDF({
  attendee: { name: attendee_name, email: attendee_email },
  event: { id: ev.id, title: ev.topic || "Event", dateText, timeText, placeLabel },
  tokenUrl,
  ticketId,                 // <-- new
  price: (typeof price === "string" ? price : null) ?? null,
  status: status || (free ? "Free" : "Paid"),
});


    // Calendar invite (.ics)
    const ics = buildICS({
      uid: `${ticketId}@cdslabs`,
      title: ev.topic || "Event",
      startsAt,
      endsAt,
      url: ev.hosting_url || undefined,
      description: ev.about || undefined,
      location: eventType(ev.hosting_url) === "online" ? "Online" : "In-person",
    });

    // Email
    const SMTP_HOST = process.env.SMTP_HOST || "";
    const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
    const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const SMTP_USER = process.env.SMTP_USER || "";
    const SMTP_PASS = process.env.SMTP_PASS || "";
    const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@example.com";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

    let mailed = false;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        console.log("[register-event] Sending email to:", attendee_email);
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
          connectionTimeout: 10000, // 10 seconds
          greetingTimeout: 10000,
          socketTimeout: 10000,
          // Serverless-friendly configuration - removed blocking verify()
          // The actual sendMail() will establish connection when needed
        });

        const isOnline = eventType(ev.hosting_url) === "online";
        const lines: string[] = [];
        lines.push(
          `Hi ${attendee_name},`,
          "",
          `Your registration for "${ev.topic || "Event"}" is confirmed.`,
          `Date: ${dateText} • Time: ${timeText}`
        );
        if (isOnline && ev.hosting_url) {
          lines.push("", `Join link: ${ev.hosting_url}`);
        } else {
          lines.push("", "This is an in-person event. Please bring the attached ticket for check-in.");
        }
        lines.push(
          "",
          `Verification URL (QR on ticket): ${tokenUrl}`,
          "",
          "We've attached your ticket (PDF) and a calendar invite (.ics). See you there!"
        );

        const mailResult = await transporter.sendMail({
          from: EMAIL_FROM,
          to: attendee_email,
          bcc: ADMIN_EMAIL || undefined,
          subject: `Your Ticket — ${ev.topic || "Event"}`,
          text: lines.join("\n"),
          attachments: [
            {
              filename: `Ticket-${(ev.topic || "Event").replace(/\s+/g, "-")}.pdf`,
              content: pdf, // Buffer
              contentType: "application/pdf",
            },
            {
              filename: `Event-${(ev.topic || "Event").replace(/\s+/g, "-")}.ics`,
              content: ics, // string
              contentType: "text/calendar; charset=utf-8",
            },
          ],
        });

        console.log("[register-event] Email sent successfully:", mailResult.messageId);
        mailed = true;
      } catch (emailError: any) {
        console.error("[register-event] Email sending failed:", emailError?.message || emailError);
        console.error("[register-event] Email error details:", {
          code: emailError?.code,
          command: emailError?.command,
          response: emailError?.response,
          responseCode: emailError?.responseCode,
          errno: emailError?.errno,
          syscall: emailError?.syscall,
          hostname: emailError?.hostname,
          stack: emailError?.stack,
        });
        // Don't fail the entire request if email fails - registration is already saved
        mailed = false;
      }
    } else {
      console.warn("[register-event] SMTP credentials not configured, skipping email");
    }

    return NextResponse.json({ ok: true, mailed, ticketId });
  } catch (e: any) {
    console.error("[register-event] error:", e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
