"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createAnimatable } from "animejs";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

type Variant = "primary" | "secondary" | "onDark" | "ghostDark";

const styles: Record<Variant, string> = {
  primary: "bg-navy text-ivory hover:bg-navy-deep",
  secondary: "bg-surface text-charcoal ring-1 ring-line hover:ring-steel",
  onDark: "bg-ivory text-navy hover:bg-white",
  ghostDark: "text-ivory ring-1 ring-on-dark-line hover:ring-steel-bright",
};

/** Pill button that leans toward the cursor (magnetic hover), with a sliding arrow. */
export default function MagneticButton({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  onClick?: () => void;
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    const anim = createAnimatable(el, { x: 600, y: 600, ease: "out(4)" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      anim.x((e.clientX - (r.left + r.width / 2)) * 0.28);
      anim.y((e.clientY - (r.top + r.height / 2)) * 0.38);
    };
    const leave = () => {
      anim.x(0);
      anim.y(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      anim.revert();
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      onClick={onClick}
      className={`group inline-flex items-center gap-3 rounded-full py-3.5 pr-3.5 pl-6 text-[15px] font-semibold transition-colors duration-300 ${styles[variant]} ${className}`}
    >
      {children}
      <span className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-current/10">
        <ArrowUpRight
          weight="bold"
          className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-5 group-hover:-translate-y-5"
        />
        <ArrowUpRight
          weight="bold"
          className="absolute h-3.5 w-3.5 -translate-x-5 translate-y-5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0 group-hover:translate-y-0"
        />
      </span>
    </Link>
  );
}
