import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import BookmarkPrompt from "@/components/BookmarkPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube Video Downloader",
  description: "Fast, safe downloader for YouTube videos and audio.",
  keywords: [
    "YouTube downloader",
    "MP4",
    "MP3",
    "video download",
    "audio download",
  ],
  metadataBase: new URL("https://freevideosdownloader.com"),
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        {children}
        <BookmarkPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
