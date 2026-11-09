"use client";

import { useEffect, useRef } from "react";
import { animate, stagger, splitText } from "animejs";

const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Calls `cb` once the element scrolls into view - or straight away if it is already
 * above the viewport (e.g. after jumping to an anchor), so content is never left hidden.
 */
function whenVisible(el: Element, cb: () => void) {
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) {
        io.disconnect();
        cb();
      }
    },
    { rootMargin: "0px 0px -60px 0px" },
  );
  io.observe(el);
  return () => io.disconnect();
}

/**
 * Fades + lifts its children into view when scrolled to.
 * `stagger` animates direct children one after another instead of the wrapper.
 */
export function Reveal({
  children,
  className = "",
  stagger: staggered = false,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  delay?: number;
  as?: "div" | "section" | "ul" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce()) return;
    const targets = staggered ? Array.from(el.children) : el;
    if (staggered) {
      (Array.from(el.children) as HTMLElement[]).forEach((c) => (c.style.opacity = "0"));
      el.style.opacity = "1";
    }
    const anim = animate(targets, {
      opacity: [0, 1],
      y: ["2.5rem", "0rem"],
      duration: 1100,
      delay: staggered ? stagger(90, { start: delay }) : delay,
      ease: "out(4)",
      autoplay: false,
    });
    const stop = whenVisible(el, () => anim.play());
    return () => {
      stop();
      anim.revert();
    };
  }, [staggered, delay]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} data-reveal="" className={className}>
      {children}
    </Tag>
  );
}

/**
 * Headline whose words rise out of a clipped line, one after another.
 * `onLoad` plays immediately (hero); otherwise it plays when scrolled into view.
 */
export function SplitHeading({
  children,
  className = "",
  as: Tag = "h2",
  onLoad = false,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  onLoad?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce()) return;
    const split = splitText(el, { words: { wrap: "clip" } });
    el.style.opacity = "1";
    const anim = animate(split.words, {
      y: ["110%", "0%"],
      rotate: [4, 0],
      duration: 1300,
      delay: stagger(55, { start: delay }),
      ease: "out(5)",
      autoplay: false,
    });
    const stop = onLoad ? (anim.play(), () => {}) : whenVisible(el, () => anim.play());
    return () => {
      stop();
      anim.revert();
      split.revert();
    };
  }, [onLoad, delay]);

  return (
    <Tag ref={ref} data-reveal="" className={className}>
      {children}
    </Tag>
  );
}
