"use client";

import React from "react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative max-w-5xl w-5xl pb-28 mx-auto bg-white/5 text-white overflow-hidden md:flex items-center justify-center pt-44 backdrop-blur-sm">
      {/* Blush to background */}
      <div className="absolute bottom-0 left-0 w-full h-20 z-30 bg-gradient-to-b from-transparent via-black to-black pointer-events-none" />

      {/* Lamp spotlight */}
      <div className="absolute top-[77px] left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <Image
          src="/images/light.svg"
          alt="Lamp Spotlight"
          width={300}
          height={300}
          className="w-auto h-auto md:w-full md:h-[400px] object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-5xl w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold">
          When <span className="text-white">you win</span>
        </h1>
        <h2 className="text-5xl md:text-7xl font-bold mt-2">in your mind,</h2>
        <p className="font-[Monotype] text-3xl md:text-6xl mt-4">
          You win on the ground.
        </p>
        <p className="mt-6 md:w-lg mx-auto">
          I build People, Brands and Great User Experiences for Global Brands
          and Intentional Individuals.
        </p>

        {/* Founder Image with Static Tag */}
        <div className="relative md:absolute -bottom-24 left-0 z-30 flex flex-col items-center">
          {/* Floating Tag */}
          <div className="mb-2 animate-bounce">
            <Image
              src="/images/dev.svg"
              alt="Founder tag"
              width={300}
              height={300}
              className="w-auto h-auto"
            />
          </div>

          {/* Founder Image */}
          <Image
            src="/images/chrisjohn.svg"
            alt="Founder"
            width={500}
            height={400}
            className="rounded-t-xl grayscale scale-x-[-1] md:w-auto md:h-[200px] object-contain"
          />
        </div>
      </div>
    </section>
  );
}
