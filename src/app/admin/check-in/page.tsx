/* eslint-disable @typescript-eslint/no-explicit-any */
// app/check-in/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Result =
  | {
      ok: true;
      status: "valid" | "already_checked_in";
      ticket: { tid: string; eid: string; em: string; iat: number; exp: number };
    }
  | { ok: false; error: string };

export default function CheckInPage() {
  const [token, setToken] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);
  const [capabilityNote, setCapabilityNote] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const zxingRef = useRef<{ reader?: any; controls?: { stop: () => void } | null } | null>(null);

  // Preloaded libs (avoids "decoder failed to load" on mobile)
  const libsRef = useRef<{ ZXingBrowser?: any; ZXingLib?: any; QrScanner?: any }>({});

  // Capabilities
  const isSecure = typeof window !== "undefined" ? window.isSecureContext : false;
  const hasMedia =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isInApp = /(FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|WhatsApp)/i.test(ua);

  // If ?token=... present, auto-verify + capability note
  useEffect(() => {
    const u = new URL(window.location.href);
    const t = u.searchParams.get("token");
    if (t) {
      setToken(t);
      verify(t);
    }
    if (!isSecure || !hasMedia) {
      setCapabilityNote(
        isInApp
          ? "Open this page in your device Safari/Chrome (in-app browsers block camera)."
          : "Use HTTPS (or localhost) for camera access. iOS blocks camera on non-secure origins."
      );
    }
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload ZXing + qr-scanner once
  useEffect(() => {
    (async () => {
      try {
        const [ZXingBrowser, ZXingLib] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        libsRef.current.ZXingBrowser = ZXingBrowser;
        libsRef.current.ZXingLib = ZXingLib;
      } catch {
        // ignore; we'll fall back
      }
      try {
        const QrScanner = (await import("qr-scanner")).default;
        (QrScanner as any).WORKER_PATH = "/qr-scanner-worker.min.js"; // ensure this is in /public
        libsRef.current.QrScanner = QrScanner;
      } catch {
        // ignore; final fallback will show a helpful error
      }
    })();
  }, []);

  function extractToken(input: string) {
    try {
      const u = new URL(input);
      return u.searchParams.get("token") || input;
    } catch {
      return input;
    }
  }

  async function verify(raw: string) {
    const t = extractToken(raw).trim();
    if (!t) return;
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch(`/api/check-in?token=${encodeURIComponent(t)}`, { cache: "no-store" });
      const j: Result = await r.json();
      setRes(j);
    } catch (e: any) {
      setRes({ ok: false, error: e?.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  // ------- Scanner (ZXing – iOS friendly) -------
  async function startScan() {
    setScanError(null);
    setDetected(false);

    // Guard against HTTP/in-app/blocked camera
    if (!isSecure || !hasMedia) {
      setScanning(false);
      setScanError(
        capabilityNote ||
          "Camera scanning is unavailable here. Try 'Scan from Photo' or open this page over HTTPS in Safari/Chrome."
      );
      return;
    }

    setScanning(true);
    try {
      // Use preloaded if available; else import now
      let ZXingBrowser = libsRef.current.ZXingBrowser;
      let ZXingLib = libsRef.current.ZXingLib;
      if (!ZXingBrowser || !ZXingLib) {
        const [_ZB, _ZL] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        ZXingBrowser = _ZB;
        ZXingLib = _ZL;
        libsRef.current.ZXingBrowser = _ZB;
        libsRef.current.ZXingLib = _ZL;
      }

      // Hints: try-harder + QR only
      const hints = new Map();
      hints.set(ZXingLib.DecodeHintType.TRY_HARDER, true);
      hints.set(ZXingLib.DecodeHintType.POSSIBLE_FORMATS, [ZXingLib.BarcodeFormat.QR_CODE]);

      const reader = new ZXingBrowser.BrowserQRCodeReader(hints, { delayBetweenScanAttempts: 250 });
      zxingRef.current = { reader, controls: null };

      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: "environment" }, // back camera if possible
          },
          audio: false,
        },
        videoRef.current!,
        (result: any) => {
          if (result) {
            const text = result.getText();
            onQrFound(text);
          }
        }
      );
      zxingRef.current.controls = controls;
    } catch (e: any) {
      console.error(e);
      setScanError(e?.message || "Unable to start camera. Check HTTPS & permissions.");
      setScanning(false);
    }
  }

  function stopScan() {
    setScanning(false);
    try {
      zxingRef.current?.controls?.stop();
    } catch {}
    try {
      zxingRef.current?.reader?.reset();
    } catch {}
    zxingRef.current = null;
  }

  async function onQrFound(value: string) {
    try {
      if ("vibrate" in navigator) (navigator as any).vibrate?.(50);
    } catch {}
    setDetected(true);

    const t = extractToken(value);
    setToken(t);
    stopScan(); // stop camera immediately
    await verify(t);

    setTimeout(() => setDetected(false), 600);
  }

  // Fallback: decode from an image/screenshot with multi-step strategy
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);

    // iPhone photos may be HEIC/HEIF which browsers can’t decode
    const lowerName = (file.name || "").toLowerCase();
    const lowerType = (file.type || "").toLowerCase();
    if (/\.(heic|heif)$/.test(lowerName) || /(image\/heic|image\/heif)/.test(lowerType)) {
      setScanError("This photo is HEIC/HEIF and can’t be decoded in the browser. Please retake as JPEG/PNG.");
      e.target.value = "";
      return;
    }

    const blobToPngDataUrl = async (blob: Blob) => {
      if ("createImageBitmap" in window) {
        const bmp = await createImageBitmap(blob).catch(() => null);
        if (bmp) {
          const max = 1600;
          let { width, height } = bmp;
          if (width > max || height > max) {
            const r = Math.min(max / width, max / height);
            width = Math.round(width * r);
            height = Math.round(height * r);
          }
          const c = document.createElement("canvas");
          c.width = width;
          c.height = height;
          const ctx = c.getContext("2d");
          if (!ctx) throw new Error("Canvas unavailable");
          ctx.drawImage(bmp, 0, 0, width, height);
          return c.toDataURL("image/png", 1.0);
        }
      }
      // Fallback via <img>
      const url = URL.createObjectURL(blob);
      const dataUrl: string = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext("2d");
            if (!ctx) return reject(new Error("Canvas unavailable"));
            ctx.drawImage(img, 0, 0);
            resolve(c.toDataURL("image/png", 1.0));
          } catch (err) {
            reject(err);
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Image could not be loaded"));
        };
        img.src = url;
      });
      return dataUrl;
    };

    try {
      // Prefer preloaded libs
      const ZXingBrowser = libsRef.current.ZXingBrowser;
      const ZXingLib = libsRef.current.ZXingLib;

      // ---- Try ZXing (fast path) ----
      if (ZXingBrowser && ZXingLib) {
        const hints = new Map();
        hints.set(ZXingLib.DecodeHintType.TRY_HARDER, true);
        hints.set(ZXingLib.DecodeHintType.POSSIBLE_FORMATS, [ZXingLib.BarcodeFormat.QR_CODE]);
        const reader = new ZXingBrowser.BrowserQRCodeReader(hints, 250);

        // 1) direct blob URL
        const blobUrl = URL.createObjectURL(file);
        try {
          const res = await reader.decodeFromImageUrl(blobUrl);
          URL.revokeObjectURL(blobUrl);
          onQrFound(res.getText());
          e.target.value = "";
          return;
        } catch {
          URL.revokeObjectURL(blobUrl);
        }

        // 2) canvas-normalized PNG
        try {
          const dataUrl = await blobToPngDataUrl(file);
          const res = await reader.decodeFromImageUrl(dataUrl);
          onQrFound(res.getText());
          e.target.value = "";
          return;
        } catch {
          // fall through
        }
      }

      // ---- Fallback: qr-scanner (worker) ----
      const QrScanner = libsRef.current.QrScanner;
      if (QrScanner) {
        try {
          const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
          onQrFound((result?.data ?? result) as string);
          e.target.value = "";
          return;
        } catch {
          // fall through
        }
      }

      // If all failed:
      setScanError("Couldn’t detect a QR in the selected image. Try a closer, sharper photo in good light.");
    } catch (error: any) {
      setScanError(error?.message || "Decoder failed to load.");
    } finally {
      // allow selecting the same file again
      e.target.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-black text-white font-[Lato] px-6 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold">Event Check-in</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Scan a ticket QR (camera) or paste a token / URL below.
        </p>

        {/* Scanner panel */}
        <div className="mt-6 rounded-xl bg-[#111] ring-1 ring-white/10 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {!scanning ? (
              <button
                onClick={startScan}
                className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium"
                title="Start camera scanner (requires permission)"
              >
                Start Scanner
              </button>
            ) : (
              <button
                onClick={stopScan}
                className="rounded-md bg-white/10 text-white px-4 py-2 text-sm font-medium ring-1 ring-white/20"
                title="Stop camera"
              >
                Stop Scanner
              </button>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-md bg-[#1A1A1A] px-4 py-2 text-sm ring-1 ring-white/10"
              title="Take/choose a photo of the QR"
            >
              Scan from Photo
            </button>
            {/* capture="environment" nudges iPhone to use the back camera for a still photo */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPickImage}
              hidden
            />
          </div>

          {/* Live preview with green scanning overlay */}
          <div className="mt-3 relative rounded-lg overflow-hidden bg-black/40 aspect-video max-h-72 ring-1 ring-white/10">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

            {/* Frame corners */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 rounded-tl-md corner-glow" />
              <div className="absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 rounded-tr-md corner-glow" />
              <div className="absolute left-6 bottom-6 h-8 w-8 border-l-2 border-b-2 rounded-bl-md corner-glow" />
              <div className="absolute right-6 bottom-6 h-8 w-8 border-r-2 border-b-2 rounded-br-md corner-glow" />
            </div>

            {/* Moving scanline + soft glow (only while scanning) */}
            {scanning && (
              <>
                <div className="pointer-events-none absolute left-0 right-0 scanline" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-emerald-400/20 rounded-lg" />
              </>
            )}

            {/* Success flash on detection */}
            {detected && <div className="pointer-events-none absolute inset-0 success-flash" />}

            {/* Status ribbon */}
            <div className="absolute bottom-0 left-0 right-0 text-xs text-emerald-200/90 bg-black/50 px-3 py-1.5 flex items-center justify-between">
              <span>{scanning ? "Scanning…" : detected ? "QR detected ✓" : "Scanner idle"}</span>
              {scanError && <span className="text-red-300">{scanError}</span>}
            </div>
          </div>

          {capabilityNote && (
            <div className="mt-2 text-[12px] text-amber-300/90">{capabilityNote}</div>
          )}
        </div>

        {/* Manual input + Verify */}
        <div className="mt-6 rounded-xl bg-[#111] ring-1 ring-white/10 p-4">
          <label className="block text-sm mb-2">Paste token or full URL</label>
          <div className="flex gap-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="token... or https://yourdomain.com/check-in?token=..."
              className="flex-1 rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white outline-none"
            />
            <button
              onClick={() => verify(token)}
              disabled={loading || !token.trim()}
              className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>

          {/* Result */}
          {res && (
            <div className="mt-5">
              {res.ok ? (
                res.status === "valid" ? (
                  <div className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-4">
                    <div className="text-emerald-300 font-semibold">VALID ✓</div>
                    <div className="text-sm text-emerald-200 mt-1">
                      Ticket: <span className="font-mono">{res.ticket.tid}</span>
                    </div>
                    <div className="text-sm text-emerald-200">
                      Event ID: <span className="font-mono">{res.ticket.eid}</span>
                    </div>
                    <div className="text-sm text-emerald-200">
                      Email: <span className="font-mono">{res.ticket.em}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="text-amber-300 font-semibold">ALREADY CHECKED IN</div>
                    <div className="text-sm text-amber-200 mt-1">
                      Ticket: <span className="font-mono">{res.ticket.tid}</span>
                    </div>
                    <div className="text-sm text-amber-200">
                      Event ID: <span className="font-mono">{res.ticket.eid}</span>
                    </div>
                    <div className="text-sm text-amber-200">
                      Email: <span className="font-mono">{res.ticket.em}</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <div className="text-red-300 font-semibold">INVALID</div>
                  <div className="text-sm text-red-200 mt-1">{res.error || "Ticket invalid"}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-zinc-500 space-y-1">
          <div>
            • iPhone tip: page must be served over <span className="text-white">HTTPS</span>, and the camera must be started by a user tap.
          </div>
          <div>
            • If camera access is denied or unavailable, use <span className="text-white">Scan from Photo</span>.
          </div>
        </div>
      </div>

      {/* Scanning animations (scoped) */}
      <style jsx>{`
        .corner-glow {
          border-color: rgba(16, 185, 129, 0.8);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5), inset 0 0 6px rgba(16, 185, 129, 0.25);
        }
        .scanline {
          top: 0;
          height: 22%;
          background: linear-gradient(
            to bottom,
            rgba(16, 185, 129, 0) 0%,
            rgba(16, 185, 129, 0.08) 35%,
            rgba(16, 185, 129, 0.45) 50%,
            rgba(16, 185, 129, 0.08) 65%,
            rgba(16, 185, 129, 0) 100%
          );
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.6), 0 0 24px rgba(16, 185, 129, 0.35);
          filter: blur(0.2px);
          animation: scan-move 1.8s linear infinite;
          left: 0;
          right: 0;
        }
        @keyframes scan-move {
          0% {
            transform: translateY(-10%);
          }
          100% {
            transform: translateY(410%);
          }
        }
        .success-flash {
          background: radial-gradient(
            ellipse at center,
            rgba(16, 185, 129, 0.28),
            rgba(16, 185, 129, 0) 70%
          );
          animation: flash-success 0.6s ease-out forwards;
        }
        @keyframes flash-success {
          0% {
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
