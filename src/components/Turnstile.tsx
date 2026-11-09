"use client";

import { useEffect, useRef } from "react";

// Explicit rendering, so the widget also appears after client-side navigation to the page.
// Docs: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;

// Loads Cloudflare's script once per page, however many times the widget mounts.
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not start")));
    script.onerror = () => {
      loading = null; // allow a retry on the next mount
      script.remove();
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Cloudflare Turnstile CAPTCHA. Reports a token when the visitor passes, and null when the token
 * expires or the check fails. Increment `resetKey` to get a fresh token (each one works only once).
 */
export default function Turnstile({
  siteKey,
  resetKey,
  onToken,
  onLoadError,
}: {
  siteKey: string;
  resetKey: number;
  onToken: (token: string | null) => void;
  onLoadError: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const handlers = useRef({ onToken, onLoadError });

  useEffect(() => {
    handlers.current = { onToken, onLoadError };
  }, [onToken, onLoadError]);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widgetId.current = turnstile.render(container.current, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          callback: (token: string) => handlers.current.onToken(token),
          "expired-callback": () => handlers.current.onToken(null),
          "error-callback": () => handlers.current.onToken(null),
        });
      })
      .catch(() => {
        if (!cancelled) handlers.current.onLoadError();
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return;
    window.turnstile.reset(widgetId.current);
    handlers.current.onToken(null);
  }, [resetKey]);

  return <div ref={container} className="min-h-[65px]" />;
}
