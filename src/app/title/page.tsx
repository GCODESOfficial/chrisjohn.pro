// app/[title]/page.tsx
export default function TitlePage() {
  return (
    <main className="min-h-screen bg-black text-white font-[Lato]">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-32">
        {/* Breadcrumb */}
        <p className="text-[10.5px] leading-none text-white/60">Work &gt; Chattel Gut Branding</p>

        {/* Meta */}
        <div className="mt-3 space-y-0.5">
          <p className="text-[11.5px] text-white/70">Role: <span className="text-white/90">Product Design</span></p>
          <p className="text-[11.5px] text-white/70">Timeline: <span className="text-white/90">July 2025</span></p>
        </div>

        {/* Hero block */}
        <div className="mt-5 h-44 rounded-2xl bg-[#121212] ring-1 ring-white/5 md:h-56" />

        {/* Project Brief */}
        <h2 className="mt-7 text-sm font-medium">Project Brief</h2>
        <p className="mt-1 max-w-md text-[11.5px] leading-relaxed text-white/70">
          The client’s platform was packed with features but lacked instructions. Users struggled to
          understand what the product did or how to get started, leading to high drop-offs and
          poor onboarding.
        </p>

        {/* Big block */}
        <div className="mt-3 h-44 rounded-2xl bg-[#121212] ring-1 ring-white/5 md:h-56" />

        {/* Two-up grid */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-44 rounded-2xl bg-[#121212] ring-1 ring-white/5 md:h-52" />
          <div className="h-44 rounded-2xl bg-[#121212] ring-1 ring-white/5 md:h-52" />
        </div>

        {/* Wide block */}
        <div className="mt-3 h-44 rounded-2xl bg-[#121212] ring-1 ring-white/5 md:h-56" />

        {/* Footer button */}
        <div className="mt-4">
          <button className="rounded-full border border-white/15 px-3.5 py-1.5 text-[10.5px] text-white/80 hover:text-white">
            Explore More work
          </button>
        </div>
      </div>
    </main>
  );
}
