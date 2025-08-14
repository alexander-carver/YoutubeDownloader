"use client";

import { useEffect, useMemo, useState } from "react";

type PlatformInfo = {
  isMobile: boolean;
  isMac: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browser: "safari" | "chrome" | "firefox" | "edge" | "other";
};

function detectPlatform(userAgent: string): PlatformInfo {
  const ua = userAgent.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isMobile = isIOS || isAndroid || /mobile/.test(ua);
  const isMac = /macintosh|mac os x/.test(ua) && !isIOS;

  let browser: PlatformInfo["browser"] = "other";
  if (/safari/.test(ua) && !/chrome|crios|android/.test(ua)) browser = "safari";
  else if (/edg\//.test(ua)) browser = "edge";
  else if (/firefox\//.test(ua)) browser = "firefox";
  else if (/chrome\//.test(ua) || /crios\//.test(ua)) browser = "chrome";

  return { isMobile, isMac, isIOS, isAndroid, browser };
}

function getBookmarkInstruction(p: PlatformInfo): string {
  if (p.isMobile) {
    if (p.isIOS) {
      return "Tap the Share icon, then Add Bookmark";
    }
    if (p.isAndroid) {
      if (p.browser === "chrome") return "Tap ⋮ and then the ☆ bookmark icon";
      return "Open menu and choose Add to bookmarks";
    }
    return "Open browser menu and choose Add to bookmarks";
  }

  // Desktop
  if (p.isMac) return "Press ⌘ + D";
  return "Press Ctrl + D";
}

const LOCAL_STORAGE_KEY = "bookmarkPromptDismissed";

export default function BookmarkPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissed = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (dismissed === "true") return; // never show again if dismissed

    const info = detectPlatform(window.navigator.userAgent);
    setPlatform(info);

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, []);

  const instruction = useMemo(
    () => (platform ? getBookmarkInstruction(platform) : ""),
    [platform]
  );

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, "true");
    } catch {
      // ignore write errors
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:p-4"
      role="region"
      aria-label="Bookmark suggestion"
    >
      <div className="w-full max-w-md rounded-xl border border-black/10 bg-white/95 text-black shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-white/10 dark:bg-neutral-900/95 dark:text-white dark:supports-[backdrop-filter]:bg-neutral-900/80">
        <div className="flex items-start gap-3 p-3 sm:p-4">
          <div className="text-xl">🔖</div>
          <div className="flex-1">
            <p className="text-sm sm:text-base font-medium">
              Bookmark this page so you never lose it 🔥
            </p>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
              {instruction}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="flex justify-end gap-2 p-3 pt-0 sm:p-4 sm:pt-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}


