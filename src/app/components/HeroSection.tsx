"use client";

import React from "react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative rounded-xl max-w-5xl md:w-5xl w-11/12 pt-28 md:pb-28  mx-auto bg-white/4 text-white overflow-hidden md:flex items-center justify-center mt-28 backdrop-blur-sm">
      {/* Blush to background */}
      <div className="absolute bottom-0 left-0 w-full h-20 z-30 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />

      {/* Lamp spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:block">
        <Image
          src="/images/light.svg"
          alt="Lamp Spotlight"
          width={300}
          height={300}
          className="w-screen h-[400px] md:w-full md:h-[400px] object-cover"
        />
      </div>


      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-screen md:hidden">
        <Image
          src="/images/light.svg"
          alt="Lamp Spotlight"
          width={300}
          height={300}
          className="w-screen h-[350px] md:w-full md:h-[400px] md:object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-center max-w-5xl md:w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold">
          When <span className="text-white">you win</span>
        </h1>
        <h2 className="text-5xl md:text-7xl font-bold mt-2">in your mind,</h2>
        <p className="font-[Monotype] text-4xl md:text-6xl mt-4">
          You win on the ground.
        </p>
        <p className="mt-6 md:w-lg px-4 mx-auto md:text-lg font-light">
          I build People, Brands and Great User Experiences for Global Brands
          and Intentional Individuals.
        </p>

        {/* Founder Image with Static Tag */}
        <div className="relative md:absolute md:-bottom-24 left-0 z-30 flex md:flex-col items-center mt-12">
          {/* Floating Tag */}
          <div className="mb-2 animate-bounce md:block hidden">
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
            className="md:rounded-t-xl grayscale scale-x-[-1] md:w-auto md:h-[200px] h-[100px] w-auto object-contain"
          />


          <div className="mb-2 animate-bounce md:hidden">
            <Image
              src="/images/dev.svg"
              alt="Founder tag"
              width={300}
              height={300}
              className="w-auto h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
