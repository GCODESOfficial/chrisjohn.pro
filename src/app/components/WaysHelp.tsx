'use client';

import Image from 'next/image';
import React from 'react';

const WaysHelp = () => {
  return (
    <div className="bg-black text-white py-20 px-6 md:px-12 font-[Lato]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl mb-16">
          Ways I Can <span className="font-[Monotype]">Help.</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 - What I Focus On */}
          <div className="bg-[#0F0F0F] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-[Monotype] mb-2">What I Focus On</h3>
              <p className="text-gray-400 text-sm mb-4">
                The areas where I bring the most value and impact.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden">
              <Image
                src="/focus-tags.png" // export the tag-style image
                alt="Focus Areas"
                width={400}
                height={200}
                className="w-full object-cover"
              />
            </div>
          </div>

          {/* Card 2 - Consultation */}
          <div className="bg-[#F0F0F0] text-black rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-[Monotype] mb-2">Consultation</h3>
              <p className="text-gray-800 text-sm mb-4">
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
          <div className="bg-[#0F0F0F] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-[Monotype] mb-2">My Books</h3>
              <p className="text-gray-400 text-sm mb-4">
                Read. Reflect. Reposition.
              </p>
              <button className="border border-white px-4 py-2 rounded-md text-white text-sm flex items-center gap-2 hover:bg-white hover:text-black transition">
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
