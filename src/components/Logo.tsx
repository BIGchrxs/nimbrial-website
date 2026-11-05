import { EMBLEM_PATH, EMBLEM_VIEWBOX, WORDMARK_PATH, WORDMARK_VIEWBOX } from "./brandPaths";

/** The Nimbrial emblem. Inherits colour from `currentColor`. */
export function Emblem({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={EMBLEM_VIEWBOX}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d={EMBLEM_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** The "nimbrial" wordmark. Inherits colour from `currentColor`. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} className={className} aria-hidden>
      <path d={WORDMARK_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** Emblem + wordmark lock-up used in the nav. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="Nimbrial">
      <Emblem className="h-8 w-auto" />
      <Wordmark className="h-[22px] w-auto" />
    </span>
  );
}
