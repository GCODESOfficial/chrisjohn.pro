// components/BookModal.tsx
import Image from "next/image";
import { useEffect } from "react";



export default function BookModal({
  onClose,
  onProceed,
}: {
  onClose: () => void;
  onProceed: () => void;
}) {

      useEffect(() => {
    // Lock scroll
    document.body.classList.add("overflow-hidden");

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] text-white rounded-xl shadow-lg font-[Lato] w-full max-w-md h-full max-h-[90vh] overflow-y-auto scrollbar-hide relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-neutral-900 sticky top-0 z-10">
          <button className="text-sm bg-zinc-800 px-2 py-1 rounded-md">Copy link</button>
          <button className="text-sm text-gray-400" onClick={onClose}>Close ✕</button>
        </div>

        {/* Book Image */}
        <div className="flex justify-center mt-6 mb-4">
          <Image
            src="/images/manifest-book.svg"
            alt="Manifest Book"
            width={100}
            height={140}
            className="drop-shadow-lg"
          />
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <h2 className="text-lg font-semibold mb-1">7 Steps to living your best life.</h2>
          <p className="text-sm text-[#A8A8A8] mb-1">Written by Chris John</p>
          <p className="text-white font-semibold text-sm mb-4">$50.00</p>

          {/* Call to Action */}
          <div className="bg-neutral-800 p-4 rounded-md mb-6">
            <p className="text-sm mb-3">Grab your copy now and start the journey.</p>
            <button
              className="w-full bg-white text-black py-2 rounded-md font-medium hover:bg-gray-100 transition"
              onClick={onProceed}
            >
              Get Your Copy
            </button>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">About the Book</h3>
            <p className="text-sm text-[#A8A8A8]">
              Chris John introduces Manifest, a deeply personal guide designed to support readers to heal
              their relationship with money and align their financial goals with a greater purpose.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 border-t border-zinc-800 pt-4">
            <Image
              src="/images/avatar-placeholder.png"
              alt="Author"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm">Chris John</span>
            <div className="ml-auto flex gap-2">
              <button className="text-gray-400 hover:text-white">✉️</button>
              <button className="text-gray-400 hover:text-white">🔗</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
