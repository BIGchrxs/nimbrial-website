"use client";

import { useEffect, useRef, useState } from "react";
import { createAnimatable } from "animejs";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

type Item = { title: string; who: string; body: string; preview: React.ReactNode };

/** Editorial list: hovering a row floats a preview card that trails the cursor. */
export default function HoverRevealList({ items }: { items: Item[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    const fl = floatRef.current;
    if (!list || !fl || window.matchMedia("(hover: none)").matches) return;
    const a = createAnimatable(fl, { x: 650, y: 650, ease: "out(3)" });
    const move = (e: PointerEvent) => {
      const r = list.getBoundingClientRect();
      a.x(e.clientX - r.left);
      a.y(e.clientY - r.top);
    };
    list.addEventListener("pointermove", move);
    return () => {
      list.removeEventListener("pointermove", move);
      a.revert();
    };
  }, []);

  return (
    <ul ref={listRef} className="relative" onPointerLeave={() => setActive(null)}>
      {items.map((it, i) => (
        <li
          key={it.title}
          onPointerEnter={() => setActive(i)}
          className="group/row relative grid cursor-default grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 border-t border-line py-8 transition-colors last:border-b md:grid-cols-[80px_1.1fr_1.4fr_auto] md:py-10"
        >
          <span className="display text-3xl text-steel md:text-4xl">0{i + 1}</span>
          <div>
            <h3 className="display text-[clamp(26px,2.8vw,40px)] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/row:translate-x-3">
              {it.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{it.who}</p>
          </div>
          <p className="col-span-2 max-w-[460px] leading-relaxed text-muted md:col-span-1">{it.body}</p>
          <span className="hidden h-12 w-12 place-items-center rounded-full ring-1 ring-line transition-all duration-500 group-hover/row:bg-navy group-hover/row:text-ivory group-hover/row:ring-navy md:grid">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </li>
      ))}

      <div
        ref={floatRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10 hidden md:block"
      >
        <div
          className={`w-[380px] -translate-x-1/2 -translate-y-[110%] transition-[opacity,scale] duration-500 ease-[var(--ease-out-expo)] ${
            active === null ? "scale-75 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {active !== null && items[active].preview}
        </div>
      </div>
    </ul>
  );
}
