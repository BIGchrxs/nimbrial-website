"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";
import { Wordmark } from "./Logo";

/** Giant wordmark that rises out of the bottom edge as you reach the end of the page. */
export default function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = animate(el, {
      y: ["70%", "0%"],
      scale: [0.92, 1],
      ease: "out(3)",
      autoplay: onScroll({
        target: el.parentElement!,
        enter: { target: "top", container: "bottom" },
        leave: { target: "bottom", container: "bottom" },
        sync: 0.2,
      }),
    });
    return () => {
      a.revert();
    };
  }, []);

  return (
    <div className="pointer-events-none mt-16 overflow-hidden px-page-x pb-6 select-none" aria-hidden>
      <div ref={ref} className="origin-bottom text-ivory/[0.08]">
        <Wordmark className="h-auto w-full" />
      </div>
    </div>
  );
}
