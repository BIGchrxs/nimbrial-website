import { isValidPhoneNumber, parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js/min";
import { COUNTRIES } from "./countries";

export type ContactFields = {
  name: string;
  email: string;
  phone: string;
  phoneCountry: CountryCode;
  message: string;
  consent: boolean;
};

export type FieldName = "name" | "email" | "phone" | "message" | "consent";
export type FieldErrors = Partial<Record<FieldName, string>>;

/** Order the fields appear in, so the first problem can be focused. */
export const FIELD_ORDER: FieldName[] = ["name", "email", "phone", "message", "consent"];

export const DEFAULT_COUNTRY: CountryCode = "ZA";
export const MIN_MESSAGE_LENGTH = 20;

// Something@domain.tld: strict enough to catch typos, loose enough for every real address.
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function countryLabel(code: CountryCode) {
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? `${c.name} (+${c.dial})` : code;
}

/** Returns a friendly message for every field that needs fixing. */
export function validateContact(f: ContactFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!f.name.trim()) errors.name = "Please tell us your name.";

  const email = f.email.trim();
  if (!email) errors.email = "Please enter your email address so we can reply.";
  else if (!EMAIL.test(email)) errors.email = "Please enter a full email address, like name@company.co.za.";

  const phone = f.phone.trim();
  if (phone && !isValidPhoneNumber(phone, f.phoneCountry)) {
    errors.phone = `That doesn't look like a valid number for ${countryLabel(f.phoneCountry)}. Check it, or leave it blank.`;
  }

  const message = f.message.trim();
  if (!message) errors.message = "Please tell us a little about your business and what's slowing it down.";
  else if (message.length < MIN_MESSAGE_LENGTH) {
    errors.message = `Please add a bit more detail (at least ${MIN_MESSAGE_LENGTH} characters) so we can prepare for the call.`;
  }

  if (!f.consent) errors.consent = "Please tick this box so we can use your details to reply.";

  return errors;
}

/** International format for the email we receive, e.g. "+27 82 123 4567". Assumes it passed validation. */
export function formatPhone(phone: string, country: CountryCode) {
  return parsePhoneNumberWithError(phone.trim(), country).formatInternational();
}
