"use client";

import Image from "next/image";

const items = [
  {
    title: "Brand Strategy & Identity",
    desc: "Shaping brands with purpose and clarity.",
    img: "/images/branding.svg",
  },
  {
    title: "Business Development",
    desc: "Building strategies that drive growth and results.",
    img: "/images/business.svg",
  },
  {
    title: "AI & Blockchain Integration",
    desc: "Innovative tech solutions for the future of business.",
    img: "/images/ai.svg",
  },
  {
    title: "Speaking & Mentorship",
    desc: "Inspiring minds and guiding the next generation.",
    img: "/images/mentorship.svg",
  },
  {
    title: "Global Growth Consulting",
    desc: "Helping brands scale and thrive worldwide.",
    img: "/images/global.svg",
  },
];

export default function SpecializationsSection() {
  const row1 = items.slice(0, 3);
  const row2 = items.slice(3);

  return (
    <section className="bg-black text-white pt-28 px-6 md:px-12">
      <div className="max-w-5xl mx-auto text-left mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold">
          What I specialize in and
        </h2>
        <p className="text-5xl font-[Monotype] text-gray-300 mt-2">
          enjoy <span className="text-white">doing most.</span>
        </p>
      </div>

      {/* Row 1: 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  max-w-5xl gap-6 mb-6">
        {row1.map((item, index) => (
          <div
            key={index}
            className="bg-[#0f0f0f] rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="mb-4">
              <h3 className="text-white font-semibold text-lg mb-1">
                {item.title}
              </h3>
              <p className="text-[#626262] text-sm">{item.desc}</p>
            </div>
            <div className="overflow-hidden rounded-xl mt-4">
              <Image
                src={item.img}
                alt={item.title}
                width={600}
                height={400}
                className="w-full h-40 object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: 2 columns, centered */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {row2.map((item, index) => (
          <div
            key={index}
            className="bg-[#0f0f0f] rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="mb-4">
              <h3 className="text-white font-semibold text-lg mb-1">
                {item.title}
              </h3>
              <p className="text-[#626262] text-sm">{item.desc}</p>
            </div>
            <div className="overflow-hidden rounded-xl mt-4">
              <Image
                src={item.img}
                alt={item.title}
                width={600}
                height={400}
                className="w-full h-40 object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
