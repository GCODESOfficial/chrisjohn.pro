/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import WhatPeopleSay from "../components/WhatPeopleSay";
import BookModal from "../components/BookModal";
import PurchaseModal from "../components/PurchaseModal";
import { supabase } from "@/lib/supabase";

/** Match your admin/books schema */
type BookRow = {
  id: string;
  created_at: string;
  title: string | null;
  subtitle: string | null;
  price: string | null;
  author_name: string | null;
  x_link: string | null;
  instagram_link: string | null;
  about: string | null;
  cover_url_front: string | null;
  cover_url_back: string | null;
};

export default function BooksPage() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState<"none" | "book-info" | "book-form">("none");
  const [selected, setSelected] = useState<BookRow | null>(null);                // full book for the info modal
  const [selectedBook, setSelectedBook] = useState<{ id: string } | null>(null); // id for purchase modal

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("books")
          .select(
            "id, created_at, title, subtitle, price, author_name, x_link, instagram_link, about, cover_url_front, cover_url_back"
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancel) setBooks((data || []) as BookRow[]);
      } catch (e) {
        console.error(e);
        if (!cancel) setBooks([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <main className="min-h-screen font-[Lato] bg-black text-white">
      {/* Hero */}
      <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden h-[35rem]">
        <Image
          src="/images/books-bg.svg"
          alt="Books"
          fill
          className="h-auto w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-10 px-4">
          <h2 className="text-3xl md:text-5xl">Books Authored</h2>
          {books.length > 0 &&
            books.every((b) => b.author_name === books[0].author_name) &&
            books[0].author_name && (
              <p className="text-xl md:text-4xl font-[Monotype] mt-2">by {books[0].author_name}</p>
            )}
        </div>
      </div>

      {/* Books list */}
      <div className="max-w-5xl mx-auto mt-20 space-y-24 px-6 md:px-10">
        {loading && (
          <div className="space-y-10">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loading &&
          books.map((book) => (
            <div
              key={book.id}
              className="relative rounded-2xl flex md:flex-row flex-col items-start gap-8 py-10 md:py-16 overflow-visible md:min-h-[320px]"
            >
              {/* Book visuals (left) */}
              <div className="relative w-[220px] shrink-0 mx-auto md:mx-0">
                {book.cover_url_back && (
                  <img
                    src={book.cover_url_back}
                    alt={`${book.title || "Book"} back`}
                    width={280}
                    height={360}
                    className="absolute top-14 -left-10 opacity-10 drop-shadow-2xl z-0"
                    loading="lazy"
                  />
                )}
                {book.cover_url_front && (
                  <img
                    src={book.cover_url_front}
                    alt={book.title || "Book"}
                    width={280}
                    height={360}
                    className="relative z-20 object-contain"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Info panel (right) */}
              <div
                className="
                  z-10 bg-[#0f0f0f] rounded-2xl md:w-[52rem] w-full -mt-12 md:-mt-0 h-72
                  p-8
                  relative md:absolute md:left-36 md:top-24 md:pl-48 md:pr-32
                "
              >
                {book.title && (
                  <h4 className="md:text-sm text-white font-semibold uppercase tracking-wide mb-2">
                    {book.title}
                  </h4>
                )}
                {book.subtitle && (
                  <h2 className="text-3xl md:text-3xl font-[Monotype] font-light mb-4 whitespace-pre-line">
                    {book.subtitle}
                  </h2>
                )}
                {book.about && (
                  <p className="text-[#A8A8A8] md:text-sm leading-relaxed mb-6">{book.about}</p>
                )}

                <button
                  onClick={() => {
                    setSelected(book);        // pass full data into BookModal
                    setModal("book-info");
                  }}
                  className="bg-white text-black md:text-sm px-5 py-2 rounded-md flex items-center gap-2 hover:bg-gray-100 transition"
                >
                  {book.price ? `Buy Now — ${book.price}` : "Buy Now"} <span>→</span>
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Modals */}
      {modal === "book-info" && selected && (
        <BookModal
          initial={selected}            // dynamic content
          onClose={() => setModal("none")}
          onProceed={() => {
            if (selected) setSelectedBook({ id: selected.id }); // set the id for the purchase modal
            setModal("book-form");
          }}
        />
      )}

      {modal === "book-form" && selectedBook && (
        <PurchaseModal
          bookId={selectedBook.id}      // PurchaseModal already accepts this
          onClose={() => setModal("none")}
        />
      )}

      {/* Testimonials */}
      <section className="py-32">
        <WhatPeopleSay />
      </section>
    </main>
  );
}
