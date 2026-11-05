"use client";

import { useEffect, useRef } from "react";
import { createTimeline, createScope, onScroll, svg, stagger, utils } from "animejs";
import {
  ChatCircleDots,
  EnvelopeSimple,
  Table,
  FileText,
  CalendarBlank,
  Receipt,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Emblem } from "./Logo";

/* Tool positions in a 1000×1000 stage. `from` = chaos, angle = slot on the hub ring. */
const tools = [
  { icon: ChatCircleDots, label: "WhatsApp", mess: "3 unread enquiries", from: [160, 170, -14], angle: -90 },
  { icon: EnvelopeSimple, label: "Email", mess: "Re: Re: Fwd: quote?", from: [820, 120, 9], angle: -30 },
  { icon: Table, label: "Spreadsheet", mess: "leads_v12_FINAL.xlsx", from: [890, 560, -6], angle: 30 },
  { icon: Receipt, label: "Invoices", mess: "2 overdue, unsent", from: [700, 900, 12], angle: 90 },
  { icon: CalendarBlank, label: "Calendar", mess: "Follow-up… forgot", from: [230, 850, 7], angle: 150 },
  { icon: FileText, label: "Quotes", mess: "Waiting on approval", from: [90, 520, -10], angle: 210 },
] as const;

const RADIUS = 330;
const hub = (angle: number) => {
  const a = (angle * Math.PI) / 180;
  return [500 + Math.cos(a) * RADIUS, 500 + Math.sin(a) * RADIUS];
};

/**
 * Pinned scroll story: scattered tools drift together around one hub,
 * connector lines draw in, and the headline flips from problem to answer.
 */
export default function GapStory() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show the resolved "one workflow" state without motion
      el.querySelectorAll<HTMLElement>("[data-tool]").forEach((n, i) => {
        const [hx, hy] = hub(tools[i].angle);
        n.style.left = `${hx / 10}%`;
        n.style.top = `${hy / 10}%`;
      });
      el.querySelectorAll<HTMLElement>("[data-mess], [data-head-a]").forEach((n) => (n.style.opacity = "0"));
      el.querySelectorAll<HTMLElement>("[data-ok], [data-head-b], [data-hub]").forEach((n) => (n.style.opacity = "1"));
      el.querySelector<HTMLElement>("[data-counter]")!.textContent = "0";
      return;
    }

    const scope = createScope({ root }).add(() => {
      const stage = el.querySelector<HTMLElement>("[data-stage]")!;
      const unit = () => stage.offsetWidth / 1000;
      const counter = el.querySelector<HTMLElement>("[data-counter]")!;

      // Paint the scattered "before" state immediately, before the section is reached
      const placeChaos = () =>
        tools.forEach((t, i) =>
          utils.set(`[data-tool="${i}"]`, {
            x: (t.from[0] - 500) * unit(),
            y: (t.from[1] - 500) * unit(),
            rotate: t.from[2],
          }),
        );
      placeChaos();
      utils.set("[data-hub]", { scale: 0.6, opacity: 0 });
      const links = svg.createDrawable("[data-link]");
      utils.set(links, { draw: "0 0" });

      const observer = onScroll({
        target: el,
        enter: { target: "top", container: "top" },
        leave: { target: "bottom", container: "bottom" },
        sync: 0.12,
        onUpdate: (self) => {
          const p = Math.min(1, Math.max(0, (self.progress - 0.15) / 0.55));
          counter.textContent = String(Math.round(14 * (1 - p)));
        },
      });

      const tl = createTimeline({ autoplay: observer, defaults: { ease: "inOut(3)" } });

      tools.forEach((t, i) => {
        const [hx, hy] = hub(t.angle);
        tl.add(
          `[data-tool="${i}"]`,
          {
            x: [() => (t.from[0] - 500) * unit(), () => (hx - 500) * unit()],
            y: [() => (t.from[1] - 500) * unit(), () => (hy - 500) * unit()],
            rotate: [t.from[2], 0],
            duration: 1000,
          },
          150 + i * 30,
        );
      });

      tl.add("[data-mess]", { opacity: [1, 0], duration: 200 }, 700)
        .add("[data-ok]", { opacity: [0, 1], duration: 200 }, 800)
        .add(links, { draw: ["0 0", "0 1"], duration: 400, delay: stagger(40) }, 850)
        .add("[data-hub]", { scale: [0.6, 1], opacity: [0, 1], duration: 400 }, 800)
        .add("[data-pulse]", { scale: [0.8, 1.6], opacity: [0.6, 0], duration: 400 }, 1150)
        .add("[data-head-a]", { opacity: [1, 0], y: [0, -40], duration: 250 }, 550)
        .add("[data-head-b]", { opacity: [0, 1], y: [40, 0], duration: 250 }, 700)
        .add({ duration: 200 }, 1300);

      const onResize = () => tl.refresh();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    });

    return () => scope.revert();
  }, []);

  return (
    <section ref={root} data-nav="light" className="relative h-[320vh] bg-ivory">
      <div className="sticky top-0 grid h-[100svh] grid-rows-[auto_1fr] items-center gap-6 overflow-hidden px-page-x pt-24 pb-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:grid-rows-1 md:gap-16 md:pt-0 md:pb-0">
        {/* Copy */}
        <div className="relative">
          <p className="eyebrow mb-5 text-steel">01 / The problem</p>
          <div className="relative min-h-[2.1em] text-[clamp(36px,5vw,72px)]">
            <h2 data-head-a className="display">
              Your tools don’t talk to each other.
            </h2>
            <h2 data-head-b aria-hidden className="display absolute inset-x-0 top-0 opacity-0">
              We make them <span className="text-steel">one workflow.</span>
            </h2>
          </div>
          <p className="mt-6 max-w-[440px] text-base leading-relaxed text-muted md:text-lg">
            Leads arrive by website, email and WhatsApp. Quotes live in spreadsheets. Approvals sit in someone’s
            inbox. The gap isn’t the tools — it’s between them.
          </p>
          <div className="mt-8 hidden items-end gap-4 md:flex">
            <span data-counter className="display text-[88px] text-navy tabular-nums">
              14
            </span>
            <span className="pb-4 text-sm leading-snug text-muted">
              manual handoffs
              <br />
              per enquiry (illustrative)
            </span>
          </div>
        </div>

        {/* Stage */}
        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,62svh)] md:max-w-[min(100%,82svh)]">
          <div data-stage className="dot-grid absolute inset-0 rounded-[40px] ring-1 ring-line">
            <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full" aria-hidden>
              {tools.map((t, i) => {
                const [x, y] = hub(t.angle);
                return (
                  <line
                    key={i}
                    data-link
                    x1="500"
                    y1="500"
                    x2={x}
                    y2={y}
                    stroke="var(--color-steel)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {/* Hub */}
            <div
              data-hub
              className="absolute top-1/2 left-1/2 grid h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-navy text-ivory shadow-[0_30px_80px_-20px_rgba(15,39,71,0.6)]"
            >
              <span data-pulse className="absolute inset-0 rounded-full ring-2 ring-steel" aria-hidden />
              <Emblem className="h-[46%] w-[46%]" />
            </div>

            {/* Tools */}
            {tools.map((t, i) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.label}
                  data-tool={i}
                  className="absolute top-1/2 left-1/2 w-[22%] -translate-x-1/2 sm:w-[30%] -translate-y-1/2"
                >
                  <div className="rounded-2xl bg-surface p-3 shadow-[0_18px_40px_-18px_rgba(11,11,11,0.35)] ring-1 ring-line md:p-4">
                    <div className="flex items-center justify-center gap-2.5 sm:justify-start">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-steel-tint text-navy md:h-9 md:w-9">
                        <Icon weight="duotone" className="h-[18px] w-[18px] md:h-5 md:w-5" />
                      </span>
                      <span className="hidden truncate text-[13px] font-semibold sm:block md:text-sm">{t.label}</span>
                    </div>
                    <div className="relative mt-2 h-5 text-[11px] md:text-xs">
                      <span data-mess className="absolute inset-0 flex items-center gap-1 truncate text-muted">
                        <WarningCircle weight="fill" className="mx-auto h-3.5 w-3.5 shrink-0 text-[#b4693a] sm:mx-0" />
                        <span className="hidden truncate sm:inline">{t.mess}</span>
                      </span>
                      <span data-ok className="absolute inset-0 flex items-center gap-1 text-steel opacity-0">
                        <CheckCircle weight="fill" className="mx-auto h-3.5 w-3.5 shrink-0 sm:mx-0" />
                        <span className="hidden sm:inline">Synced</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
