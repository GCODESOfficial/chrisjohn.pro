import { useEffect } from "react";

// components/PurchaseModal.tsx
export default function PurchaseModal({ onClose }: { onClose: () => void }) {
      useEffect(() => {
    // Lock scroll
    document.body.classList.add("overflow-hidden");

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 w-full h-full flex justify-center items-start overflow-y-auto scrollbar-hide bg-[#0f0f0f]">
      <div className="w-full max-w-4xl p-10 text-white relative min-h-screen">
        {/* Close */}
        <button onClick={onClose} className="absolute top-6 right-6 text-sm text-white">
          Close ✕
        </button>


        {/* Header */}
        <h2 className="text-2xl font-semibold text-center mb-2 mt-6">Get Your Copy</h2>
        <p className="text-center text-sm text-gray-400 mb-8">
          Fill in your details below and we’ll send your book straight to your inbox or doorstep.
        </p>

        {/* Form */}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="col-span-2">
            <label className="text-sm block mb-1">Full Name *</label>
            <input
              className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md"
              placeholder="Enter your full name"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm block mb-1">Email *</label>
            <input
              className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md"
              placeholder="You@example.com"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Book Format *</label>
            <select className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md">
              <option>Hardcover</option>
              <option>Audio</option>
              <option>eBook (PDF)</option>
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1">Quantity *</label>
            <input
              type="number"
              defaultValue={1}
              className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm block mb-1">Shipping Address *</label>
            <input
              className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md"
              placeholder="123 Example Street, Lekki Phase 1, Lagos"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm block mb-1">Notes (optional)</label>
            <textarea
              className="w-full bg-[#1a1a1a] text-white border border-zinc-700 px-4 py-2 rounded-md"
              rows={3}
              placeholder="Message"
            />
          </div>

          <div className="col-span-2">
            <button
              type="submit"
              className="w-full bg-white text-black py-2 rounded-md hover:bg-gray-200 transition"
            >
              Proceed to payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
