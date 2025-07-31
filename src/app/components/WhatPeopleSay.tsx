"use client";

import Image from "next/image";
import React from "react";

const testimonials = new Array(6).fill({
  name: "Styles Jason",
  country: "Canada",
  message:
    "I’m so happy working with Chris. The result I got is far from what I anticipated. Thank you so much bro.",
  avatar: "/images/avatar.svg", // Place the avatar image in /public
});

const WhatPeopleSay = () => {
  return (
    <div className="bg-black font-[Lato] text-white overflow-hidden">
      <h2 className="text-center text-3xl md:text-4xl mb-20">
        What <span className="font-[Monotype]">People</span> are saying
      </h2>

      <div className="space-y-5 max-w-6xl w-6xl mx-auto relative">

        {/* Blush to background */}
      <div className="absolute top-0 left-0 w-20 h-full z-30 bg-gradient-to-l from-transparent via-black to-black pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 h-full z-30 bg-gradient-to-r from-transparent via-black to-black pointer-events-none" />


        {/* Row 1 - left to right */}
        <div className="relative overflow-hidden">
          <div className="flex gap-4 animate-marquee-left whitespace-nowrap w-max">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`row1-${i}`}
                className="w-xs bg-[#1a1a1a] border border-[#292929] rounded-xl p-4 shadow-sm whitespace-normal break-words"
              >
                <div className="flex items-center gap-3 mb-5">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-semibold">{t.name}</h4>
                    <p className="text-xs text-[#A8A8A8]">{t.country}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 font-normal">{t.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 - left to right */}
        <div className="relative overflow-hidden">
  <div className="flex gap-4 animate-marquee-right whitespace-nowrap w-max">
    {[...testimonials, ...testimonials].map((t, i) => (
      <div
        key={`row1-${i}`}
        className="w-xs bg-[#1a1a1a] border border-[#292929] rounded-xl p-4 shadow-sm whitespace-normal break-words"
      >
        <div className="flex items-center gap-3 mb-5">
          <Image
            src={t.avatar}
            alt={t.name}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
          <div>
            <h4 className="text-sm font-semibold">{t.name}</h4>
            <p className="text-xs text-[#A8A8A8]">{t.country}</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 font-normal">{t.message}</p>
      </div>
    ))}
  </div>
</div>
      </div>
    </div>
  );
};

export default WhatPeopleSay;
