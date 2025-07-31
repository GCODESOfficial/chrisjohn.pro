"use client";

import { useState } from "react";
import EventModal from "../components/EventModal";
import RegisterModal from "../components/RegisterModal";

const events = [
  { title: "How AI is changing the face of earth.", date: "Fri, Jul 18", time: "9:00 AM GMT +1", type: "Live stream", status: "Free" },
  { title: "How AI is changing the face of earth.", date: "Fri, Jul 18", time: "9:00 AM GMT +1", type: "Live stream", status: "Paid" },
  { title: "How AI is changing the face of earth.", date: "Fri, Jul 18", time: "9:00 AM GMT +1", type: "Live stream", status: "Free" },
  { title: "How AI is changing the face of earth.", date: "Fri, Jul 18", time: "9:00 AM GMT +1", type: "Live stream", status: "Free" },
];
export default function EventsPage() {
  
   const [openModal, setOpenModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white">

      <section className="bg-black text-white px-6 py-12 max-w-5xl mx-auto w-5xl pt-40 font-[Lato]">
      <h2 className="text-3xl font-semibold">
        Upcoming <span className="font-[Monotype] text-4xl font-normal">Event</span>
      </h2>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-8">
        {/* Event Image Placeholder */}
        <div className="relative bg-neutral-800 w-md h-60 rounded-xl flex items-center justify-center">
          <span className="absolute top-2 right-2 bg-zinc-700 text-sm px-3 py-1 rounded-full text-gray-300">
            Paid
          </span>
        </div>

        {/* Event Details */}
        <div className="flex-1">
          <h3 className="text-3xl font-semibold">
            How AI is changing the face of earth.
          </h3>

          <div className="text-sm text-gray-400 mt-2">
            Fri, Jul 18 &nbsp; | &nbsp; 9:00 AM GMT +1
          </div>

          <div className="text-sm text-gray-300 mt-2">In-person</div>

          <div className="mt-10 flex items-center gap-2">
            <span className="flex items-center gap-1 bg-zinc-800 px-3 py-1.5 text-sm rounded-md">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Starting soon
            </span>
            <button onClick={() => setOpenModal(true)} className="bg-white text-black text-sm px-3 py-1.5 rounded-md">
              Get your ticket
            </button>
          </div>
        </div>
      </div>

      {openModal && (
        <EventModal
          onClose={() => setOpenModal(false)}
          onRequestAccess={() => {
            setOpenModal(false);
            setTimeout(() => setShowRegisterModal(true), 100);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal onClose={() => setShowRegisterModal(false)} />
      )}

      <div className="mt-6 border-t border-zinc-700" />
    </section>
      
  <section className="bg-black text-white px-6 py-20 pb-40 w-5xl max-w-5xl mx-auto font-[Lato]">
      <h2 className="text-3xl font-semibold">
        Explore past <span className="font-[Monotype] text-5xl font-normal">events</span>
      </h2>
      <p className="text-[#A8A8A8] text-base mt-1">
        Revisit highlights, moments, and memories from our previous experiences.
      </p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {events.map((event, idx) => (
          <div className="flex gap-4" key={idx}>
            {/* Image Card */}
            <div className="relative bg-[#131313] w-48 h-36 rounded-xl flex items-center justify-center shrink-0">
              <span
                className={`absolute top-2 right-2 text-xs px-3 py-0.5 rounded-full text-gray-300 ${
                  event.status === "Paid" ? "bg-[#292929]" : "bg-[#060606]"
                }`}
              >
                {event.status}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 mt-2">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <p className="text-sm text-[#A8A8A8]">
                {event.date} &nbsp; | &nbsp; {event.time}
              </p>
              <p className="text-sm text-[#A8A8A8]">{event.type}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
    </main>
  );
}