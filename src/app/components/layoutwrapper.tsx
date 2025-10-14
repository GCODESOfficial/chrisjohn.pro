// app/layoutwrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";
import Footer from "./footer";
import Build from "./build";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // hide navbar/footer only on `/admin` routes
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Build />}
      {!isAdmin && <Footer />}
    </>
  );
}
