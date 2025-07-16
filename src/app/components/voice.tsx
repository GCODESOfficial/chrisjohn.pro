// voice.tsx
'use client';

export default function Voice() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold">My Thoughts,</h1>
        <h2 className="text-2xl font-[Monotype]">My Voice.</h2>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-4 gap-4 max-w-5xl">
        {/* Column 1 */}
        <div className="flex flex-col gap-4">
          <div className="h-36 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-44 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-28 w-32 rounded-xl bg-neutral-800"></div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-4">
          <div className="h-24 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-52 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-36 w-32 rounded-xl bg-neutral-800"></div>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-4">
          <div className="h-36 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-28 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-40 w-32 rounded-xl bg-neutral-800"></div>
        </div>

        {/* Column 4 */}
        <div className="flex flex-col gap-4">
          <div className="h-40 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-44 w-32 rounded-xl bg-neutral-800"></div>
          <div className="h-28 w-32 rounded-xl bg-neutral-800"></div>
        </div>
      </div>
    </div>
  );
}
