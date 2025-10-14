// lib/uploads.ts
import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

// Allow covers, media (images/videos), and books (pdf/audio)
export type BucketName = "covers" | "media" | "books";

export async function uploadToBucket(file: File, bucket: BucketName) {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${uuidv4()}.${ext}`;

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}

/**
 * Accepts File | string | null and returns a URL.
 * - If it's a File, upload to the given bucket and return its public URL.
 * - If it's a string (already a URL), return as-is.
 * - If it's null/undefined, return null.
 */
export async function ensureUrl(
  value: File | string | null | undefined,
  bucket: BucketName
): Promise<string | null> {
  if (!value) return null;
  if (typeof value === "string") return value;
  return uploadToBucket(value, bucket);
}
