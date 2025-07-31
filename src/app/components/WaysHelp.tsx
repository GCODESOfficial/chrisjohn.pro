"use client";

import Image from "next/image";
import React from "react";
import clsx from "clsx";

const tagLines = [
  [
    "Strategy",
    "Business Development",
    "Brand Strategy",
    "Brand Identity",
    "Blockchain Integration",
    "Brand Identity",
  ],
  [
    "Brand Identity",
    "Blockchain Integration",
    "Brand Identity",
    "Leadership",
    "Global Growth Consulting",
    "Mentorship",
  ],
  [
    "Leadership",
    "Global Growth Consulting",
    "Mentorship",
    "Brand Identity",
    "Blockchain Integration",
    "Brand Identity",
  ],
  [
    "Business Development",
    "Brand Strategy",
    "Brand Identity",
    "Blockchain Integration",
    "Brand Identity",
    "Leadership",
  ],
];

const WaysHelp = () => {
  return (
    <div className="bg-black text-white py-40 px-6 md:px-12 font-[Lato]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl mb-16">
          Ways I Can <span className="font-[Monotype]">Help.</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8 ">
          {/* Card 1 - What I Focus On */}
          <div className="bg-[#0F0F0F] rounded-2xl px-6 pt-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-[Monotype] mb-2">What I Focus On</h3>
              <p className="text-[#626262] text-sm mb-4">
                The areas where I bring the most value and impact.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden">
              <div className="w-[320px] h-[250px] relative bg-[#292929] flex flex-col justify-center overflow-hidden rounded-md space-y-3 p-2">
                {tagLines.map((tags, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "whitespace-nowrap flex gap-3",
                      idx % 2 === 0
                        ? "animate-scroll-right"
                        : "animate-scroll-left"
                    )}
                  >
                    {tags.map((tag, i) => (
                      <div
                        key={i}
                        className="px-4 py-1 rounded-full bg-gradient-to-b from-[#f2f2f2] to-[#d9d9d9] text-black text-sm font-medium"
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                ))}
                      <div className="absolute bottom-0 left-0 w-full h-20 z-30 bg-gradient-to-b from-transparent via-[#0F0F0F] to-[#0F0F0F] pointer-events-none" />

              </div>
            </div>
          </div>

          {/* Card 2 - Consultation */}
          <div className="bg-[#F0F0F0] text-black rounded-2xl px-6 pt-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-[Monotype] mb-2">Consultation</h3>
              <p className="text-[#060606] text-sm mb-4">
                Book a Session with Chris John
              </p>
              <button className="bg-black text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:opacity-90">
                Book a Session <span className="text-base">→</span>
              </button>
            </div>
            <div className="mt-6">
              <Image
                src="/images/chris.svg"
                alt="Chris John"
                width={300}
                height={300}
                className="w-full object-contain"
              />
            </div>
          </div>

          {/* Card 3 - My Books */}
          <div className="bg-[#0F0F0F] rounded-2xl px-6 pt-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-[Monotype] mb-2">My Books</h3>
              <p className="text-[#626262] text-sm mb-4">
                Read. Reflect. Reposition.
              </p>
              <button className="border border-white px-4 py-2 rounded-md text-white text-sm flex items-center gap-2 hover:bg-white hover:text-black hover:font-semibold transition">
                Buy Now <span className="text-base">→</span>
              </button>
            </div>
            <div className="mt-6 rounded-xl overflow-hidden">
              <Image
                src="/images/book.svg"
                alt="Books"
                width={400}
                height={300}
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaysHelp;
