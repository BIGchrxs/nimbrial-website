// Minimal static file server for the exported site in /out, used only by the Playwright tests.
// Built on Node's standard library so it adds no third-party dependencies to audit.
// It sends the same response headers as production, read from render.yaml.
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve(process.argv[2] ?? "out");
const PORT = Number(process.argv[3] ?? 4173);

/**
 * Reads the header rules from render.yaml. Supports exactly the format used there
 * (`- path:` / `name:` / `value:` lines) and fails loudly on anything else, so a
 * format change can't silently drop headers from the tests.
 */
function loadHeaderRules(file = "render.yaml") {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const rules = [];
  let current = null;
  let inHeaders = false;
  const unquote = (v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v);
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "");
    if (/^\s*headers:\s*$/.test(line)) {
      inHeaders = true;
      continue;
    }
    if (!inHeaders || line.trim() === "") continue;
    const path = line.match(/^\s*-\s+path:\s*(.+)$/);
    const field = line.match(/^\s+(name|value):\s*(.+)$/);
    if (path) {
      current = { path: unquote(path[1].trim()) };
      rules.push(current);
    } else if (field && current) {
      current[field[1]] = unquote(field[2].trim());
    } else if (!/^\s/.test(line) || /^\s*-\s+\w+:/.test(line) || /^\s{4}\w+:/.test(line)) {
      inHeaders = false; // left the headers list
    }
  }
  for (const rule of rules) {
    if (!rule.name || !rule.value) throw new Error(`render.yaml header rule is incomplete: ${JSON.stringify(rule)}`);
    if (!rule.path.endsWith("/*") && rule.path.includes("*")) {
      throw new Error(`static-server only supports "/prefix/*" header paths, got ${rule.path}`);
    }
  }
  return rules;
}

const HEADER_RULES = loadHeaderRules();

// Render-style path matching for the patterns we use: "/*" (everything) and "/prefix/*".
function headersFor(urlPath) {
  const out = {};
  for (const { path, name, value } of HEADER_RULES) {
    const prefix = path.endsWith("/*") ? path.slice(0, -1) : null;
    if (prefix ? urlPath.startsWith(prefix) : urlPath === path) out[name] = value;
  }
  return out;
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Resolves a URL path to a file inside ROOT, or null if it doesn't exist or escapes ROOT.
async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidates = decoded.endsWith("/")
    ? [join(decoded, "index.html")]
    : [decoded, join(decoded, "index.html"), `${decoded}.html`];

  for (const candidate of candidates) {
    const fullPath = resolve(ROOT, `.${candidate}`);
    // Block path traversal (e.g. /../../etc/passwd): the resolved path must stay inside ROOT.
    if (!fullPath.startsWith(ROOT + sep)) return null;
    try {
      if ((await stat(fullPath)).isFile()) return fullPath;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

// Streams a file with the right content type, status code and production headers.
function send(res, filePath, status, urlPath) {
  res.writeHead(status, {
    ...headersFor(urlPath),
    "Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const urlPath = (req.url ?? "/").split("?")[0];
    const filePath = await resolveFile(urlPath);
    if (filePath) {
      send(res, filePath, 200, urlPath);
      return;
    }
    const notFound = await resolveFile("/404.html");
    if (notFound) send(res, notFound, 404, urlPath);
    else res.writeHead(404).end("Not found");
  } catch {
    res.writeHead(400).end("Bad request");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT} with ${HEADER_RULES.length} header rule(s) from render.yaml`);
});
