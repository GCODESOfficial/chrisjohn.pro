'use client';

import React from 'react';
import Image from 'next/image';

const Meet = () => {
  return (
    <div className="-mt-40 text-white px-6 py-20 md:px-16 md:pb-32 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Left Text Section */}
        <div className="flex-1">
          <h2 className="text-white text-5xl font-[Monotype] mb-6">Meet TCJ</h2>
          <p className="text-[#A8A8A8] leading-relaxed mb-4">
            Chris John is a dynamic creative force from Akwa Ibom, Nigeria. As a serial entrepreneur, he leads projects across branding, tech, and education.
          </p>
          <p className="text-[#A8A8A8] leading-relaxed mb-8">
            From founding Africa’s most reliable branding agency (CDS Space), to building scalable Web3 solutions through CDS Labs, to shaping minds through CSCN, Chris is passionate about transformation through clarity and creativity.
          </p>
          <button className="border border-white px-4 py-2 rounded-md text-white hover:bg-white font-semibold hover:text-black transition flex items-center gap-2 text-sm">
            Learn More <span className="text-lg">→</span>
          </button>
        </div>

        {/* Right Image Section */}
        <div className="flex-1">
          <Image
            src="/images/meet.svg"
            alt="Chris John"
            width={40}
            height={40}
            className="w-full h-auto object-cover rounded-md"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default Meet;
