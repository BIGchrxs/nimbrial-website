"use client";

import { useCallback, useState } from "react";
import { ArrowUpRight, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { CountryCode } from "libphonenumber-js/min";
import { CONTACT_EMAIL, FORMSPREE_ENDPOINT, TURNSTILE_SITE_KEY } from "@/lib/contact";
import {
  DEFAULT_COUNTRY,
  FIELD_ORDER,
  formatPhone,
  validateContact,
  type ContactFields,
  type FieldErrors,
  type FieldName,
} from "@/lib/contactValidation";
import CountryCodePicker from "./CountryCodePicker";
import ThemedSelect from "./ThemedSelect";
import Turnstile from "./Turnstile";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const SERVICES = ["Business systems", "AI automation", "Website", "Cloud + security", "Not sure yet"];

const INPUT_IDS: Record<FieldName, string> = {
  name: "cf-name",
  email: "cf-email",
  phone: "cf-phone",
  message: "cf-message",
  consent: "cf-consent",
};

const label = "mb-2 block text-sm font-semibold text-charcoal";
const fieldBase =
  "w-full rounded-sm bg-ivory px-4 py-3.5 text-[16px] text-charcoal outline-none transition-shadow placeholder:text-muted/70";
const ringOk = "ring-1 ring-line focus:ring-2 focus:ring-steel";
const ringBad = "ring-2 ring-error focus:ring-error";

function readFields(form: HTMLFormElement): ContactFields {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? ""),
    email: String(data.get("email") ?? ""),
    phone: String(data.get("phone") ?? ""),
    phoneCountry: (String(data.get("phone_country") || DEFAULT_COUNTRY) as CountryCode),
    message: String(data.get("message") ?? ""),
    consent: data.get("consent") === "yes",
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm leading-snug text-error">
      <WarningCircle weight="fill" aria-hidden className="mt-px h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

/**
 * Discovery-call request form. Submits to Formspree, which emails each request to CONTACT_EMAIL.
 * Fields are checked when the visitor submits, with a message under each one to fix, updated live as they type.
 * Without JavaScript the browser posts straight to Formspree (which validates the email itself).
 * When TURNSTILE_SITE_KEY is set, a Cloudflare Turnstile check must pass before anything is sent;
 * Formspree verifies its token with the secret key saved in the form's settings.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);
  const onCaptchaToken = useCallback((token: string | null) => setCaptchaToken(token), []);
  const onCaptchaLoadError = useCallback(() => setCaptchaFailed(true), []);

  // Messages appear when the visitor first presses submit, then update live as they fix each field.
  // (Showing them on leaving a field moved the button mid-click, so the click missed it.)
  const visibleError = (name: FieldName) => (submitted ? errors[name] : undefined);

  type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const revalidate = (form: HTMLFormElement | null) => {
    if (submitted && form) setErrors(validateContact(readFields(form)));
  };

  // Props shared by every validated input: error styling, screen reader wiring and live re-checking.
  const fieldProps = (name: FieldName) => {
    const message = visibleError(name);
    return {
      id: INPUT_IDS[name],
      name,
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${INPUT_IDS[name]}-error` : undefined,
      onChange: (e: React.ChangeEvent<FieldElement>) => revalidate(e.currentTarget.form),
    };
  };
  const ring = (name: FieldName) => (visibleError(name) ? ringBad : ringOk);

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

    const fields = readFields(form);
    const found = validateContact(fields);
    setErrors(found);
    setSubmitted(true);
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      setStatus({ kind: "idle" });
      document.getElementById(INPUT_IDS[first])?.focus();
      return;
    }

    // Send the phone number in international format, e.g. "+27 82 123 4567".
    data.delete("phone_country");
    if (fields.phone.trim()) data.set("phone", formatPhone(fields.phone, fields.phoneCountry));
    else data.delete("phone");

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

  function startOver() {
    setErrors({});
    setSubmitted(false);
    setCountry(DEFAULT_COUNTRY);
    setStatus({ kind: "idle" });
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
          onClick={startOver}
          className="text-sm font-semibold text-steel underline-offset-4 hover:underline"
        >
          Send another request
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";
  const phoneError = visibleError("phone");
  const consentError = visibleError("consent");

  return (
    <form
      action={FORMSPREE_ENDPOINT || undefined}
      method="POST"
      noValidate
      onSubmit={onSubmit}
      data-captcha={TURNSTILE_SITE_KEY ? "on" : "off"}
      className="grid gap-5"
    >
      <p className="text-sm text-muted">
        Fields marked <span className="text-steel">*</span> are required.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>
            Name <span className="text-steel">*</span>
          </label>
          <input
            {...fieldProps("name")}
            required
            maxLength={120}
            autoComplete="name"
            className={`${fieldBase} ${ring("name")}`}
          />
          <FieldError id="cf-name-error" message={visibleError("name")} />
        </div>
        <div>
          <label htmlFor="cf-email" className={label}>
            Email <span className="text-steel">*</span>
          </label>
          <input
            {...fieldProps("email")}
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            inputMode="email"
            placeholder="name@company.co.za"
            className={`${fieldBase} ${ring("email")}`}
          />
          <FieldError id="cf-email-error" message={visibleError("email")} />
        </div>
        <div>
          <label htmlFor="cf-company" className={label}>
            Company
          </label>
          <input
            id="cf-company"
            name="company"
            maxLength={160}
            autoComplete="organization"
            className={`${fieldBase} ${ringOk}`}
          />
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>
            Phone
          </label>
          <div className="flex gap-2">
            <CountryCodePicker
              value={country}
              invalid={Boolean(phoneError)}
              onChange={(code) => {
                setCountry(code);
                // Re-check the number against the new country straight away (state updates after this render).
                const form = document.getElementById(INPUT_IDS.phone)?.closest("form");
                if (submitted && form) setErrors(validateContact({ ...readFields(form), phoneCountry: code }));
              }}
            />
            <input
              {...fieldProps("phone")}
              type="tel"
              maxLength={40}
              autoComplete="tel-national"
              inputMode="tel"
              placeholder="Optional"
              className={`${fieldBase} min-w-0 ${ring("phone")}`}
            />
          </div>
          <FieldError id="cf-phone-error" message={phoneError} />
        </div>
      </div>

      <div>
        <label id="cf-service-label" htmlFor="cf-service" className={label}>
          What do you need help with?
        </label>
        <ThemedSelect
          id="cf-service"
          name="service"
          options={SERVICES}
          defaultValue="Not sure yet"
          labelledBy="cf-service-label"
        />
      </div>

      <div>
        <label htmlFor="cf-message" className={label}>
          Where does the admin pile up? <span className="text-steel">*</span>
        </label>
        <textarea
          {...fieldProps("message")}
          required
          rows={5}
          maxLength={3000}
          placeholder="A few lines on how your business runs today and what's slowing it down."
          className={`${fieldBase} resize-y ${ring("message")}`}
        />
        <FieldError id="cf-message-error" message={visibleError("message")} />
      </div>

      {/* Honeypot: hidden from people and screen readers, left empty by real visitors. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          <input
            {...fieldProps("consent")}
            type="checkbox"
            value="yes"
            required
            className={`mt-1 h-4 w-4 shrink-0 accent-navy ${consentError ? "outline-2 outline-offset-2 outline-error" : ""}`}
          />
          <span>
            I agree that Nimbrial may use these details to respond to my enquiry. <span className="text-steel">*</span>
          </span>
        </label>
        <FieldError id="cf-consent-error" message={consentError} />
      </div>

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
