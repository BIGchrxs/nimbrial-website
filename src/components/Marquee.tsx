"use client";

import { useEffect, useRef } from "react";

/**
 * Infinite text strip whose speed (and direction) reacts to scroll velocity.
 * Pattern inspired by React Bits' "Scroll Velocity".
 */
export default function Marquee({
  items,
  baseSpeed = 40,
  reverse = false,
  className = "",
}: {
  items: string[];
  baseSpeed?: number;
  reverse?: boolean;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0;
    let lastY = window.scrollY;
    let velocity = 0;
    let dir = reverse ? 1 : -1;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      const v = (y - lastY) / Math.max(dt, 0.001);
      lastY = y;
      velocity += (v - velocity) * 0.12;
      if (Math.abs(velocity) > 30) dir = (velocity > 0 ? -1 : 1) * (reverse ? -1 : 1);
      const speed = baseSpeed + Math.min(Math.abs(velocity) * 0.25, 900);
      const half = el.scrollWidth / 2;
      x += dir * speed * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      el.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [baseSpeed, reverse]);

  const row = (
    <>
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-[0.45em] pr-[0.45em]">
          {/* Every second item in steel blue. (An outline style traced the font's overlapping shapes.) */}
          <span className={i % 2 ? "text-steel" : ""}>{t}</span>
          <svg viewBox="0 0 10 10" className="h-[0.22em] w-[0.22em] fill-steel" aria-hidden>
            <circle cx="5" cy="5" r="5" />
          </svg>
        </span>
      ))}
    </>
  );

  return (
    // Vertical padding (in em, so it scales with the text) keeps descenders like "g" and "p" from being
    // clipped: headings use a line height below 1, so those letters extend past the line box.
    <div className={`overflow-hidden py-[0.18em] whitespace-nowrap ${className}`} aria-label={items.join(", ")}>
      <div ref={track} className="flex w-max will-change-transform" aria-hidden>
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  );
}
