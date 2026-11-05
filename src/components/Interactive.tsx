"use client";

import { useEffect, useRef } from "react";
import { animate, createAnimatable, onScroll, stagger, utils } from "animejs";

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Card with a soft light that follows the cursor (pattern from React Bits "Spotlight Card"). */
export function SpotlightCard({
  children,
  className = "",
  dark = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={`group/spot relative overflow-hidden rounded-card ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(420px circle at var(--mx) var(--my), ${
            dark ? "rgba(143,176,216,0.18)" : "rgba(91,124,166,0.14)"
          }, transparent 60%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Tilts in 3D toward the cursor. */
export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce() || window.matchMedia("(hover: none)").matches) return;
    const a = createAnimatable(el, { rotateX: 700, rotateY: 700, ease: "out(3)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      a.rotateY(((e.clientX - r.left) / r.width - 0.5) * 10);
      a.rotateX(-((e.clientY - r.top) / r.height - 0.5) * 10);
    };
    const leave = () => {
      a.rotateX(0);
      a.rotateY(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      a.revert();
    };
  }, []);
  return (
    <div className="[perspective:1200px]">
      <div ref={ref} className={`will-change-transform [transform-style:preserve-3d] ${className}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * "How we work": a line that draws across the steps as you scroll,
 * lighting up each step as the line reaches it.
 */
export function ProcessLine({ steps }: { steps: { title: string; body: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-step]"));
    if (reduce()) {
      el.style.setProperty("--p", "1");
      items.forEach((n) => n.setAttribute("data-on", ""));
      return;
    }
    const obs = onScroll({
      target: el,
      enter: { target: "top", container: "bottom-=20%" },
      leave: { target: "bottom", container: "center" },
      sync: true,
      onUpdate: (self) => {
        const p = self.progress;
        el.style.setProperty("--p", String(p));
        items.forEach((n, i) => n.toggleAttribute("data-on", p >= i / items.length + 0.02));
      },
    });
    return () => {
      obs.revert();
    };
  }, []);

  return (
    <ol ref={ref} className="relative grid gap-12 md:grid-cols-3 md:gap-10" style={{ "--p": 0 } as React.CSSProperties}>
      <span aria-hidden className="absolute top-[27px] left-[27px] h-[calc(100%-54px)] w-px bg-line md:top-[27px] md:right-0 md:left-[27px] md:h-px md:w-auto" />
      <span
        aria-hidden
        className="absolute top-[27px] left-[27px] h-[calc((100%-54px)*var(--p))] w-px bg-steel md:right-auto md:h-px md:w-[calc((100%-27px)*var(--p))]"
      />
      {steps.map((s, i) => (
        <li key={s.title} data-step className="group/step relative pl-20 md:pl-0">
          <span className="absolute left-0 grid h-[54px] w-[54px] place-items-center rounded-full bg-ivory text-sm font-semibold text-muted ring-1 ring-line transition-all duration-500 group-data-[on]/step:bg-navy group-data-[on]/step:text-ivory group-data-[on]/step:ring-navy md:static">
            0{i + 1}
          </span>
          <h3 className="display mt-0 text-[28px] md:mt-8">{s.title}</h3>
          <p className="mt-3 max-w-[340px] leading-relaxed text-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Grid of icons that ripple outward from the one you hover (anime.js grid stagger). */
export function IconRipple({ icons, cols }: { icons: React.ReactNode[]; cols: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce()) return;
    const cells = Array.from(el.children) as HTMLElement[];
    const rows = Math.ceil(cells.length / cols);
    animate(cells, {
      opacity: [0, 1],
      scale: [0.6, 1],
      delay: stagger(45, { grid: [cols, rows], from: "center", start: 300 }),
      duration: 900,
      ease: "out(4)",
    });
    const handlers = cells.map((cell, index) => {
      const h = () =>
        animate(cells, {
          scale: [{ to: 0.82, duration: 160 }, { to: 1, duration: 700, ease: "outElastic(1, .6)" }],
          translateY: [{ to: -10, duration: 160 }, { to: 0, duration: 700, ease: "outElastic(1, .6)" }],
          delay: stagger(45, { grid: [cols, rows], from: index }),
        });
      cell.addEventListener("pointerenter", h);
      return h;
    });
    return () => {
      cells.forEach((c, i) => c.removeEventListener("pointerenter", handlers[i]));
      utils.remove(cells);
    };
  }, [cols]);
  return (
    <div ref={ref} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {icons.map((icon, i) => (
        <div
          key={i}
          className="grid aspect-square place-items-center rounded-2xl bg-surface text-navy ring-1 ring-line transition-colors hover:bg-navy hover:text-ivory"
        >
          {icon}
        </div>
      ))}
    </div>
  );
}

/** Words light up one by one as you scroll through the paragraph (React Bits "Scroll Reveal" style). */
export function ScrollFillText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce()) return;
    const words = el.querySelectorAll("[data-w]");
    const a = animate(words, {
      opacity: [0.14, 1],
      delay: stagger(40),
      duration: 300,
      ease: "linear",
      autoplay: onScroll({
        target: el,
        enter: { target: "top", container: "bottom-=15%" },
        leave: { target: "bottom", container: "center" },
        sync: true,
      }),
    });
    return () => {
      a.revert();
    };
  }, []);
  return (
    <p ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} data-w aria-hidden className="inline-block pr-[0.25em]">
          {w}
        </span>
      ))}
    </p>
  );
}

/** Pins a row of cards and slides it sideways as you scroll down. */
export function HorizontalScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const r = root.current;
    const t = track.current;
    if (!r || !t) return;
    if (reduce() || window.innerWidth < 768) {
      r.dataset.static = "true";
      return;
    }
    const setHeight = () => {
      const distance = t.scrollWidth - window.innerWidth;
      r.style.height = `${window.innerHeight + Math.max(0, distance)}px`;
      return distance;
    };
    setHeight();
    const a = animate(t, {
      x: () => [0, -Math.max(0, t.scrollWidth - window.innerWidth)],
      ease: "linear",
      autoplay: onScroll({
        target: r,
        enter: { target: "top", container: "top" },
        leave: { target: "bottom", container: "bottom" },
        sync: 0.15,
      }),
    });
    const onResize = () => {
      setHeight();
      a.refresh();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      a.revert();
      r.style.height = "";
    };
  }, []);
  return (
    <div ref={root} className={`group/h relative ${className}`}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden group-data-[static=true]/h:static group-data-[static=true]/h:h-auto group-data-[static=true]/h:overflow-x-auto">
        <div ref={track} className="flex w-max gap-6 px-page-x will-change-transform">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Counts up from 0 when it enters view. */
export function CountUp({ to, suffix = "", className = "" }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce()) return;
    const o = { v: 0 };
    const a = animate(o, {
      v: to,
      duration: 1600,
      ease: "out(4)",
      modifier: utils.round(0),
      onUpdate: () => (el.textContent = `${o.v}${suffix}`),
      autoplay: onScroll({ target: el, enter: { target: "top", container: "bottom-=60" }, repeat: false }),
    });
    return () => {
      a.revert();
    };
  }, [to, suffix]);
  return (
    <span ref={ref} className={className}>
      {to}
      {suffix}
    </span>
  );
}
