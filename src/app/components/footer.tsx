'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-8 flex flex-col items-center gap-4">
      <div className="bg-[#0D0D0D] rounded-full px-6 py-3 flex items-center gap-4 border border-[#2F2F2F]">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png" // store your logo image here
            alt="Logo"
            width={40}
            height={40}
          />
          <div className="flex flex-col">
            <span className="font-bold">Chris John</span>
            <span className="text-xs">thechrisjohn.pro</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#2F2F2F] mx-4" />

        {/* Social Icons */}
        <div className="flex items-center gap-4">
          <Image src="/icons/facebook.png" alt="Facebook" width={20} height={20} />
          <Image src="/icons/x.png" alt="X" width={20} height={20} />
          <Image src="/icons/instagram.png" alt="Instagram" width={20} height={20} />
          <Image src="/icons/linkedin.png" alt="LinkedIn" width={20} height={20} />
          <Image src="/icons/tiktok.png" alt="TikTok" width={20} height={20} />
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
