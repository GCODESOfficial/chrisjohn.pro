// about.tsx
'use client';

import Image from 'next/image';

export default function About() {
  return (
    <div className="min-h-screen font-[Lato] bg-black text-white flex flex-col items-center px-4 py-10 space-y-10">
      {/* TCJ Logo + Image */}
      <div className="relative w-full max-w-4xl flex flex-col items-center">
        <div className="text-[120px] font-serif font-bold text-white/10 z-10 absolute top-10 select-none">
          TCJ
        </div>

        <div className="relative z-20">
          <Image
            src="/images/john.svg" // Replace with your actual image path
            alt="Chris John"
            width={300}
            height={300}
            className="rounded-md object-cover"
          />
        </div>
      </div>

      {/* Title and Role */}
      <div className="text-center text-white text-lg italic font-light max-w-2xl">
        I’m Chris John, Serial Entrepreneur, Branding Expert, Business
        Developer, AI & Blockchain Consultant.
      </div>

      {/* Bio Box */}
      <div className="bg-neutral-900 text-gray-300 rounded-xl p-6 max-w-3xl w-full text-sm leading-relaxed">
        <p className="mb-4">
          Chris John is a dynamic creative force from Akwa Ibom, Nigeria. As a serial entrepreneur, he
          leads projects across branding, tech, and education.
        </p>
        <p>
          From founding Africa’s most reliable branding agency (CDS Space), to building scalable Web3
          solutions through CDS Labs, to shaping minds through CSCN, Chris is passionate about
          transformation through clarity and creativity.
        </p>
      </div>
    </div>
  );
}
