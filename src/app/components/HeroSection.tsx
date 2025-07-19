'use client';

import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative bg-black text-white py-60 px-4 flex justify-center items-center text-center overflow-hidden">
  {/* Founder badge & image */}
  <div className="">
        <Image
          src="/images/chrisjohn.svg" // store your image in public/profile.png
          alt="Founder"
          width={150}
          height={150}
          className=""
        />
      </div>

<div>
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
      </div>
      
    </section>
  );
}
