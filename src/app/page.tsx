import Header from "@/components/Header";
import UrlForm from "@/components/UrlForm";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AdPlaceholder from "@/components/AdPlaceholder";
import CountdownTimer from "@/components/CountdownTimer";
import AffiliateCard from "@/components/AffiliateCard";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Structured Data */}
      <JsonLd
        id="ld-website"
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Free Videos Downloader",
          url: "https://freevideosdownloader.com/",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://freevideosdownloader.com/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <JsonLd
        id="ld-software"
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Free Videos Downloader",
          operatingSystem: "Web",
          applicationCategory: "UtilitiesApplication",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
          url: "https://freevideosdownloader.com/",
          description:
            "Free YouTube video and audio downloader. Fast, safe, and easy to use.",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: 4.9,
            reviewCount: 1000,
          },
        }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero with right rail ad */}
        <section className="border-b border-black/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
              <div>
                <div className="py-12 sm:py-16">
                  <span className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-foreground/80"><span aria-hidden>🚀</span> Fast & Reliable Downloads</span>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                    Free YouTube Video Downloader –
                    <br className="hidden sm:block" /> Free Videos in Seconds! <span aria-hidden>⏱️</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-foreground/70">
                    The fastest and easiest way to download your favorite YouTube videos in high quality. No registration required, completely free! <span aria-hidden>💯</span>
                  </p>
                  <div className="mt-6 max-w-2xl">
                    <UrlForm />
                  </div>
                  <p className="mt-3 text-xs text-foreground/60"><span aria-hidden>💡</span> Tip: Works with any YouTube URL – videos, shorts, or playlists!</p>
                  {/* Mobile banner ad under the tip removed per request */}

                  <div className="mt-8 grid grid-cols-3 gap-6 max-w-xl">
                    {[{v:"10M+", l:"Downloads"},{v:"4.9/5", l:"User Rating"},{v:"100%", l:"Free Forever"}].map((m)=> (
                      <div key={m.l} className="text-center">
                        <div className="text-2xl font-semibold">{m.v}</div>
                        <div className="mt-1 text-sm text-foreground/60">{m.l} <span aria-hidden>{m.l === "Downloads" ? "📥" : m.l === "User Rating" ? "⭐️" : "🆓"}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Countdown timer above discounts */}
                <CountdownTimer />

                {/* Discounts section moved directly under the timer */}
                <div className="mb-10">
                  <h2 className="text-2xl font-semibold tracking-tight"><span aria-hidden>💸</span> Discounts on Popular Tools</h2>
                  <p className="mt-2 text-foreground/70">Check out these amazing tools and services we recommend for content creators! <span aria-hidden>🎁</span></p>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      "Design Tool Affiliate",
                      "Video Editor Affiliate",
                      "Music Library Affiliate",
                    ].map((t) => (
                      <AffiliateCard key={t} title={t} />
                    ))}
                  </div>
                  {/* Mobile poster ad after discounts grid */}
                  <div className="mt-6 lg:hidden">
                    <AdPlaceholder label="Mobile Poster Ad" size="320 × 100 pixels" />
                  </div>
                </div>
              </div>
              <div className="lg:pt-24">
                <AdPlaceholder size="300 × 600 pixels" sticky desktopOnly />
              </div>
            </div>
          </div>
        </section>

        {/* Features with leaderboard and right ad */}
        <section id="features" className="border-b border-black/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-10">
              <div className="mb-8 hidden lg:block">
                <div className="mx-auto max-w-4xl">
                  <AdPlaceholder label="Leaderboard Advertisement" size="728 × 90 pixels" />
                </div>
              </div>
              {/* Mobile ad at top of features */}
              <div className="mb-8 lg:hidden">
                <div className="mx-auto max-w-sm">
                  <AdPlaceholder label="Mobile Poster Ad" size="320 × 100 pixels" />
                </div>
              </div>
              <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Why Choose FreeVideosDownloader? <span aria-hidden>🤔</span></h2>
                  <p className="mt-2 text-foreground/70">We&apos;ve made downloading YouTube videos simple, fast, and completely free! <span aria-hidden>🙌</span></p>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {["Lightning Fast","High Quality","100% Safe","All Devices","Completely Free","Audio Extract"].map((title) => (
                      <div key={title} className="rounded-xl border border-black/10 bg-background p-6 shadow-sm">
                        <div className="text-base font-semibold">{title} <span aria-hidden>{title === "Lightning Fast" ? "⚡️" : title === "High Quality" ? "🎞️" : title === "100% Safe" ? "🛡️" : title === "All Devices" ? "📱" : title === "Completely Free" ? "🆓" : "🎵"}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:pt-6">
                  <AdPlaceholder size="300 × 600 pixels" sticky desktopOnly />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works with mid-page ad */}
        <section id="how-it-works">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-10">
              <div className="mb-8 hidden lg:block">
                <div className="mx-auto max-w-4xl">
                  <AdPlaceholder label="In-Content Advertisement" size="728 × 250 pixels" />
                </div>
              </div>
              {/* Mobile ad within how-it-works */}
              <div className="mb-8 lg:hidden">
                <div className="mx-auto max-w-sm">
                  <AdPlaceholder label="Mobile Poster Ad" size="320 × 100 pixels" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">How It Works <span aria-hidden>🧭</span></h2>
              <ol className="mt-6 grid gap-6 sm:grid-cols-3">
                {["Copy URL","Paste & Process","Download!"].map((s, i) => (
                  <li key={s} className="rounded-lg border border-black/10 p-6 text-center">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-sm border border-black/10 text-xs font-semibold">{i+1}</span>
                    <p className="mt-3 text-sm font-medium">{s} <span aria-hidden>{i === 0 ? "🔗" : i === 1 ? "📋" : "⬇️"}</span></p>
                  </li>
                ))}
              </ol>
              <div className="mt-10 rounded-xl border border-black/10 bg-background p-6">
                <h3 className="text-center text-xl font-semibold">Ready to Start Downloading? <span aria-hidden>🚀</span></h3>
                <div className="mx-auto mt-4 max-w-2xl">
                  <UrlForm />
                </div>
                <p className="mt-3 text-center text-xs text-foreground/60">Your privacy is protected • Instant downloads • 100% free forever <span aria-hidden>🛡️⚡️🆓</span></p>
                {/* Mobile ad after the CTA card */}
                <div className="mt-6 lg:hidden">
                  <AdPlaceholder label="Mobile Poster Ad" size="320 × 100 pixels" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom leaderboard before features content already appears at top of features */}
      </main>
      <Footer />
    </div>
  );
}
