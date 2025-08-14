"use client";

import { useEffect, useRef, useState } from "react";

type TimeLeft = {
  hours: number;
  minutes: number;
  seconds: number;
  centiseconds: number;
};

export default function CountdownTimer() {
  const initialTotalMs = (0 * 3600 + 8 * 60 + 55) * 1000;
  const endTimeRef = useRef<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 8, seconds: 55, centiseconds: 0 });

  useEffect(() => {
    if (endTimeRef.current == null) {
      endTimeRef.current = Date.now() + initialTotalMs;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const endTime = endTimeRef.current as number;
      const remainingMs = Math.max(0, endTime - now);

      const hours = Math.floor(remainingMs / 3_600_000);
      const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
      const seconds = Math.floor((remainingMs % 60_000) / 1_000);
      const centiseconds = Math.floor((remainingMs % 1_000) / 10);

      setTimeLeft({ hours, minutes, seconds, centiseconds });

      if (remainingMs <= 0) {
        clearInterval(intervalId);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [initialTotalMs]);

  const values = [
    String(timeLeft.hours).padStart(2, "0"),
    String(timeLeft.minutes).padStart(2, "0"),
    String(timeLeft.seconds).padStart(2, "0"),
    String(timeLeft.centiseconds).padStart(2, "0"),
  ];

  return (
    <div className="mb-10 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
      <div className="flex items-center gap-2 text-sm opacity-90">
        <span aria-hidden>⏱️</span> Flash Sale Ends Soon!
      </div>
      <div className="mt-2 grid grid-cols-4 gap-4 sm:grid-cols-8">
        {values.map((n, i) => (
          <div key={i} className="rounded-xl bg-white/10 p-4 text-center">
            <div className="text-2xl font-semibold">{n}</div>
            <div className="text-xs opacity-80">{i === 0 ? "HOURS" : i === 1 ? "MINUTES" : i === 2 ? "SECONDS" : "MS"}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs opacity-90">Don&apos;t miss out on exclusive discounts!</div>
    </div>
  );
}


