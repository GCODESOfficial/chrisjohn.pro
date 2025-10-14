// app/admin/addevents.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureUrl } from "@/lib/uploads";

type EventRow = {
  id?: string;
  topic?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  status?: "Free" | "Paid" | string | null;
  price?: string | null;
  host_name?: string | null;
  x_link?: string | null;
  instagram_link?: string | null;
  about?: string | null;
  cover_url?: string | File | null;
  hosting_url?: string | null; // ← NEW
};

export default function AddEvents({
  onBack,
  initial,
}: {
  onBack: () => void;
  initial?: EventRow; // if present, we’re editing
}) {
  const [form, setForm] = useState<EventRow>({
    id: initial?.id,
    topic: initial?.topic ?? "All in another universe",
    event_date: initial?.event_date ?? "Aug 18, 2025",
    event_time: initial?.event_time ?? "10:00 AM",
    status: (initial?.status as any) ?? "Paid",
    price: initial?.price ?? "₦0",
    host_name: initial?.host_name ?? "Chris",
    x_link: initial?.x_link ?? "https://",
    instagram_link: initial?.instagram_link ?? "https://",
    about: initial?.about ?? "",
    cover_url: initial?.cover_url ?? null,
    hosting_url: initial?.hosting_url ?? "",
  });

  // NEW: hydrate-from-initial when it changes (matches AddBooks pattern)
  useEffect(() => {
    if (!initial) return;
    setForm({
      id: initial.id,
      topic: initial.topic ?? "",
      event_date: initial.event_date ?? "",
      event_time: initial.event_time ?? "",
      status: (initial.status as "Free" | "Paid" | string | null) ?? "Paid",
      price: initial.price ?? "",
      host_name: initial.host_name ?? "",
      x_link: initial.x_link ?? "",
      instagram_link: initial.instagram_link ?? "",
      about: initial.about ?? "",
      cover_url: initial.cover_url ?? null,
      hosting_url: initial.hosting_url ?? "",
    });
  }, [initial]);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const openCoverPicker = () => coverInputRef.current?.click();

  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (form.cover_url instanceof File) {
      const url = URL.createObjectURL(form.cover_url);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof form.cover_url === "string") {
      setCoverPreviewUrl(form.cover_url);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [form.cover_url]);

  function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setForm((p) => ({ ...p, cover_url: f }));
  }

  function Preview() {
    if (!coverPreviewUrl) {
      return (
        <div
          className="mt-5 h-40 rounded-lg bg-[#0F0F0F] ring-1 ring-white/10 grid place-items-center cursor-pointer"
          onClick={openCoverPicker}
        >
          <div className="grid place-items-center gap-2 text-[#B9B9B9] text-xs">
            <div className="grid place-items-center h-10 w-10 rounded-lg bg-[#151515] ring-1 ring-white/10">
              <Plus className="w-5 h-5 opacity-90" />
            </div>
            <div>Add cover page</div>
          </div>
        </div>
      );
    }
    const isVideo =
      typeof form.cover_url !== "string"
        ? !!(form.cover_url as File)?.type?.startsWith("video")
        : /\.(mp4|mov|webm|ogg)$/i.test(coverPreviewUrl);

    return (
      <div
        className="mt-5 h-40 rounded-lg bg-[#0F0F0F] ring-1 ring-white/10 overflow-hidden cursor-pointer"
        onClick={openCoverPicker}
        title="Click to change cover"
      >
        {isVideo ? (
          <video src={coverPreviewUrl} className="w-full h-full object-cover" controls />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPreviewUrl} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>
    );
  }

  const [saving, setSaving] = useState(false);

  async function onSave() {
    try {
      setSaving(true);
      const cover_url = await ensureUrl(form.cover_url as any, "covers");

      const payload = {
        topic: form.topic || "",
        event_date: form.event_date || "",
        event_time: form.event_time || "",
        status: (form.status as "Free" | "Paid") || "Free",
        price: form.price || "",
        host_name: form.host_name || "",
        x_link: form.x_link || "",
        instagram_link: form.instagram_link || "",
        about: form.about || "",
        cover_url: cover_url || null,
        hosting_url: form.hosting_url || null,
      };

      if (form.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
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
      {/* Event Front Page (left) */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-5">
        <div className="text-base font-semibold">Event Front Page</div>
        <div className="mt-1 text-[11.5px] text-[#AEB4BB]">Customize your cover page</div>

        <Preview />
        <input ref={coverInputRef} onChange={onPickCover} type="file" accept="image/*,video/*" hidden />

        <div className="mt-4 flex justify-end">
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Event Back Page (right) */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-5 md:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold">Event Back Page</div>
            <div className="mt-1 text-[11.5px] text-[#AEB4BB]">Fill in the project details</div>
          </div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md bg-[#151515] ring-1 ring-white/10 px-3 py-1.5 text-xs text-[#C7CBD1]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>

        {/* Event Name */}
        <div className="mt-5">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Event Name</label>
          <input
            value={form.topic ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
            className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
          />
        </div>

        {/* Date / Time */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Date</label>
            <input
              value={form.event_date ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Time</label>
            <input
              value={form.event_time ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, event_time: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
        </div>

        {/* Status / Price */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Status</label>
            <div className="relative">
              <select
                value={(form.status as "Free" | "Paid" | string) ?? "Paid"}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "Free" | "Paid" }))}
                className="w-full appearance-none rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 pr-8 text-sm text-white outline-none"
              >
                <option>Paid</option>
                <option>Free</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Price</label>
            <input
              value={form.price ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
        </div>

        {/* Host Name */}
        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Host Name</label>
          <input
            value={form.host_name ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, host_name: e.target.value }))}
            className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
          />
        </div>

        {/* X / Instagram */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">X link</label>
            <input
              value={form.x_link ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, x_link: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Instagram link</label>
            <input
              value={form.instagram_link ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, instagram_link: e.target.value }))}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
            />
          </div>
        </div>

        {/* Hosting URL */}
        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Hosting URL (Zoom/Stream link)</label>
          <input
            value={form.hosting_url ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, hosting_url: e.target.value }))}
            placeholder="https://zoom.us/j/..."
            className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
          />
        </div>

        {/* About */}
        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">About the event</label>
          <textarea
            value={form.about ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))}
            placeholder="Message"
            className="h-28 w-full resize-none rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white placeholder:text-[#7A7F87] outline-none"
          />
        </div>

        {/* Save */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
