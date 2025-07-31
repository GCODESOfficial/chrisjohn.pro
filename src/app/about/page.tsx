// about.tsx
'use client';

import Image from 'next/image';
import Voice from '../components/voice';
import SpecializationsSection from '../components/SpecializationsSection';
import EcosystemSection from '../components/EcosystemSection';

export default function About() {
  return (
    <div className="min-h-screen font-[Lato] bg-black text-white flex flex-col items-center px-4 space-y-10">
      {/* TCJ Logo + Image */}
      <div className="relative w-full pt-48 max-w-5xl flex flex-col items-center bg-white/5">
        <div className="text-[320px] font-[Monotype] font-extrabold text-white z-0 absolute -top-0 select-none">
          TCJ
        </div>

        <div className="relative z-20">
          <Image
            src="/images/john.svg" // Replace with your actual image path
            alt="Chris John"
            width={500}
            height={400}
            className="rounded-md object-cover"
          />
        </div>

        {/* Blush to background */}
      <div className="absolute bottom-0 left-0 w-full h-20 z-30 bg-gradient-to-b from-transparent via-black to-black pointer-events-none" />

      </div>

      {/* Title and Role */}
      <div className="text-center py-10 font-[Monotype] text-[#E3E3E3] text-2xl italic font-light max-w-lg">
        I’m Chris John, Serial Entrepreneur, Branding Expert, Business
        Developer, AI & Blockchain Consultant.
      </div>

      {/* Bio Box */}
      <div className="bg-[#0D0D0D] text-[#A8A8A8] rounded-xl py-20 max-w-5xl w-full leading-relaxed px-60">
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

      <SpecializationsSection />

      <EcosystemSection />

      <Voice />
    </div>
  );
}
