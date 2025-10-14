"use client";

import Image from "next/image";

const ventures = [
  {
    title: "CDS Space",
    desc: "Africa’s most reliable branding agency",
    img: "/images/cds-space.svg",
  },
  {
    title: "CSCN",
    desc: "Inclusive learning & mentoring platform",
    img: "/images/cscn.svg",
  },
  {
    title: "CDS Labs",
    desc: "Web3 design & development lab",
    img: "/images/cds-labs.svg",
  },
];

export default function EcosystemSection() {
  return (
    <section className="bg-black text-white pt-28 md:px-12 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16 px-6 md:px-0">
        <h2 className="text-3xl md:text-4xl font-extrabold">
          The Ecosystem
        </h2>
        <p className="md:text-6xl text-5xl italic font-[Monotype] mt-2 mb-4">
          I’m <span className="text-white">Building.</span>
        </p>
        <p className="text-[#626262] text-lg">
          Explore the ventures I lead and co-create.
        </p>
      </div>

      <div className="flex md:flex-row flex-col  gap-6 ">
  {ventures.map((venture, index) => (
    <div
      key={index}
      className="bg-gradient-to-b from-[#0f0f0f] to-[#0f0f0f] rounded-2xl flex flex-col items-center text-center w-full md:w-auto"
    >
      <div className="w-full h-auto flex items-center justify-center">
        <Image
          src={venture.img}
          alt={venture.title}
          width={100}
          height={100}
          className="object-contain w-full h-auto"
        />
      </div>
      <div className="w-full px-4 py-4 text-left">
        <h3 className="text-white font-semibold text-lg mb-1">
          {venture.title}
        </h3>
        <p className="text-[#626262] text-sm">{venture.desc}</p>
      </div>
    </div>
  ))}
</div>

    </section>
  );
}
