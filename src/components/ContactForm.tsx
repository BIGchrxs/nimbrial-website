"use client";

import { useCallback, useState } from "react";
import { ArrowUpRight, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { CONTACT_EMAIL, FORMSPREE_ENDPOINT, TURNSTILE_SITE_KEY } from "@/lib/contact";
import Turnstile from "./Turnstile";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const SERVICES = ["Business systems", "AI automation", "Website", "Cloud + security", "Not sure yet"];

const field =
  "w-full rounded-sm bg-ivory px-4 py-3.5 text-[16px] text-charcoal ring-1 ring-line outline-none transition-shadow placeholder:text-muted/70 focus:ring-2 focus:ring-steel";
const label = "mb-2 block text-sm font-semibold text-charcoal";

/**
 * Discovery-call request form. Submits to Formspree, which emails each request to CONTACT_EMAIL.
 * Without JavaScript the browser posts straight to Formspree; with it, the result shows inline.
 * When TURNSTILE_SITE_KEY is set, a Cloudflare Turnstile check must pass before anything is sent;
 * Formspree verifies its token with the secret key saved in the form's settings.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const onCaptchaToken = useCallback((token: string | null) => setCaptchaToken(token), []);
  const onCaptchaLoadError = useCallback(() => setCaptchaFailed(true), []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Hidden field that people never see. Bots fill it in; pretend success and send nothing.
    if (data.get("website")) {
      form.reset();
      setStatus({ kind: "sent" });
      return;
    }
    data.delete("website");

    if (!FORMSPREE_ENDPOINT) {
      setStatus({ kind: "error", message: `Our form isn't connected yet. Please email us at ${CONTACT_EMAIL}.` });
      return;
    }

    if (TURNSTILE_SITE_KEY) {
      if (captchaFailed) {
        setStatus({
          kind: "error",
          message: `The security check couldn't load (an ad blocker can cause this). Please email us at ${CONTACT_EMAIL}.`,
        });
        return;
      }
      if (!captchaToken) {
        setStatus({ kind: "error", message: "Please complete the security check above the button." });
        return;
      }
      data.set("cf-turnstile-response", captchaToken);
    }

    // Each security-check token works once, so any failed attempt needs a fresh one.
    const retry = (message: string) => {
      setCaptchaReset((n) => n + 1);
      setStatus({ kind: "error", message });
    };

    setStatus({ kind: "sending" });
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        form.reset();
        setStatus({ kind: "sent" });
        return;
      }
      const body = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null;
      const detail = body?.errors?.map((e) => e.message).filter(Boolean).join(" ");
      retry(detail || `Something went wrong sending your request. Please try again or email ${CONTACT_EMAIL}.`);
    } catch {
      retry(`We couldn't reach our form service. Check your connection, or email ${CONTACT_EMAIL}.`);
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-6">
        <CheckCircle weight="duotone" className="h-12 w-12 text-steel" />
        <h2 className="display text-3xl">Thanks, your request is in.</h2>
        <p className="max-w-[420px] leading-relaxed text-muted">
          We&apos;ll reply by email to set up a time for your discovery call.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="text-sm font-semibold text-steel underline-offset-4 hover:underline"
        >
          Send another request
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form
      action={FORMSPREE_ENDPOINT || undefined}
      method="POST"
      onSubmit={onSubmit}
      data-captcha={TURNSTILE_SITE_KEY ? "on" : "off"}
      className="grid gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>
            Name <span className="text-steel">*</span>
          </label>
          <input id="cf-name" name="name" required maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="cf-email" className={label}>
            Email <span className="text-steel">*</span>
          </label>
          <input id="cf-email" name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
        </div>
        <div>
          <label htmlFor="cf-company" className={label}>
            Company
          </label>
          <input id="cf-company" name="company" maxLength={160} autoComplete="organization" className={field} />
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>
            Phone
          </label>
          <input id="cf-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="cf-service" className={label}>
          What do you need help with?
        </label>
        <select id="cf-service" name="service" defaultValue="Not sure yet" className={field}>
          {SERVICES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-message" className={label}>
          Where does the admin pile up? <span className="text-steel">*</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={5}
          maxLength={3000}
          placeholder="A few lines on how your business runs today and what's slowing it down."
          className={`${field} resize-y`}
        />
      </div>

      {/* Honeypot: hidden from people and screen readers, left empty by real visitors. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
        <input name="consent" type="checkbox" value="yes" required className="mt-1 h-4 w-4 shrink-0 accent-navy" />
        <span>
          I agree that Nimbrial may use these details to respond to my enquiry. <span className="text-steel">*</span>
        </span>
      </label>

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          resetKey={captchaReset}
          onToken={onCaptchaToken}
          onLoadError={onCaptchaLoadError}
        />
      )}

      <div aria-live="polite">
        {status.kind === "error" && (
          <p role="alert" className="flex items-start gap-2 rounded-sm bg-steel-tint px-4 py-3 text-sm text-navy">
            <WarningCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0" />
            {status.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="group inline-flex w-fit items-center gap-3 rounded-full bg-navy py-3.5 pr-3.5 pl-6 text-[15px] font-semibold text-ivory transition-colors duration-300 hover:bg-navy-deep disabled:cursor-wait disabled:opacity-70"
      >
        {sending ? "Sending…" : "Request a discovery call"}
        <span className="grid h-7 w-7 place-items-center rounded-full bg-current/10">
          <ArrowUpRight weight="bold" className="h-3.5 w-3.5" />
        </span>
      </button>
    </form>
  );
}
