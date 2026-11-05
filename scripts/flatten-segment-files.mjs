// Works around a Next.js bug in static exports built on Windows:
// https://github.com/vercel/next.js/issues/85374 (cause: https://github.com/vercel/next.js/issues/92339)
//
// Next 16 writes route prefetch files as nested folders on Windows, e.g.
//   out/services/__next.services/__PAGE__.txt
// but the browser requests the flat name that Linux builds produce:
//   out/services/__next.services.__PAGE__.txt
//
// This script moves any nested files to the flat name. It only acts when it finds the broken
// layout, so it does nothing on Linux (CI, Render) and becomes a no-op once Next.js ships the fix.
// Remove it after upgrading to a Next.js release that includes https://github.com/vercel/next.js/pull/99058.
import { readdirSync, renameSync, rmdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT_DIR = process.argv[2] ?? "out";
const SEGMENT_DIR = /^__next\./;

// Lists every file under `dir`, recursively.
function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

// Removes empty folders left behind, deepest first. Ignores folders that cannot be removed.
function removeEmptyDirs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyDirs(join(dir, entry.name));
  }
  try {
    if (readdirSync(dir).length === 0) rmdirSync(dir);
  } catch {
    // leave it; an empty folder is harmless
  }
}

// Finds nested "__next.*" folders anywhere in the export and flattens their contents.
function flatten(dir) {
  let moved = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (!SEGMENT_DIR.test(entry.name)) {
      moved += flatten(full);
      continue;
    }
    for (const file of listFiles(full)) {
      // out/services/__next.services/__PAGE__.txt -> out/services/__next.services.__PAGE__.txt
      const flatName = relative(dir, file).split(sep).join(".");
      renameSync(file, join(dir, flatName));
      moved++;
    }
    removeEmptyDirs(full);
  }
  return moved;
}

try {
  if (!statSync(OUT_DIR).isDirectory()) throw new Error(`${OUT_DIR} is not a directory`);
} catch (err) {
  console.error(`flatten-segment-files: cannot read "${OUT_DIR}": ${err.message}`);
  process.exit(1);
}

const moved = flatten(OUT_DIR);
console.log(
  moved === 0
    ? "flatten-segment-files: export layout already correct, nothing to do."
    : `flatten-segment-files: fixed ${moved} nested prefetch file(s) (Windows build, Next.js issue #85374).`,
);
