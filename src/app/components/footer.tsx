'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white/5 md:w-10/12 w-11/12 mx-auto text-white py-6 mb-10 rounded-3xl mt-24 flex flex-col items-center gap-4 font-[Lato]">
      <div className="bg-[#0D0D0D] rounded-full px-3 py-3 flex items-center gap-4 border border-[#2F2F2F]">
        {/* Logo */}
        <div className="items-center gap-2 hidden md:flex">
          <Image
            src="/images/logo.svg" // store your logo image here
            alt="Logo"
            width={40}
            height={40}
            className='w-32'
          />
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[#2F2F2F] mx-4 hidden md:block" />

        {/* Social images */}
        <div className="flex items-center gap-4">
          <Image src="/images/facebook.svg" alt="Facebook" width={27} height={27}/>
          <Image src="/images/twitter.svg" alt="X" width={27} height={27} />
          <Image src="/images/instagram.svg" alt="Instagram" width={27} height={27} />
          <Image src="/images/linkedin.svg" alt="LinkedIn" width={27} height={27} />
          <Image src="/images/tiktok.svg" alt="TikTok" width={27} height={27} />
        </div>
      </div>

      <div className="text-center text-[10px] text-[#B0B0B0] flex items-center ">
        <span className='flex justify-center items-center gap-1 text-lg'>© <h1 className='text-white text-[10px]'>2025 The Chris John. All Rights Reserved.</h1></span>
        <span className="mx-2">|</span>
        <span>
          Built By <span className="font-bold text-white">CDS Space</span>
        </span>
      </div>
    </footer>
  );
}
