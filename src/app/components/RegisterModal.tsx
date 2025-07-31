// components/RegisterModal.tsx

import { useEffect } from "react";

const RegisterModal = ({ onClose }: { onClose: () => void }) => {
      useEffect(() => {
    // Lock scroll
    document.body.classList.add("overflow-hidden");

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-black text-white rounded-xl w-full max-w-md p-6 font-[Lato]">
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="text-sm text-white">
            Close ✕
          </button>
        </div>

        <h2 className="text-xl font-semibold text-center">Event Registration</h2>
        <p className="text-sm text-gray-400 text-center mt-1 mb-6">
          Fill in your details to complete your registration and receive your ticket.
        </p>

        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email *</label>
            <input
              type="email"
              placeholder="You@example.com"
              className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Whatsapp Phone No *</label>
            <input
              type="tel"
              placeholder="07012340000"
              className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white border border-zinc-700 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black font-medium py-2 rounded-md mt-4"
          >
            Proceed to payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
