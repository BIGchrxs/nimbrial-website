"use client";

import { useEffect, useRef } from "react";
import { animate, createScope, onScroll } from "animejs";
import { Kanban, Browsers, Sparkle, CloudArrowUp } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { CrmVisual, WebVisual, AiVisual, CloudVisual } from "./Visuals";

const services = [
  {
    icon: Kanban,
    title: "CRM + quotation workflow",
    body: "One pipeline for every lead, quote approvals, PDF quotations and automatic follow-up reminders.",
    tags: ["Pipelines", "Quote approvals", "Follow-ups"],
    visual: CrmVisual,
    tone: "bg-surface text-charcoal ring-1 ring-line",
  },
  {
    icon: Browsers,
    title: "Premium website + lead capture",
    body: "Original design and purposeful motion, wired straight into your CRM so no enquiry gets lost.",
    tags: ["UX + UI", "Motion", "CRM-connected forms"],
    visual: WebVisual,
    tone: "bg-steel-tint text-charcoal",
  },
  {
    icon: Sparkle,
    title: "AI-assisted admin",
    body: "Low-risk document extraction and enquiry routing, with a human review queue and full traceability.",
    tags: ["Document intake", "Routing", "Human checkpoints"],
    visual: AiVisual,
    tone: "bg-ivory text-charcoal ring-1 ring-line",
  },
  {
    icon: CloudArrowUp,
    title: "Managed cloud + web operations",
    body: "Deployments, DNS, backups, patching and security hygiene — owned, documented and reported monthly.",
    tags: ["Deploys", "Backups", "Security hygiene"],
    visual: CloudVisual,
    tone: "bg-navy text-ivory",
  },
];

/** Cards pin and stack as you scroll; each one recedes as the next slides over it. */
export default function ServiceStack() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scope = createScope({ root }).add(() => {
      const wraps = Array.from(root.current!.querySelectorAll<HTMLElement>("[data-card-wrap]"));
      wraps.forEach((wrap, i) => {
        const next = wraps[i + 1];
        if (!next) return;
        const card = wrap.querySelector("[data-card]")!;
        animate(card, {
          scale: [1, 0.9 + i * 0.02],
          filter: ["brightness(1)", "brightness(0.82)"],
          ease: "linear",
          autoplay: onScroll({
            target: next,
            enter: { target: "top", container: "bottom" },
            leave: { target: "top", container: "top+=140" },
            sync: true,
          }),
        });
      });
    });
    return () => scope.revert();
  }, []);

  return (
    <div ref={root} className="relative">
      {services.map((s, i) => {
        const Icon = s.icon;
        const Visual = s.visual;
        const dark = s.tone.includes("bg-navy");
        return (
          <div
            key={s.title}
            data-card-wrap
            className="sticky pb-6"
            style={{ top: `calc(96px + ${i * 22}px)` }}
          >
            <article
              data-card
              className={`relative grid origin-top gap-10 overflow-hidden rounded-card p-card-pad will-change-transform md:min-h-[min(620px,72svh)] md:grid-cols-2 md:items-center ${s.tone}`}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center">
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-2xl ${
                      dark ? "bg-on-dark-line text-steel-bright" : "bg-navy text-ivory"
                    }`}
                  >
                    <Icon weight="duotone" className="h-7 w-7" />
                  </span>
                  <span className={`display absolute top-card-pad right-card-pad text-[56px] leading-none ${dark ? "text-on-dark-line" : "text-line"}`}>
                    0{i + 1}
                  </span>
                </div>
                <h3 className="display mt-auto pt-12 text-[clamp(32px,3.6vw,52px)]">{s.title}</h3>
                <p className={`mt-4 max-w-[460px] text-lg leading-relaxed ${dark ? "text-on-dark-muted" : "text-muted"}`}>
                  {s.body}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <li
                      key={t}
                      className={`rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ${
                        dark ? "ring-on-dark-line text-on-dark-muted" : "ring-current/15"
                      }`}
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/services/"
                  className={`mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold ${
                    dark ? "text-steel-bright" : "text-steel"
                  } underline-offset-4 hover:underline`}
                >
                  Learn more →
                </Link>
              </div>
              <div className="relative">
                <Visual />
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
