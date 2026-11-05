"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Logo } from "./Logo";
import MagneticButton from "./MagneticButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/services/", label: "Services" },
  { href: "/about/", label: "About" },
  { href: "#contact", label: "Contact" },
];

/**
 * Fixed nav that:
 *  - switches light/dark depending on the section underneath (sections set data-nav="dark")
 *  - hides when scrolling down, returns when scrolling up
 *  - opens a full-screen menu on mobile
 */
export default function Nav() {
  const pathname = usePathname();
  const [dark, setDark] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show/hide only after a deliberate move in one direction. Smooth scrolling eases to a stop
    // with tiny sub-pixel steps, and reacting to those made the bar flicker on every scroll.
    const THRESHOLD = 24; // px of travel in one direction before the bar changes state
    const ALWAYS_SHOW_ABOVE = 160; // px from the top where the bar stays visible
    let lastY = window.scrollY;
    let travel = 0; // distance moved in the current direction (+ down, - up)
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      setScrolled(y > 24);
      if (delta !== 0) {
        if (Math.sign(delta) !== Math.sign(travel)) travel = 0; // direction changed: restart
        travel += delta;
      }
      if (y <= ALWAYS_SHOW_ABOVE) setHidden(false);
      else if (travel >= THRESHOLD) setHidden(true);
      else if (travel <= -THRESHOLD) setHidden(false);
      // otherwise keep the current state
      const probe = document.elementsFromPoint(24, 40).find((n) => n.closest("[data-nav]"));
      const section = probe?.closest("[data-nav]");
      setDark(section?.getAttribute("data-nav") === "dark");
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);


  useEffect(() => {
    if (!open || !menuRef.current) return;
    const items = menuRef.current.querySelectorAll("[data-menu-item]");
    const a = animate(items, {
      y: ["120%", "0%"],
      opacity: [0, 1],
      delay: stagger(60, { start: 120 }),
      duration: 900,
      ease: "out(5)",
    });
    return () => {
      a.revert();
    };
  }, [open]);

  const onDark = dark && !open;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : href.startsWith("/") && pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color] duration-500 ease-[var(--ease-out-expo)] ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${onDark ? "text-ivory" : "text-charcoal"} ${
          scrolled && !open
            ? onDark
              ? "bg-navy-ink/70 backdrop-blur-xl"
              : "bg-ivory/75 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <nav className="flex items-center justify-between px-page-x py-5">
          <Link href="/" aria-label="Nimbrial home" className="relative z-10">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative rounded-full px-4 py-2 text-[15px] font-medium transition-opacity ${
                    isActive(l.href) ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {l.label}
                  {isActive(l.href) && (
                    <span className="absolute inset-x-4 -bottom-0.5 h-px bg-current" aria-hidden />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <MagneticButton href="#contact" variant={onDark ? "onDark" : "primary"}>
              Book a discovery call
            </MagneticButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative z-10 grid h-11 w-11 place-items-center rounded-full ring-1 ring-current/25 md:hidden"
          >
            <span
              className={`absolute h-[1.5px] w-5 bg-current transition-transform duration-500 ${
                open ? "rotate-45" : "-translate-y-[4px]"
              }`}
            />
            <span
              className={`absolute h-[1.5px] w-5 bg-current transition-transform duration-500 ${
                open ? "-rotate-45" : "translate-y-[4px]"
              }`}
            />
          </button>
        </nav>
      </header>

      {open && (
        <div
          ref={menuRef}
          className="fixed inset-0 z-40 flex flex-col justify-between bg-ivory px-page-x pt-28 pb-10 md:hidden"
        >
          <ul className="space-y-2">
            {links.map((l, i) => (
              <li key={l.href} className="overflow-hidden">
                <Link
                  data-menu-item
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="display flex items-baseline gap-4 text-[52px]"
                >
                  <span className="eyebrow text-steel">0{i + 1}</span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div data-menu-item>
            <MagneticButton href="#contact" onClick={() => setOpen(false)}>
              Book a discovery call
            </MagneticButton>
          </div>
        </div>
      )}
    </>
  );
}
