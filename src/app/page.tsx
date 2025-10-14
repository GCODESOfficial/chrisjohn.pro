"use client";
import Image from "next/image";
import HeroSection from "./components/HeroSection";
import Meet from "./components/meet";
import WaysHelp from "./components/WaysHelp";
import WhatPeopleSay from "./components/WhatPeopleSay";
import Voice from "./components/voice";

const images = ["/images/brands1.svg"];

const Home = () => {
  return (
    <div className="font-[Lato]">
      <HeroSection />
      <div className="max-w-5xl w-11/12 md:w-5xl mx-auto py-20">
        <div className="max-w-5xl w-11/12 md:w-5xl h-[450px] mx-auto rounded-2xl">
          <video
            src="/placeholdervideo.mp4"
            width={150}
            height={150}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-[450px] rounded-2xl object-cover"
          />
        </div>
      </div>

      <Meet />

      {/* Logos */}
      <div className="flex items-center justify-center gap-6 max-w-5xl md:w-5xl mx-auto">
        <div className="relative overflow-hidden w-full">
          {/* Gradient Overlays */}
          {/* Blush to background */}
          <div className="absolute top-0 left-0 w-20 h-full z-30 bg-gradient-to-l from-transparent via-black to-black pointer-events-none" />
          <div className="absolute top-0 right-0 w-20 h-full z-30 bg-gradient-to-r from-transparent via-black to-black pointer-events-none" />

          {/* Scrolling Logos */}
          <div className="flex animate-scroll-x min-w-max">
            {[...images, ...images, ...images, ...images, ...images].map(
              (src, i) => (
                <div key={i} className="mr-8 flex items-center">
                  <Image
                    src={src}
                    alt={`Scrolling Image ${i + 1}`}
                    width={900}
                    height={600}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <WaysHelp />

      <WhatPeopleSay />
      <Voice />
    </div>
  );
};

export default Home;
