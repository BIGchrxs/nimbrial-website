"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import MagneticButton from "./MagneticButton";
import { SplitHeading } from "./Reveal";
import { Emblem } from "./Logo";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function Hero() {
  const meta = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ok = false;
    try {
      const c = document.createElement("canvas");
      ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      ok = false;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check needs the DOM
    setWebgl(ok && !reduce);

    if (reduce || !meta.current) return;
    const items = meta.current.querySelectorAll("[data-hero-in]");
    const a = animate(items, {
      opacity: [0, 1],
      y: [24, 0],
      delay: stagger(90, { start: 700 }),
      duration: 1200,
      ease: "out(4)",
    });
    return () => {
      a.revert();
    };
  }, []);

  return (
    <section
      data-nav="dark"
      className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-navy-ink text-ivory"
    >
      {/* Atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 72% 45%, rgba(91,124,166,0.35) 0%, rgba(15,39,71,0.0) 70%), radial-gradient(40% 40% at 15% 100%, rgba(15,39,71,0.9) 0%, rgba(6,18,36,0) 100%)",
        }}
      />

      {/* 3D emblem + network (right side on desktop, behind text on mobile) */}
      <div className="absolute inset-y-0 right-[-30%] w-[130%] opacity-25 md:right-[-5%] md:w-[56%] md:opacity-100">
        {webgl === true && <HeroCanvas />}
        {webgl === false && (
          <div className="grid h-full place-items-center">
            <Emblem className="h-[42vmin] w-[42vmin] text-ivory/90" />
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-end px-page-x pt-36 pb-12 md:justify-center md:pb-0">
        <div ref={meta} className="max-w-[640px]">
          <p data-hero-in data-reveal="" className="eyebrow mb-7 flex items-center gap-3 text-on-dark-muted">
            <span className="h-px w-10 bg-steel" />
            Cape Town · Business systems studio
          </p>

          <SplitHeading
            as="h1"
            onLoad
            delay={250}
            className="display text-[clamp(48px,7.4vw,112px)] text-ivory"
          >
            Business systems.{" "}
            <span className="text-steel-bright">Built to evolve.</span>
          </SplitHeading>

          <p data-hero-in data-reveal="" className="mt-8 max-w-[520px] text-lg leading-relaxed text-on-dark-muted md:text-xl">
            We join your enquiries, quotes, admin and reporting into one reliable workflow — then keep improving
            it after launch.
          </p>

          <div data-hero-in data-reveal="" className="mt-10 flex flex-wrap gap-3">
            <MagneticButton href="#contact" variant="onDark">
              Book a discovery call
            </MagneticButton>
            <MagneticButton href="/services/" variant="ghostDark">
              See our services
            </MagneticButton>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-6 px-page-x pb-8 text-sm text-on-dark-muted">
        <ul className="hidden gap-8 md:flex">
          {["Paid discovery", "Fixed scope", "Clear written quote"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-steel-bright" />
              {t}
            </li>
          ))}
        </ul>
        <span className="flex items-center gap-2">
          Scroll
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </span>
      </div>
    </section>
  );
}
