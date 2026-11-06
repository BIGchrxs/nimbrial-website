// Contact settings used by the contact form, nav and footer.

/** Inbox that receives discovery-call requests and is shown as the public contact address. */
export const CONTACT_EMAIL = "develop@nimbrial.net";

/**
 * Formspree form ID: the last part of the form's endpoint, e.g. "abcdwxyz" from
 * https://formspree.io/f/abcdwxyz (Formspree dashboard → your form → Integration).
 * Empty means the form isn't connected yet; it then asks visitors to email CONTACT_EMAIL instead.
 * The ID is public by design (it appears in the page), so it is safe to commit.
 */
export const FORMSPREE_FORM_ID = "";

export const FORMSPREE_ENDPOINT = FORMSPREE_FORM_ID ? `https://formspree.io/f/${FORMSPREE_FORM_ID}` : "";
