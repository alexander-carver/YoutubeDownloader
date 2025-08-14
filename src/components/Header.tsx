"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={28} height={28} priority />
            <span className="text-base font-semibold tracking-tight">FreeVideosDownloader <span aria-hidden>📥</span></span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/80 md:flex">
            <a href="#features" className="hover:text-foreground"><span aria-hidden>✨</span> Features</a>
            <a href="#how-it-works" className="hover:text-foreground"><span aria-hidden>🛠️</span> How it works</a>
          </nav>

          <div className="hidden md:block">
            <a href="#download" className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-90"><span aria-hidden>⬇️</span> Download now</a>
          </div>

          <button
            className="inline-flex items-center justify-center rounded md:hidden h-9 w-9 border border-black/10"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-black/10">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="grid gap-3 text-sm font-medium">
              <a href="#features" className="py-2"><span aria-hidden>✨</span> Features</a>
              <a href="#how-it-works" className="py-2"><span aria-hidden>🛠️</span> How it works</a>
              <a href="#download" className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"><span aria-hidden>⬇️</span> Download now</a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


