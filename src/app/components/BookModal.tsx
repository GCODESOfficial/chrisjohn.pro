// components/BookModal.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

type BookRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  price: string | null;
  author_name: string | null;
  x_link: string | null;
  instagram_link: string | null;
  about: string | null;
  cover_url_front: string | null;
  cover_url_back: string | null;
};

export default function BookModal({
  onClose,
  onProceed,
  initial,
}: {
  onClose: () => void;
  onProceed: () => void;      // keep your original signature
  initial?: Partial<BookRow>; // NEW: content source
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleCopy() {
    const url = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Swallow errors silently, or you could show a toast if you have one
    }
  }

  const title = initial?.subtitle || initial?.title || "—";
  const author = initial?.author_name || "—";
  const price = initial?.price || "";
  const about = initial?.about || "";
  const cover = initial?.cover_url_front || "/images/manifest-book.svg";
  const xLink = initial?.x_link || "";
  const igLink = initial?.instagram_link || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5 md:px-0">
      <div className="bg-[#111] text-white rounded-xl shadow-lg font-[Lato] w-full max-w-md h-full max-h-[90vh] overflow-y-auto scrollbar-hide relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-neutral-900 sticky top-0 z-10">
          <button
            className={`text-sm px-2 py-1 rounded-md transition ring-1 ring-transparent ${
              copied
                ? "bg-emerald-900/40 text-emerald-300 ring-emerald-500/40"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            onClick={handleCopy}
            aria-live="polite"
          >
            {copied ? (
              <span className="inline-flex items-center gap-1">
                <Check className="w-4 h-4" />
                Copied
              </span>
            ) : (
              "Copy link"
            )}
          </button>
          <button className="text-sm text-gray-400 hover:text-white" onClick={onClose}>
            Close ✕
          </button>
        </div>

        {/* Book Image */}
        <div className="flex justify-center mt-6 mb-4">
          <Image
            src={cover}
            alt={title}
            width={100}
            height={140}
            className="drop-shadow-lg"
          />
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">{title}</h2>
              <p className="text-sm text-[#A8A8A8] mb-1">Written by {author}</p>
            </div>
            <div className="text-right">
              {!!price && <p className="text-white font-semibold text-sm mb-1">{price}</p>}
              <p className="text-sm text-[#A8A8A8]">Price</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-neutral-800 p-4 rounded-md mb-6">
            <div className="flex gap-3 mb-4">
            <div>
               <Image src="/images/copy.svg" alt="Instagram" width={20} height={20} className="pt-2"/>
            </div>
            <div>
              <p className="text-sm">Claim your copy</p>
 <p className="text-xs ">Grab your copy now and start the journey.</p>
            
            </div>
           </div>
            <button
              className="w-full bg-white text-black py-2 rounded-md font-medium hover:bg-gray-100 transition"
              onClick={onProceed}
            >
              Get Your Copy
            </button>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">About the Book</h3>
            <p className="text-sm text-[#A8A8A8]">{about}</p>
          </div>

          <h1 className="text-sm pt-7">Contact Author</h1>

          <div className="flex items-center gap-2 mt-4 border-t border-zinc-800 pt-4">
            <span className="text-sm">{author}</span>
            <div className="ml-auto flex gap-2">
              {igLink && (
                <a
                  className="text-gray-400 hover:text-white"
                  href={igLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image src="/images/instagram.svg" alt="Instagram" width={20} height={20} />
                </a>
              )}
              {xLink && (
                <a
                  className="text-gray-400 hover:text-white"
                  href={xLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image src="/images/twitter.svg" alt="X" width={20} height={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
