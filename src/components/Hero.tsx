"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import MagneticButton from "./MagneticButton";
import { SplitHeading } from "./Reveal";
import { Emblem } from "./Logo";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

// Renderers that draw WebGL on the CPU (no graphics card). The 3D hero runs at a few
// frames per second on these, so those visitors get the static emblem instead.
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i;

/** True when the browser can render the 3D hero smoothly on real graphics hardware. */
function hasHardwareWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // free the probe context straight away
    return !SOFTWARE_RENDERER.test(renderer);
  } catch {
    return false;
  }
}

export default function Hero() {
  const meta = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check needs the DOM
    setWebgl(!reduce && hasHardwareWebGL());

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

      {/* 3D emblem + network. The canvas spans the whole hero so particles never hit a hard edge;
          the emblem itself is placed on the right inside the 3D scene. */}
      {webgl === true && (
        <div className="pointer-events-none absolute inset-0 opacity-30 md:opacity-100">
          <HeroCanvas />
        </div>
      )}
      {webgl === false && (
        <div className="pointer-events-none absolute inset-y-0 right-[-30%] grid w-[130%] place-items-center opacity-25 md:right-[-5%] md:w-[56%] md:opacity-100">
          <Emblem className="h-[42vmin] w-[42vmin] text-ivory/90" />
        </div>
      )}

      {/* Soft fade behind the headline, so particles that drift left fade out instead of crossing the text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(6,18,36,0.9) 0%, rgba(6,18,36,0.72) 30%, rgba(6,18,36,0.25) 46%, rgba(6,18,36,0) 58%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-page-x pt-36 pb-12 md:justify-center md:pb-0">
        <div ref={meta} className="@container w-full max-w-[640px] md:max-w-[min(640px,52vw,75svh)]">
          <p data-hero-in data-reveal="" className="eyebrow mb-7 flex items-center gap-3 text-on-dark-muted">
            <span aria-hidden className="h-px w-10 shrink-0 bg-steel" />
            Cape Town · System development studio
          </p>

          <SplitHeading
            as="h1"
            onLoad
            delay={250}
            className="display -ml-[0.023em] text-[20.3cqw] text-ivory"
          >
            engineering{" "}
            <span className="text-steel-bright">evolution.</span>
          </SplitHeading>

          <p data-hero-in data-reveal="" className="mt-[max(24px,6cqw)] text-[clamp(17px,3.85cqw,26px)] leading-relaxed text-on-dark-muted">
            Redeveloping your enterprise into one reliable workflow.{" "}
            <br className="hidden lg:inline" />
            Securely built and tailored to you.
          </p>

          <div data-hero-in data-reveal="" className="mt-[max(32px,7cqw)] flex flex-wrap gap-3">
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
