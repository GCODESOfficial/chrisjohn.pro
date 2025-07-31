'use client';

export default function Build() {
  return (
    <section className="max-w-5xl w-5xl mx-auto font-[Lato] bg-white/5 rounded-3xl text-white py-6 px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
      {/* Left Text */}
      <div className="max-w-md">
        <h2 className="text-4xl md:text-5xl font-bold mb-2">Let’s Build</h2>
        <h2 className="text-5xl md:text-6xl font-[Monotype] mb-6">Together</h2>
        <p className="text-[#B0B0B0]">
          Whether you want to collaborate, consult, or connect, I’d love to hear from you.
        </p>
      </div>

      {/* Right Form */}
      <form className="bg-[#0D0D0D] p-6 rounded-xl w-full max-w-md flex flex-col gap-4">
        <input
          type="text"
          placeholder="Full Name"
          className="bg-[#1A1A1A] text-white placeholder-[#B0B0B0] px-4 py-3 rounded-md outline-none"
        />
        <input
          type="email"
          placeholder="Email Address"
          className="bg-[#1A1A1A] text-white placeholder-[#B0B0B0] px-4 py-3 rounded-md outline-none"
        />
        <textarea
          placeholder="Share your challenges or vision with me. I’m here to help you bring it to life!"
          rows={4}
          className="bg-[#1A1A1A] text-white placeholder-[#B0B0B0] px-4 py-3 rounded-md outline-none"
        ></textarea>
        <button
          type="submit"
          className="bg-[#D9D9D9] text-black font-semibold py-3 rounded-md"
        >
          Send Message
        </button>
      </form>
    </section>
  );
}
