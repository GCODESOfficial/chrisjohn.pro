// voice.tsx
'use client';

export default function Voice() {
  return (
    <div className="min-h-screen text-white flex flex-col items-center py-40 px-4">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-3xl font-semibold">My Thoughts,</h1>
        <h2 className="text-5xl font-[Monotype]">My Voice.</h2>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-4 gap-4 max-w-5xl w-5xl mx-auto">
        {/* Column 1 */}
        <div className="flex flex-col gap-4">
          <div className="h-72 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-80 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-56 w-full rounded-xl bg-neutral-800"></div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-4">
          <div className="h-56 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-80 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-72 w-full rounded-xl bg-neutral-800"></div>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-4">
          <div className="h-80 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-72 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-56 w-full rounded-xl bg-neutral-800"></div>
        </div>

        {/* Column 4 */}
        <div className="flex flex-col gap-4">
          <div className="h-72 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-80 w-full rounded-xl bg-neutral-800"></div>
          <div className="h-56 w-full rounded-xl bg-neutral-800"></div>
        </div>
      </div>
    </div>
  );
}
