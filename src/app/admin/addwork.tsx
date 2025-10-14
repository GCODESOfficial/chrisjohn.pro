/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/admin/addwork.tsx */
"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { ensureUrl } from "@/lib/uploads";

type MediaItem = {
  file?: File; // file is optional to support editing existing URLs
  preview: string; // used as DnD id
  type: "image" | "video";
  position: number;
  isFullWidth?: boolean;
  expandedLevel?: number; // 0..3 -> height/aspect switches
  url?: string; // public URL (filled after upload or from DB)
};

type WorkRow = {
  id?: string;
  role?: string;
  schedule?: string;
  project_name?: string;
  brief?: string;
  cover_url?: string | File | null;
  media_data?: Array<{
    url: string;
    type: "image" | "video";
    position: number;
    isFullWidth: boolean;
    expandedLevel: number;
  }>;
};

export function AddWork({
  onBack,
  initial,
}: {
  onBack: () => void;
  initial?: WorkRow; // if present, we’re editing
}) {
  const [form, setForm] = useState<WorkRow>({
    role: "Product Designer",
    schedule: "July, 2025",
    project_name: "Cheetah bot trading",
    brief: "",
    cover_url: null,
    id: undefined,
  });

  // hydrate full form when initial arrives (edit mode)
  useEffect(() => {
    if (!initial) return;
    setForm({
      id: initial.id,
      role: initial.role ?? "Product Designer",
      schedule: initial.schedule ?? "July, 2025",
      project_name: initial.project_name ?? "Cheetah bot trading",
      brief: initial.brief ?? "",
      cover_url: initial.cover_url ?? null,
      media_data: initial.media_data ?? [],
    });
  }, [initial]);

  // cover preview (supports File + string URL)
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  useEffect(() => {
    let revoke: string | null = null;
    if (!form.cover_url) {
      setCoverPreview(null);
    } else if (typeof form.cover_url === "string") {
      setCoverPreview(form.cover_url);
    } else {
      const blob = URL.createObjectURL(form.cover_url);
      setCoverPreview(blob);
      revoke = blob;
    }
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [form.cover_url]);

  const isCoverVideo = useMemo(() => {
    if (!coverPreview) return false;
    if (typeof form.cover_url === "object" && form.cover_url) {
      return (form.cover_url as File).type?.startsWith("video");
    }
    return /\.(mp4|webm|ogg)$/i.test(coverPreview);
  }, [coverPreview, form.cover_url]);

  // seed media from initial (edit)
  const initialMedia: MediaItem[] = useMemo(() => {
    if (!initial?.media_data?.length) return [];
    return initial.media_data
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        preview: m.url, // use url as stable id
        type: m.type,
        position: m.position,
        isFullWidth: !!m.isFullWidth,
        expandedLevel: m.expandedLevel ?? 0,
        url: m.url,
      }));
  }, [initial]);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMedia);
  useEffect(() => {
    if (initialMedia.length) setMediaItems(initialMedia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMedia.length]);

  const [saving, setSaving] = useState(false);

  // ---- cover picker (left card) ----
  const coverRef = useRef<HTMLInputElement>(null);
  const pickCover = () => coverRef.current?.click();
  const setCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setForm((p) => ({ ...p, cover_url: f }));
  };

  // ---- dynamic media (unlimited, videos ok) ----
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setMediaItems((prev) => {
      const start = prev.length;
      const newItems: MediaItem[] = acceptedFiles.map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video") ? "video" : "image",
        position: start + i,
        isFullWidth: false,
        expandedLevel: 0,
      }));
      return [...prev, ...newItems];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    multiple: true,
  });

  const updateItem = (index: number, updates: Partial<MediaItem>) => {
    setMediaItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setMediaItems((prev) => {
      const next = [...prev];
      const item = next[index];
      if (item.file && item.preview?.startsWith("blob:")) URL.revokeObjectURL(item.preview);
      next.splice(index, 1);
      return next.map((it, i) => ({ ...it, position: i }));
    });
  };

  const swapItems = (i1: number, i2: number) => {
    setMediaItems((prev) => {
      const updated = [...prev];
      [updated[i1], updated[i2]] = [updated[i2], updated[i1]];
      updated.forEach((it, idx) => (it.position = idx));
      return updated;
    });
  };

  const moveItem = (index: number, dir: number) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= mediaItems.length) return;
    swapItems(index, newIndex);
  };

  const moveItemVertical = (index: number, rows: number) => {
    const cols = 2;
    const newIndex = index + rows * cols;
    if (newIndex < 0 || newIndex >= mediaItems.length) return;
    swapItems(index, newIndex);
  };

  const toggleFullWidth = (index: number) => {
    updateItem(index, { isFullWidth: !mediaItems[index].isFullWidth });
  };

  const toggleExpandVertical = (index: number) => {
    const current = mediaItems[index].expandedLevel ?? 0;
    const next = (current + 1) % 4; // 0..3
    updateItem(index, { expandedLevel: next });
  };

  const getDynamicHeight = (level = 0): string | undefined => {
    switch (level) {
      case 0:
        return "200px";
      case 1:
        return undefined;
      case 2:
        return "auto";
      case 3:
        return undefined;
      default:
        return "200px";
    }
  };

  const getAspectRatio = (level = 0): string | undefined => {
    switch (level) {
      case 1:
        return "1 / 1";
      case 3:
        return "16 / 9";
      default:
        return undefined;
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    const oldIndex = mediaItems.findIndex((i) => i.preview === active.id);
    const newIndex = mediaItems.findIndex((i) => i.preview === over.id);
    const newItems = arrayMove(mediaItems, oldIndex, newIndex);
    newItems.forEach((it, i) => (it.position = i));
    setMediaItems(newItems);
  };

  async function onSave() {
    try {
      setSaving(true);

      // 1) Upload cover if it's a File; keep URL if string/null
      const cover_url = await ensureUrl(form.cover_url as any, "covers");

      // 2) Upload any new media files; keep existing URLs
      const uploaded: MediaItem[] = [];
      for (const item of mediaItems.sort((a, b) => a.position - b.position)) {
        let url = item.url;
        if (item.file) {
          const ext = item.file.name.split(".").pop() || "bin";
          const path = `${uuidv4()}.${ext}`;
          const { data, error } = await supabase.storage
            .from("media")
            .upload(path, item.file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
          url = supabase.storage.from("media").getPublicUrl(data.path).data.publicUrl;
        }
        uploaded.push({
          ...item,
          url: url!,
          preview: url!, // stable id after save
        });
      }

      const payload = {
        role: form.role || "",
        schedule: form.schedule || "",
        project_name: form.project_name || "",
        brief: form.brief || "",
        cover_url: cover_url || null,
        media_data: uploaded.map(({ url, type, position, isFullWidth, expandedLevel }) => ({
          url,
          type,
          position,
          isFullWidth: !!isFullWidth,
          expandedLevel: expandedLevel ?? 0,
        })),
      };

      // UPDATE (if editing) or INSERT (if new)
      if (form.id) {
        const { error } = await supabase.from("works").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("works").insert(payload);
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
      {/* Left: Front Page (cover) */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-5">
        <div className="text-base font-semibold">Work Front Page</div>
        <div className="mt-1 text-[11.5px] text-[#AEB4BB]">Customize your cover page</div>

        <div
          className="mt-5 h-40 rounded-lg bg-[#0F0F0F] ring-1 ring-white/10 grid place-items-center cursor-pointer overflow-hidden"
          onClick={pickCover}
          title={coverPreview ? "Click to change cover" : undefined}
        >
          {coverPreview ? (
            isCoverVideo ? (
              <video
                src={coverPreview}
                className="h-full w-full object-cover pointer-events-none"
                muted
                loop
                autoPlay
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-full w-full object-cover pointer-events-none"
              />
            )
          ) : (
            <div className="grid place-items-center gap-2 text-[#B9B9B9] text-xs">
              <div className="grid place-items-center h-10 w-10 rounded-lg bg-[#151515] ring-1 ring-white/10">
                <Plus className="w-5 h-5 opacity-90" />
              </div>
              <div>Add cover page</div>
            </div>
          )}
          <input ref={coverRef} onChange={setCover} type="file" accept="image/*,video/*" hidden />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Right: Back Page (details + dynamic media) */}
      <div className="rounded-xl bg-[#111111] ring-1 ring-white/5 p-5 md:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold">Work Back Page</div>
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

        {/* Text fields */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Your Role</label>
            <input
              value={form.role || ""}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Schedule</label>
            <input
              value={form.schedule || ""}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Project Name</label>
          <input
            value={form.project_name || ""}
            onChange={(e) => setForm({ ...form, project_name: e.target.value })}
            className="w-full rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[11.5px] text-[#9AA0A6]">Project Brief</label>
          <textarea
            value={form.brief || ""}
            onChange={(e) => setForm({ ...form, brief: e.target.value })}
            className="h-24 w-full resize-none rounded-md bg-[#0F0F0F] ring-1 ring-white/10 px-3 py-2 text-sm text-white"
          />
        </div>

        {/* Dynamic media section */}
        <div className="mt-5">
          <div className="text-[11.5px] text-[#9AA0A6] mb-2">Add Works</div>
          <div
            {...getRootProps()}
            className={`border border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer transition ${
              isDragActive ? "bg-[#121212]" : "bg-[#0F0F0F]"
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-xs text-[#B9B9B9]">Drag & drop images/videos or click to upload</div>
          </div>

          {mediaItems.length > 0 && (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToParentElement]}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {mediaItems
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((item, i) => (
                    <div
                      key={item.preview}
                      id={item.preview}
                      className="relative border border-white/10 bg-[#0E0E0E] rounded overflow-hidden"
                      style={{
                        gridColumn: item.isFullWidth ? "1 / -1" : undefined,
                        height: getDynamicHeight(item.expandedLevel),
                        aspectRatio: getAspectRatio(item.expandedLevel),
                        transition: "all 0.25s ease",
                      }}
                    >
                      {item.type === "video" ? (
                        <video
                          src={item.file ? item.preview : item.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.file ? item.preview : item.url}
                          alt="media"
                          className="w-full h-full object-cover"
                        />
                      )}

                      <div className="absolute top-1 left-1 bg-[#1C1C1C] text-white p-1.5 flex flex-wrap gap-1 rounded">
                        <button type="button" onClick={() => moveItem(i, -1)}>⬅️</button>
                        <button type="button" onClick={() => moveItem(i, 1)}>➡️</button>
                        <button type="button" onClick={() => moveItemVertical(i, -1)}>⬆️</button>
                        <button type="button" onClick={() => moveItemVertical(i, 1)}>⬇️</button>
                        <button type="button" onClick={() => toggleFullWidth(i)}>⛶</button>
                        <button type="button" onClick={() => toggleExpandVertical(i)}>➤</button>
                        <button type="button" onClick={() => removeItem(i)}>🗑️</button>
                      </div>
                    </div>
                  ))}
              </div>
            </DndContext>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
