/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

export default function Build() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setStatus({ ok: false, msg: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, message, company }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Something went wrong.');
      }
      setStatus({ ok: true, msg: "Message sent! Check your inbox for a confirmation." });
      setFullName('');
      setEmail('');
      setMessage('');
      setCompany('');
    } catch (err: any) {
      setStatus({ ok: false, msg: err.message || 'Failed to send message.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative md:max-w-5xl md:w-5xl mx-auto font-[Lato] md:bg-white/4 md:rounded-3xl text-white md:py-20 md:px-8 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
      
      {/* Blush to background */}
      <div className="absolute bottom-0 left-0 w-full h-20 z-30 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />

      
      {/* Left Text */}
      <div className="md:max-w-md">
        <h2 className="text-4xl text-center md:text-left md:text-6xl font-bold mb-2">Let’s Build</h2>
        <h2 className="text-5xl md:text-8xl text-center md:text-left font-[Monotype] mb-6">Together</h2>
        <p className="text-[#B0B0B0] text-lg text-center md:text-left md:w-sm">
          Whether you want to collaborate, consult, or connect, I’d love to hear from you.
        </p>
      </div>

      {/* Right Form */}
      <form onSubmit={onSubmit} className="bg-[#131313] p-6 rounded-xl w-full md:max-w-md flex flex-col gap-4">
        {/* Honeypot (hidden) */}
        <label className="sr-only" htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
        />

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="bg-[#1A1A1A] text-white placeholder-[#B0B0B0] px-4 py-3 rounded-md outline-none"
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-[#1A1A1A] text-white placeholder-[#B0B0B0] px-4 py-3 rounded-md outline-none"
        />
        <textarea
          placeholder="Share your challenges or vision with me. I’m here to help you bring it to life!"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="bg-[#1A1A1A] text-white placeholder-[#B0B0B0] px-4 py-3 rounded-md outline-none"
        ></textarea>

        <button
          type="submit"
          disabled={loading}
          className={`bg-[#D9D9D9] text-black font-semibold py-3 rounded-md transition
            ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white'}`}
          aria-busy={loading}
        >
          {loading ? 'Sending…' : 'Send Message'}
        </button>

        {status && (
          <p
            className={`text-sm mt-1 ${status.ok ? 'text-emerald-400' : 'text-rose-400'}`}
            role={status.ok ? 'status' : 'alert'}
          >
            {status.msg}
          </p>
        )}
      </form>
    </section>
  );
}
