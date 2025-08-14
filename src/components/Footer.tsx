export default function Footer() {
  return (
    <footer className="border-t border-black/10">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-foreground/60">© {new Date().getFullYear()} FreeVideosDownloader. The world&apos;s most trusted YouTube video downloader. Fast, free, and secure! <span aria-hidden>🔒⚡️🎉</span></p>
          <nav className="flex items-center gap-6 text-sm text-foreground/70">
            <a href="#" className="hover:text-foreground"><span aria-hidden>✉️</span> Contact</a>
            <a href="#" className="hover:text-foreground"><span aria-hidden>🛡️</span> Privacy Policy</a>
            <a href="#" className="hover:text-foreground"><span aria-hidden>📜</span> Terms of Service</a>
          </nav>
        </div>
        <div className="mt-6 rounded-md bg-foreground/5 p-3 text-center text-xs text-foreground/80">
          ⚠️ Only download videos you own or have permission to download. <span aria-hidden>🙏</span>
        </div>
      </div>
    </footer>
  );
}


