"use client";
import { useState } from "react";
import WhatPeopleSay from "../components/WhatPeopleSay";
import Image from "next/image";
import BookModal from "../components/BookModal";
import PurchaseModal from "../components/PurchaseModal";

export default function BooksPage() {
    const [modal, setModal] = useState<"none" | "book-info" | "book-form">("none");

  return (
    <main className="min-h-screen font-[Lato] bg-black text-white">
         <div className="relative  w-full max-w-5xl mx-auto rounded-2xl overflow-hidden h-[35rem]">
      {/* Background Image */}
      <Image
        src="/images/books-bg.svg"
        alt="Books"
        fill
        className=" h-auto w-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Centered Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 px-4">
        <h2 className="text-3xl md:text-5xl ">Books Authored</h2>
        <p className="text-xl md:text-4xl font-[Monotype] mt-2">by Chris John</p>
      </div>
    </div>

    <div className="max-w-5xl mx-auto mt-28 relative rounded-2xl flex flex-col md:flex-row items-center gap-8 p-6 md:p-10 text-white  overflow-visible">
      {/* Book Container */}
      <div className="relative w-[220px] shrink-0">
        {/* Back (Blurred Shadow Book) */}
        <Image
          src="/images/manifest-book.svg"
          alt="Shadow Book"
          width={280}
          height={360}
          className="absolute top-10 -left-10 opacity-10  drop-shadow-2xl z-0"
        />

        {/* Front (Main Book) */}
        <Image
          src="/images/manifest-book.svg"
          alt="Manifest Book"
          width={280}
          height={360}
          className="relative z-20 object-contain"
        />
      </div>

      {/* Text Content */}
      <div className="flex-1 z-10 bg-[#0f0f0f] py-5 absolute w-4xl max-w-4xl rounded-2xl left-36 top-20 pl-80 pr-32">
        <h4 className="text-sm text-white font-semibold uppercase tracking-wide mb-2">
          Manifest
        </h4>
        <h2 className="text-2xl md:text-3xl font-[Monotype] font-light mb-4">
          7 Steps To Living <br className="hidden sm:block" />
          Your Best Life
        </h2>
        <p className="text-[#A8A8A8] text-sm leading-relaxed mb-6">
          Chris John introduces Manifest, a deeply personal guide designed to support
          readers to heal their relationship with money and align their financial
          goals with a greater purpose.
        </p>

        <button  onClick={() => setModal("book-info")} className="bg-white text-black text-sm px-5 py-2 rounded-md flex items-center gap-2 hover:bg-gray-100 transition">
          Buy Now <span>→</span>
        </button>
      </div>
    </div>

    <section className="bg-black text-white pt-36 text-center">
      <h2 className="text-4xl font-semibold">
        Real Story, <span className="font-[Monotype] text-5xl font-normal">Real Impact</span>
      </h2>

      <div className="mt-10 text-2xl font-[Monotype] leading-relaxed max-w-4xl mx-auto">
        <p className="text-4xl mb-4">“</p>
        <p>
          Manifest is the most insightful book i have read. <br />
          Chris has really made a change by writting this book.
        </p>

        <div className="mt-8 flex justify-center items-center gap-3">
          <Image
            src="/images/Avatar.svg"
            alt="Styles Jason"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="text-left font-[Lato] text-sm">
            <p className="font-medium">Styles Jason</p>
            <p className="text-[#A8A8A8]">Canada</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === "book-info" && (
        <BookModal
          onClose={() => setModal("none")}
          onProceed={() => setModal("book-form")}
        />
      )}
      {modal === "book-form" && <PurchaseModal onClose={() => setModal("none")} />}
  
    </section>


      <div className="py-32">
   <WhatPeopleSay />
      </div>
   
    </main>
  );
}