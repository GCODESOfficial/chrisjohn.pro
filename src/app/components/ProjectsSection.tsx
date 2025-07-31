"use client";

const projects = new Array(15).fill({
  title: "Cheetah Bot Branding",
  role: "Creative Director",
});

export default function ProjectsSection() {
  return (
    <section className="bg-black font-[Lato] text-white px-6 md:px-12 relative">
      {/* Title Section */}
      <div className="max-w-5xl bg-white/5 py-44 mx-auto text-center relative z-10">
        {/* Blush Gradient */}
        <div className="absolute bottom-0 left-0 w-full h-20 z-0 bg-gradient-to-t from-transparent to-white/3 pointer-events-none" />

        <h2 className="text-4xl md:text-5xl font-extrabold">
          Crafted with Purpose,
        </h2>
        <p className="text-4xl text-white mb-4 font-[Monotype]">
          Driven by <span className="text-white">Impact</span>
        </p>
        <p className="text-white text-sm">
          A look at some of my past projects.
          <br />
          <span className="text-xs">
            (Projects under NDA will be shared once the agreements expire.)
          </span>
        </p>
      </div>

      {/* Grid Wrapper (above blush) */}
      <div className="relative z-40 -mt-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 space-x-3 space-y-7">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-lg h-56 p-4 flex flex-col justify-end"
            >
              <div>
                <h3 className="text-sm font-medium">{project.title}</h3>
                <p className="text-[11px] text-[#626262] bg-[#212121] border-[1px] border-[#292929] px-2 py-[2px] rounded-full inline-block mt-1">
                  {project.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
