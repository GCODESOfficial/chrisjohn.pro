'use client';

import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative bg-black text-white py-20 px-4 flex flex-col items-center text-center overflow-hidden">
      {/* Spotlight effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-white/20 to-transparent rounded-full blur-3xl"></div>

      {/* Main Heading */}
      <h1 className="text-4xl md:text-6xl font-bold mb-2">
        When you win <br /> in your mind,
      </h1>
      <h2 className="text-3xl md:text-5xl font-[Monotype] mb-6">
        You win on the ground.
      </h2>

      {/* Subtitle */}
      <p className="max-w-xl text-[#B0B0B0] mb-12">
        I build People, Brands and Great User Experiences for Global Brands and Intentional Individuals.
      </p>

      {/* Founder badge & image */}
      <div className="relative flex flex-col items-center">
        <Image
          src="/images/profile.svg" // store your image in public/profile.png
          alt="Founder"
          width={150}
          height={150}
          className=""
        />
      </div>
    </section>
  );
}
