"use client";

import { FormEvent, useState } from "react";

type FormatOption = "mp4" | "mp3";

export default function UrlForm() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<FormatOption>("mp4");
  const [quality, setQuality] = useState("auto");
  const [loading, setLoading] = useState(false);

  function isValidUrl(value: string) {
    try {
      const parsed = new URL(value);
      return Boolean(parsed.protocol && parsed.host);
    } catch {
      return false;
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidUrl(url)) {
      alert("Please paste a valid video URL");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format, quality }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const message = contentType.includes("application/json")
          ? (await res.json()).error || "Download failed"
          : await res.text();
        throw new Error(message);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const suggested = format === "mp3" ? "video.mp3" : "video.mp4";
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full" id="download">
      <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="url"
            inputMode="url"
            placeholder="Paste YouTube URL (e.g. https://youtu.be/...) 🔗"
            className="h-12 w-full rounded-md border border-black/15 bg-background px-4 text-base outline-none placeholder:text-foreground/50 focus:border-black/30"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Video URL"
            required
          />
          <select
            aria-label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value as FormatOption)}
            className="h-12 rounded-md border border-black/15 bg-background px-3 text-sm"
          >
            <option value="mp4">MP4 🎞️</option>
            <option value="mp3">MP3 🎵</option>
          </select>
          <select
            aria-label="Quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="h-12 rounded-md border border-black/15 bg-background px-3 text-sm"
          >
            <option value="auto">Auto 🤖</option>
            <option value="1080p">1080p 💎</option>
            <option value="720p">720p 🌟</option>
            <option value="480p">480p 📺</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-5 text-base font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? "Preparing… ⏳" : "Download ⬇️"}
        </button>
      </div>
      <p className="mt-2 text-xs text-foreground/60">By using this service you agree to our Terms. This UI is responsive for mobile and desktop. <span aria-hidden>📱💻</span></p>
    </form>
  );
}


