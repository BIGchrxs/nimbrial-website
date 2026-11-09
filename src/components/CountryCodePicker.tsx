"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CaretDown, Check, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import type { CountryCode } from "libphonenumber-js/min";
import { COUNTRIES, type Country } from "@/lib/countries";

function Flag({ code }: { code: string }) {
  // Flags are static files from public/flags (see scripts/generate-countries.mjs); decorative, so no alt text.
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export: tiny SVGs, no image optimisation needed
    <img
      src={`/flags/${code}.svg`}
      alt=""
      width={21}
      height={14}
      loading="lazy"
      className="h-[14px] w-[21px] shrink-0 rounded-[2px] object-cover ring-1 ring-charcoal/10"
    />
  );
}

// Scrolls only the list (scrollIntoView would also scroll the page behind it).
function scrollIntoList(list: HTMLElement | null, item: HTMLElement | null | undefined, mode: "nearest" | "center") {
  if (!list || !item) return;
  const top = item.offsetTop;
  const bottom = top + item.offsetHeight;
  if (mode === "center") list.scrollTop = top - (list.clientHeight - item.offsetHeight) / 2;
  else if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
}

function matches(c: Country, query: string) {
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  if (!q) return true;
  return c.name.toLowerCase().includes(q) || c.dial.startsWith(q) || c.code.toLowerCase() === q;
}

// Searching by code ("+44", "1"): exact code matches first, the code's main country (UK, US) at the top.
function rank(results: Country[], query: string) {
  const q = query.trim().replace(/^\+/, "");
  if (!/^\d+$/.test(q)) return results;
  const score = (c: Country) => (c.dial === q ? (c.main ? 0 : 1) : 2);
  return [...results].sort((a, b) => score(a) - score(b)); // stable: alphabetical within each group
}

/**
 * Phone country code picker: a themed, searchable list of every country with its flag and calling code.
 * Follows the WAI-ARIA combobox pattern: the search box controls the list, arrow keys move through it,
 * Enter picks, Escape closes. The chosen code is also submitted as `phone_country` for no-JS posts.
 */
export default function CountryCodePicker({
  value,
  onChange,
  invalid,
}: {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  invalid?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const selected = COUNTRIES.find((c) => c.code === value) ?? COUNTRIES[0];
  const results = useMemo(() => rank(COUNTRIES.filter((c) => matches(c, query)), query), [query]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, COUNTRIES.findIndex((c) => c.code === value)));
    setOpen(true);
  };
  const close = (focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  };
  const choose = (c: Country | undefined) => {
    if (!c) return;
    onChange(c.code);
    close(true);
  };

  // While open: keep the highlighted option in view.
  useEffect(() => {
    if (!open) return;
    scrollIntoList(list.current, list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`), "nearest");
  }, [open, active, results]);
  // On open (declared after the effect above so it wins): focus the search box, centre the current country.
  useEffect(() => {
    if (!open) return;
    search.current?.focus({ preventScroll: true });
    scrollIntoList(list.current, list.current?.querySelector<HTMLElement>('[aria-selected="true"]'), "center");
  }, [open]);

  // Close when clicking or tabbing anywhere outside the picker.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const last = results.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(last, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home" && e.ctrlKey) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && e.ctrlKey) {
      e.preventDefault();
      setActive(last);
    } else if (e.key === "Enter") {
      e.preventDefault(); // never submit the form from here
      choose(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative shrink-0">
      <input type="hidden" name="phone_country" value={value} />
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Phone country code: ${selected.name} +${selected.dial}`}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openList();
          }
        }}
        className={`flex h-full items-center gap-2 rounded-sm bg-ivory px-3 text-[16px] text-charcoal outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-steel ${
          invalid ? "ring-2 ring-error" : open ? "ring-2 ring-steel" : "ring-1 ring-line"
        }`}
      >
        <Flag code={selected.code} />
        <span className="tabular-nums">+{selected.dial}</span>
        <CaretDown
          aria-hidden
          weight="bold"
          className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-30 w-[min(320px,calc(100vw-48px))] overflow-hidden rounded-sm bg-surface shadow-[0_18px_40px_-12px_rgba(6,18,36,0.35)] ring-1 ring-line">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <MagnifyingGlass aria-hidden className="h-4 w-4 shrink-0 text-muted" />
            <input
              ref={search}
              type="text"
              role="combobox"
              aria-label="Search countries"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={results[active] ? `${id}-${results[active].code}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
              placeholder="Search country or code"
              autoComplete="off"
              className="w-full bg-transparent py-3 text-[16px] text-charcoal outline-none placeholder:text-muted/70"
            />
          </div>
          {/* data-lenis-prevent: let the wheel scroll this list, not the smooth-scrolled page behind it. */}
          <ul
            ref={list}
            id={listId}
            role="listbox"
            aria-label="Countries"
            data-lenis-prevent
            className="relative max-h-72 overflow-y-auto overscroll-contain py-1.5"
          >
            {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">No countries match “{query}”.</li>}
            {results.map((c, i) => {
              const isSelected = c.code === value;
              const isActive = i === active;
              return (
                <li
                  key={c.code}
                  id={`${id}-${c.code}`}
                  data-index={i}
                  data-code={c.code}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(i)}
                  onClick={() => choose(c)}
                  className={`mx-1.5 flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] ${
                    isSelected
                      ? "bg-navy text-ivory"
                      : isActive
                        ? "bg-steel-tint text-navy"
                        : "text-charcoal"
                  } ${isSelected && isActive ? "ring-2 ring-steel-bright ring-inset" : ""}`}
                >
                  <Flag code={c.code} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className={`tabular-nums ${isSelected ? "text-steel-bright" : "text-muted"}`}>+{c.dial}</span>
                  {isSelected && <Check aria-hidden weight="bold" className="h-4 w-4 shrink-0 text-steel-bright" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
