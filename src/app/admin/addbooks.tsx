/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/admin/addbooks.tsx */
"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureUrl } from "@/lib/uploads";

type BookRow = {
  id?: string;
  title?: string;
  subtitle?: string;
  price?: string;
  author_name?: string;
  x_link?: string;
  instagram_link?: string;
  about?: string;
  cover_url_front?: string | File | null;
  cover_url_back?: string | File | null;

  // NEW: digital assets
  pdf_url?: string | File | null;
  audio_url?: string | File | null;
};

export default function AddBooks({
  onBack,
  initial,
}: {
  onBack: () => void;
  initial?: BookRow;
}) {
  const [form, setForm] = useState<BookRow>({
    id: undefined,
    title: "Manifest",
    subtitle: "Cheetah bot trading",
    price: "$0",
    author_name: "Chris",
    x_link: "https://",
    instagram_link: "https://",
    about: "",
    cover_url_front: null,
    cover_url_back: null,

    // NEW defaults
    pdf_url: null,
    audio_url: null,
  });

  // hydrate when editing
  useEffect(() => {
    if (!initial) return;
    setForm({
      id: initial.id,
      title: initial.title ?? "",
      subtitle: initial.subtitle ?? "",
      price: initial.price ?? "",
      author_name: initial.author_name ?? "",
      x_link: initial.x_link ?? "",
      instagram_link: initial.instagram_link ?? "",
      about: initial.about ?? "",
      cover_url_front: initial.cover_url_front ?? null,
      cover_url_back: initial.cover_url_back ?? null,

      // NEW hydrate
      pdf_url: initial.pdf_url ?? null,
      audio_url: initial.audio_url ?? null,
    });
  }, [initial]);

  // cover previews (front/back)
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;
    if (!form.cover_url_front) setFrontPreview(null);
    else if (typeof form.cover_url_front === "string") setFrontPreview(form.cover_url_front);
    else {
      const blob = URL.createObjectURL(form.cover_url_front);
      setFrontPreview(blob);
      revoke = blob;
    }
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [form.cover_url_front]);

  useEffect(() => {
    let revoke: string | null = null;
    if (!form.cover_url_back) setBackPreview(null);
    else if (typeof form.cover_url_back === "string") setBackPreview(form.cover_url_back);
    else {
      const blob = URL.createObjectURL(form.cover_url_back);
      setBackPreview(blob);
      revoke = blob;
    }
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [form.cover_url_back]);

  const isFrontVideo = useMemo(() => {
    if (!frontPreview) return false;
    if (typeof form.cover_url_front === "object" && form.cover_url_front)
      return (form.cover_url_front as File).type?.startsWith("video");
    return /\.(mp4|webm|ogg)$/i.test(frontPreview);
  }, [frontPreview, form.cover_url_front]);

  const isBackVideo = useMemo(() => {
    if (!backPreview) return false;
    if (typeof form.cover_url_back === "object" && form.cover_url_back)
      return (form.cover_url_back as File).type?.startsWith("video");
    return /\.(mp4|webm|ogg)$/i.test(backPreview);
  }, [backPreview, form.cover_url_back]);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  function pickFront() {
    frontRef.current?.click();
  }
  function pickBack() {
    backRef.current?.click();
  }

  function onFrontChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setForm((p) => ({ ...p, cover_url_front: f }));
  }
  function onBackChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setForm((p) => ({ ...p, cover_url_back: f }));
  }

  // NEW: digital file pickers
  const pdfRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  function pickPdf() {
    pdfRef.current?.click();
  }
  function pickAudio() {
    audioRef.current?.click();
  }

  function onPdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setForm((p) => ({ ...p, pdf_url: f }));
  }
  function onAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setForm((p) => ({ ...p, audio_url: f }));
  }

  const [saving, setSaving] = useState(false);

  async function onSave() {
    try {
      setSaving(true);

      // upload covers if Files, keep URLs if strings/null
      const cover_url_front = await ensureUrl(form.cover_url_front as any, "covers");
      const cover_url_back = await ensureUrl(form.cover_url_back as any, "covers");

      // NEW: upload digital files (into a "books" folder – adjust to your bucket path as needed)
      const pdf_url = await ensureUrl(form.pdf_url as any, "books");
      const audio_url = await ensureUrl(form.audio_url as any, "books");

      const payload = {
        title: form.title || "",
        subtitle: form.subtitle || "",
        price: form.price || "",
        author_name: form.author_name || "",
        x_link: form.x_link || "",
        instagram_link: form.instagram_link || "",
        about: form.about || "",
        cover_url_front: cover_url_front || null,
        cover_url_back: cover_url_back || null,

        // NEW fields to persist
        pdf_url: pdf_url || null,
        audio_url: audio_url || null,
      };

      if (form.id) {
        const { error } = await supabase.from("books").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
      }

      onBack();
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 px-6 md:px-8 pb-8">
      {/* Books Front Page (left) */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-5">
        <div className="text-base font-semibold">Books Front Page</div>
        <div className="mt-1 text-[11.5px] text-[#AEB4BB]">Customize your cover page</div>

        {/* Cover dropzone / preview (front) */}
        <div
          className="mt-5 h-40 rounded-lg bg-[#0F0F0F] ring-1 ring-white/10 grid place-items-center cursor-pointer overflow-hidden"
          onClick={pickFront}
          title={frontPreview ? "Click to change cover" : undefined}
        >
          {frontPreview ? (
            isFrontVideo ? (
              <video src={frontPreview} className="h-full w-full object-cover pointer-events-none" muted loop autoPlay />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={frontPreview} alt="Front cover" className="h-full w-full object-cover pointer-events-none" />
            )
          ) : (
            <div className="grid place-items-center gap-2 text-[#B9B9B9] text-xs">
              <div className="grid place-items-center h-10 w-10 rounded-lg bg-[#151515] ring-1 ring-white/10">
                <Plus className="w-5 h-5 opacity-90" />
              </div>
              <div>Add cover page</div>
            </div>
          )}
          <input ref={frontRef} type="file" accept="image/*,video/*" onChange={onFrontChange} hidden />
        </div>

        {/* Apply */}
        <div className="mt-4 flex justify-end">
          <button className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Books Back Page (right) */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-5 md:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold">Books Back Page</div>
            <div className="mt-1 text-[11.5px] text-[#AEB4BB]">Fill in the project details</div>
          </div>

          {/* Back to home */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md bg-[#151515] ring-1 ring-white/10 px-3 py-1.5 text-xs text-[#C7CBD1]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>

        {/* Back cover dropzone / preview */}
        <div
          className="mt-4 h-44 rounded-lg bg-[#0F0F0F] ring-1 ring-white/10 grid place-items-center cursor-pointer overflow-hidden"
          onClick={pickBack}
          title={backPreview ? "Click to change back cover" : undefined}
        >
          {backPreview ? (
            isBackVideo ? (
              <video src={backPreview} className="h-full w-full object-cover pointer-events-none" muted loop autoPlay />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={backPreview} alt="Back cover" className="h-full w-full object-cover pointer-events-none" />
            )
          ) : (
            <div className="grid place-items-center gap-2 text-[#B9B9B9] text-xs">
              <div className="grid place-items-center h-10 w-10 rounded-lg bg-[#151515] ring-1 ring-white/10">
                <Plus className="w-5 h-5 opacity-90" />
              </div>
              <div>Add cover page</div>
            </div>
          )}
          <input ref={backRef} type="file" accept="image/*,video/*" onChange={onBackChange} hidden />
        </div>

        {/* Title */}
        <div className="mt-5">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Title</label>
          <input
            value={form.title || ""}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
          />
        </div>

        {/* Subtitle */}
        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Subtitle</label>
          <input
            value={form.subtitle || ""}
            onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
            className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
          />
        </div>

        {/* Price / Author Name */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Price</label>
            <input
              value={form.price || ""}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Author Name</label>
            <input
              value={form.author_name || ""}
              onChange={(e) => setForm((p) => ({ ...p, author_name: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
        </div>

        {/* X / Instagram */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">X link</label>
            <input
              value={form.x_link || ""}
              onChange={(e) => setForm((p) => ({ ...p, x_link: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Instagram link</label>
            <input
              value={form.instagram_link || ""}
              onChange={(e) => setForm((p) => ({ ...p, instagram_link: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
        </div>

        {/* About the book */}
        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">About the book</label>
          <textarea
            value={form.about || ""}
            onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))}
            placeholder="Message"
            className="h-28 w-full resize-none rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
          />
        </div>

        {/* NEW: Digital files (PDF & Audio) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Upload eBook (PDF)</label>
            <button
              type="button"
              onClick={pickPdf}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-left text-sm text-white"
              title={typeof form.pdf_url === "string" ? form.pdf_url : undefined}
            >
              {form.pdf_url
                ? typeof form.pdf_url === "string"
                  ? "PDF selected (URL)"
                  : (form.pdf_url as File).name
                : "Choose PDF"}
            </button>
            <input ref={pdfRef} type="file" accept="application/pdf" onChange={onPdfChange} hidden />
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Upload Audio Book</label>
            <button
              type="button"
              onClick={pickAudio}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-left text-sm text-white"
              title={typeof form.audio_url === "string" ? form.audio_url : undefined}
            >
              {form.audio_url
                ? typeof form.audio_url === "string"
                  ? "Audio selected (URL)"
                  : (form.audio_url as File).name
                : "Choose audio"}
            </button>
            <input ref={audioRef} type="file" accept="audio/*" onChange={onAudioChange} hidden />
          </div>
        </div>

        {/* Save Changes */}
        <div className="mt-6 flex justify-end">
          <button className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
