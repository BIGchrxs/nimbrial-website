// Minimal static file server for the exported site in /out, used only by the Playwright tests.
// Built on Node's standard library so it adds no third-party dependencies to audit.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve(process.argv[2] ?? "out");
const PORT = Number(process.argv[3] ?? 4173);

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

// Streams a file with the right content type and status code.
function send(res, filePath, status) {
  res.writeHead(status, {
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
    const filePath = await resolveFile(req.url ?? "/");
    if (filePath) {
      send(res, filePath, 200);
      return;
    }
    const notFound = await resolveFile("/404.html");
    if (notFound) send(res, notFound, 404);
    else res.writeHead(404).end("Not found");
  } catch {
    res.writeHead(400).end("Bad request");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT}`);
});
