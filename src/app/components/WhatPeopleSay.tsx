'use client';

import Image from 'next/image';
import React from 'react';

const testimonials = new Array(6).fill({
  name: 'Styles Jason',
  country: 'Canada',
  message:
    "I’m so happy working with Chris. The result I got is far from what I anticipated. Thank you so much bro.",
  avatar: '/avatar.png', // Place the avatar image in /public
});

const WhatPeopleSay = () => {
  return (
    <div className="bg-black font-[Lato] text-white py-20 px-6 md:px-12 overflow-hidden">
      <h2 className="text-center text-3xl md:text-4xl mb-12">
        What <span className="font-[Monotype]">People</span> are saying
      </h2>

      <div className="space-y-10">
        {/* Row 1 - left to right */}
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-marquee-left whitespace-nowrap w-max">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`row1-${i}`}
                className="min-w-[280px] bg-[#1a1a1a] rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-semibold">{t.name}</h4>
                    <p className="text-xs text-gray-400">{t.country}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{t.message}</p>
              </div>
            ))}
          </div>
        </div>

{/* Row 1 - left to right */}
<div className="relative overflow-hidden">
          <div className="flex gap-6 animate-marquee-right whitespace-nowrap w-max">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`row1-${i}`}
                className="min-w-[280px] bg-[#1a1a1a] rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-semibold">{t.name}</h4>
                    <p className="text-xs text-gray-400">{t.country}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{t.message}</p>
              </div>
            ))}
          </div>
        </div>       
      </div>
    </div>
  );
};

export default WhatPeopleSay;
