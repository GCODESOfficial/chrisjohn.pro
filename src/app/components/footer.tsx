'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white/5 w-10/12 mx-auto text-white py-6 mb-10 rounded-3xl mt-24 flex flex-col items-center gap-4 font-[Lato]">
      <div className="bg-[#0D0D0D] rounded-full px-3 py-3 flex items-center gap-4 border border-[#2F2F2F]">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/images/logo.svg" // store your logo image here
            alt="Logo"
            width={40}
            height={40}
            className='w-full h-full'
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#2F2F2F] mx-4" />

        {/* Social images */}
        <div className="flex items-center gap-4">
          <Image src="/images/facebook.svg" alt="Facebook" width={20} height={20} />
          <Image src="/images/twitter.svg" alt="X" width={20} height={20} />
          <Image src="/images/instagram.svg" alt="Instagram" width={20} height={20} />
          <Image src="/images/linkedin.svg" alt="LinkedIn" width={20} height={20} />
          <Image src="/images/tiktok.svg" alt="TikTok" width={20} height={20} />
        </div>
      </div>

      <div className="text-center text-sm text-[#B0B0B0]">
        <span>© 2025 The Chris John. All Rights Reserved.</span>
        <span className="mx-2">|</span>
        <span>
          Built By <span className="font-bold">CDS Space</span>
        </span>
      </div>
    </footer>
  );
}
