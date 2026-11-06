import { EMBLEM_PATH, EMBLEM_VIEWBOX } from "./brandPaths";

export const EMBLEM_HEIGHT = 3.1; // world units

/* ---------------------------------------------------------------
   Sample points that fill the emblem, with a puffy 3D depth.
---------------------------------------------------------------- */
export function sampleEmblem(count: number) {
  const [, , vbW, vbH] = EMBLEM_VIEWBOX.split(" ").map(Number);
  const RES = 360; // sampling grid resolution (height)
  const scale = RES / vbH;
  const w = Math.ceil(vbW * scale);
  const h = RES;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(scale, scale);
  ctx.fill(new Path2D(EMBLEM_PATH), "evenodd");
  const pixels = ctx.getImageData(0, 0, w, h).data;

  // Inside mask, plus a chamfer distance-to-edge map used to give the shape a rounded thickness.
  const inside = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) inside[i] = pixels[i * 4 + 3] > 127 ? 1 : 0;
  const dist = new Float32Array(w * h);
  const BIG = 1e6;
  for (let i = 0; i < w * h; i++) dist[i] = inside[i] ? BIG : 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!dist[i]) continue;
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - w] + 1);
      if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - w - 1] + 1.414);
      if (x < w - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - w + 1] + 1.414);
    }
  let maxDist = 1;
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!dist[i]) continue;
      if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + 1);
      if (x < w - 1 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w + 1] + 1.414);
      if (x > 0 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w - 1] + 1.414);
      maxDist = Math.max(maxDist, dist[i]);
    }

  const filled: number[] = [];
  const edges: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!inside[i]) continue;
    filled.push(i);
    if (dist[i] <= 1.5) edges.push(i);
  }

  const rand = mulberry32(11);
  const home = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const toWorld = EMBLEM_HEIGHT / h;
  for (let p = 0; p < count; p++) {
    // ~25% of points trace the outline so the silhouette stays crisp
    const pool = rand() < 0.25 && edges.length ? edges : filled;
    const i = pool[Math.floor(rand() * pool.length)];
    const x = (i % w) + rand();
    const y = Math.floor(i / w) + rand();
    const depth = Math.sqrt(dist[i] / maxDist); // 0 at edge, 1 at the thickest point
    home[p * 3] = (x - w / 2) * toWorld;
    home[p * 3 + 1] = -(y - h / 2) * toWorld;
    home[p * 3 + 2] = (rand() * 2 - 1) * (0.06 + depth * 0.32);
    seeds[p] = rand();
  }
  return { home, seeds };
}

/** Small seeded random number generator, so the particle layout is the same on every load. */
export function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
