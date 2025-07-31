// components/EventModal.tsx

import { useEffect } from "react";

type EventModalProps = {
  onClose: () => void;
  onRequestAccess: () => void;
};

const EventModal: React.FC<EventModalProps> = ({ onClose, onRequestAccess }) => {
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
      <div className="relative w-full max-w-md h-full max-h-[90vh] overflow-y-auto scrollbar-hide bg-[#111] text-white rounded-xl shadow-lg font-[Lato]">
        {/* Sticky Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-neutral-900 z-10">
          <button className="text-sm bg-zinc-800 px-2 py-1 rounded-md">Copy link</button>
          <button className="text-sm text-gray-400" onClick={onClose}>
            Close ✕
          </button>
        </div>

        {/* Banner Image Placeholder */}
        <div className="bg-neutral-800 h-40 w-full" />

        {/* Scrollable Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">How AI is changing the face of earth.</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <span>👤 Hosted by Chris John</span> • <span>In-person</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium text-base">$50.00</p>
              <p className="text-sm text-gray-400">Price</p>
            </div>
          </div>

          <div className="text-sm text-gray-300">
            <div className="flex items-center gap-2 mb-1">📅 <span>Friday, July 18</span></div>
            <div className="ml-6 text-gray-400">9:00 AM GMT +1</div>
          </div>

          <div className="bg-neutral-900 border border-zinc-800 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">🔒 Approval Needed</p>
            <p className="text-gray-400">
              Your registration will be reviewed by the event host.
            </p>
            <button
              onClick={onRequestAccess}
              className="w-full mt-2 bg-white text-black rounded-md py-2 font-semibold"
            >
              Request Access
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">About event</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Join us for an evening of creative energy, meaningful conversations, and powerful connections.
              Creators Connect brings together designers, storytellers, developers, and dreamers for a
              relaxed yet inspiring atmosphere.
              <br /><br />
              Expect engaging talks, live showcases, and opportunities to network with like-minded
              creatives and industry leaders.
              <br /><br />
              Whether you&apos;re a seasoned pro or just starting out, this event is your space to grow, share, and build.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mt-4 mb-2">Contact Host</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-700" />
              <p className="text-sm">Chris John</p>
              <span className="ml-auto text-gray-400 text-sm">✉️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
