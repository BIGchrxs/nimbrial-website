// Adds a strict Content-Security-Policy <meta> tag to every exported HTML page.
//
// Next.js inlines a few small <script> blocks in each page. Instead of allowing all inline
// scripts ('unsafe-inline'), this computes a SHA-256 hash of each one and allows exactly those.
// Any other inline script, e.g. one injected by an attacker, is blocked by the browser.
//
// Directives a <meta> tag cannot carry (frame-ancestors etc.) are sent as HTTP headers by
// Render; see render.yaml.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.argv[2] ?? "out";

// Policy shared by every page. Script hashes are appended per page.
const BASE_POLICY = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  // React and the animations set inline style attributes; styles can't run code.
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'"],
  // The contact form posts to Formspree (src/lib/contact.ts).
  "connect-src": ["'self'", "https://formspree.io"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'", "https://formspree.io"],
  "upgrade-insecure-requests": [],
};

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const CHARSET_META = /<meta charSet="utf-8"\/>/i;

// Lists every .html file under `dir`, recursively.
function listHtml(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listHtml(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

// Builds the policy string for one page from its inline scripts.
function policyFor(html) {
  const hashes = new Set();
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    const hash = createHash("sha256").update(match[1], "utf8").digest("base64");
    hashes.add(`'sha256-${hash}'`);
  }
  const policy = { ...BASE_POLICY, "script-src": [...BASE_POLICY["script-src"], ...hashes] };
  return {
    count: hashes.size,
    value: Object.entries(policy)
      .map(([directive, sources]) => [directive, ...sources].join(" "))
      .join("; "),
  };
}

try {
  if (!statSync(OUT_DIR).isDirectory()) throw new Error("not a directory");
} catch (err) {
  console.error(`add-csp: cannot read "${OUT_DIR}": ${err.message}`);
  process.exit(1);
}

const pages = listHtml(OUT_DIR);
if (pages.length === 0) {
  console.error(`add-csp: no HTML pages found in "${OUT_DIR}"`);
  process.exit(1);
}

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  if (html.includes('http-equiv="Content-Security-Policy"')) {
    console.error(`add-csp: ${file} already has a CSP meta tag (was the script run twice?)`);
    process.exit(1);
  }
  if (!CHARSET_META.test(html)) {
    console.error(`add-csp: ${file} has no <meta charSet="utf-8"/> to anchor the policy after`);
    process.exit(1);
  }
  const { value } = policyFor(html);
  // Directly after the charset, before any script, so it applies to the whole page.
  const tag = `<meta http-equiv="Content-Security-Policy" content="${value}"/>`;
  writeFileSync(file, html.replace(CHARSET_META, (m) => m + tag));
}
console.log(`add-csp: added a hash-based Content-Security-Policy to ${pages.length} page(s).`);
