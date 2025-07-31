/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";

const links = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/works" },
  { label: "Books", href: "/books" },
  { label: "Events", href: "/events" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="w-full font-[Lato] fixed bg-[#0F0F0F] text-white px-6 md:px-32 py-4 flex justify-between items-center z-50">
      {/* Logo */}
      <Link href="/" className="block">
        <div>
          <img
            src="/images/logo.svg"
            alt="GS Labs"
            className="md:w-auto h-auto w-[104px]"
          />
        </div>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
             className={clsx(
        "text-sm relative",
        pathname === link.href ? "text-white" : "text-[#8E8E8E]",
        "hover:text-white"
      )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <a
        href="https://t.me/cdslabsxyz"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden ml-4 px-4 py-1.5 bg-white text-black rounded-full md:flex items-center gap-2 text-sm font-semibold"
      >
        Let’s Talk
      </a>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <img src="/images/menu-04.svg" alt="" className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-[#0F0F0F] text-[#E3E3E3] px-6 py-6 flex flex-col z-40">
          {/* Header with Logo & Close */}
          <div className="flex justify-between items-center mb-10">
            <Link href="/" className="block">
              <div className="flex items-center gap-2 font-bold text-xl">
                <img
                  src="/images/logo.svg"
                  alt="GS Labs"
                  className="w-[104px]"
                />
              </div>
            </Link>
            <button onClick={() => setMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav Links with active underline */}
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
        "text-sm relative pb-1",
        pathname === link.href ? "text-white" : "text-[#8E8E8E]",
        "hover:text-white"
      )}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Button */}
          <a
            href="https://t.me/cdslabsxyz"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 px-4 py-2 bg-white text-black rounded-full flex items-center gap-2 w-fit text-sm font-semibold"
          >
            Let’s Talk
          </a>
        </div>
      )}
    </nav>
  );
}
