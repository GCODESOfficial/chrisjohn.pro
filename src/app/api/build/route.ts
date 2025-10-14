/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/api/build/route.ts */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

type Body = { fullName?: string; email?: string; message?: string; company?: string };

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const esc = (s: string) => s.replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]!));
const getenv = (k: string) => (process.env[k] ?? "").trim();

export async function POST(req: Request) {
  let data: Body;
  try { data = await req.json(); } catch { return NextResponse.json({ ok:false, error:"Invalid JSON body" }, { status:400 }); }

  const fullName = (data.fullName ?? "").trim();
  const email = (data.email ?? "").trim();
  const message = (data.message ?? "").trim();
  const honeypot = (data.company ?? "").trim();
  if (honeypot) return NextResponse.json({ ok: true });

  if (!fullName || !email || !message) return NextResponse.json({ ok:false, error:"All fields are required." }, { status:400 });
  if (!isEmail(email)) return NextResponse.json({ ok:false, error:"Please provide a valid email." }, { status:400 });

  const SMTP_HOST = getenv("SMTP_HOST");
  const SMTP_PORT = getenv("SMTP_PORT") || "587";
  const SMTP_SECURE = getenv("SMTP_SECURE") || "false";
  const SMTP_USER = getenv("SMTP_USER");
  const SMTP_PASS = getenv("SMTP_PASS");
  const EMAIL_FROM = getenv("EMAIL_FROM");
  const CHRIS_EMAIL = getenv("CHRIS_EMAIL") || getenv("ADMIN_EMAIL");

  const missing = ["SMTP_HOST","SMTP_USER","SMTP_PASS","EMAIL_FROM"].filter((k) => !getenv(k));
  if (!CHRIS_EMAIL) missing.push("CHRIS_EMAIL (or ADMIN_EMAIL)");
  if (missing.length) {
    return NextResponse.json(
      { ok:false, error:"Email is not configured on the server.", missing },
      { status:500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE.toLowerCase() === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // Internal notification to Chris (unchanged)
  const internalHtml = `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#111">
      <h2 style="margin:0 0 8px">New “Let’s Build” submission</h2>
      <p><strong>Name:</strong> ${esc(fullName)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:6px">${esc(message)}</pre>
    </div>
  `;
  const internalMail = transporter.sendMail({
    from: EMAIL_FROM,
    to: CHRIS_EMAIL,
    replyTo: `"${fullName}" <${email}>`,
    subject: `Let’s Build: New message from ${fullName}`,
    html: internalHtml,
  });

  // ✅ New minimal confirmation (no copy of user input)
  const firstName = fullName.split(" ")[0] || "there";
  const autoresponseHtml = `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#111">
      <h2 style="margin:0 0 8px">Thanks, ${esc(firstName)} — we received your message ✅</h2>
      <p>Appreciate you reaching out via the “Let’s Build” form. This is a quick confirmation that your message arrived successfully.</p>
      <p>We’ll review it and get back to you soon. If it’s time-sensitive, just reply to this email and add “URGENT” to the subject.</p>
      <p>— Chris John</p>
    </div>
  `;
  const autoReplyMail = transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: "Thanks — we received your message",
    html: autoresponseHtml,
  });

  try {
    await Promise.all([internalMail, autoReplyMail]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Email send failed:", err?.response || err);
    return NextResponse.json({ ok:false, error:"Failed to send email. Please try again later." }, { status:500 });
  }
}
