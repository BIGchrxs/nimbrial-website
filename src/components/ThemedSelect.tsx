"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react/dist/ssr";

/**
 * Themed single-choice dropdown, styled like the phone country picker. Follows the WAI-ARIA
 * select-only combobox pattern: arrows move, Enter/Space pick, Escape closes, typing a letter jumps
 * to the next option starting with it. The value is submitted under `name` through a hidden input.
 */
export default function ThemedSelect({
  id,
  name,
  options,
  defaultValue,
  labelledBy,
}: {
  id: string;
  name: string;
  options: string[];
  defaultValue: string;
  /** id of the visible <label> for this field */
  labelledBy: string;
}) {
  const listId = `${useId()}-list`;
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const openList = (at = options.indexOf(value)) => {
    setActive(Math.max(0, at));
    setOpen(true);
  };
  const choose = (i: number) => {
    if (options[i] === undefined) return;
    setValue(options[i]);
    setOpen(false);
    button.current?.focus();
  };

  // Close when clicking anywhere outside.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Form reset (e.g. after a successful send) puts the default back.
  useEffect(() => {
    const form = button.current?.form;
    if (!form) return;
    const onReset = () => setValue(defaultValue);
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(last, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(last);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // never submit the form from here
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type-ahead: jump to the next option starting with that letter.
      const k = e.key.toLowerCase();
      const order = [...options.keys()].map((n) => (active + 1 + n) % options.length);
      const hit = order.find((i) => options[i].toLowerCase().startsWith(k));
      if (hit !== undefined) setActive(hit);
    }
  };

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        ref={button}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelledBy} ${id}`}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-3 rounded-sm bg-ivory px-4 py-3.5 text-left text-[16px] text-charcoal outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-steel ${
          open ? "ring-2 ring-steel" : "ring-1 ring-line"
        }`}
      >
        <span className="truncate">{value}</span>
        <CaretDown
          aria-hidden
          weight="bold"
          className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-labelledby={labelledBy}
        hidden={!open}
        className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 overflow-hidden rounded-sm bg-surface py-1.5 shadow-[0_18px_40px_-12px_rgba(6,18,36,0.35)] ring-1 ring-line"
      >
        {options.map((option, i) => {
          const isSelected = option === value;
          const isActive = i === active;
          return (
            <li
              key={option}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={isSelected}
              onPointerMove={() => setActive(i)}
              // Keep focus on the button so the list doesn't close before the click lands.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              className={`mx-1.5 flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] ${
                isSelected ? "bg-navy text-ivory" : isActive ? "bg-steel-tint text-navy" : "text-charcoal"
              } ${isSelected && isActive ? "ring-2 ring-steel-bright ring-inset" : ""}`}
            >
              <span className="min-w-0 flex-1 truncate">{option}</span>
              {isSelected && <Check aria-hidden weight="bold" className="h-4 w-4 shrink-0 text-steel-bright" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
