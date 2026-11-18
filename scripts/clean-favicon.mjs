/**
 * Site addition (not in astro-studia): cleans a hand-coloured favicon drawing.
 * Every enclosed area gets one solid colour (the one it mostly has), thin
 * halos along the black lines are removed, the outside becomes transparent,
 * and the result is enlarged to 1024 px with crisp lines, centred on a square.
 *
 *   node scripts/clean-favicon.mjs <source.png> <out.png> [brighten 0..1]
 *   npm run icons -- src/assets/brand/icon.png
 *
 * Sources: src/assets/brand/sources/ (the coloured drawings).
 * Results: src/assets/brand/variants/ (orange-bright = 0.35 is the site icon,
 * copied to src/assets/brand/icon.png).
 */
import sharp from 'sharp';
const [src, out, brightArg] = process.argv.slice(2);
const BRIGHT = Number(brightArg ?? 0); // 0..1: how far to lift each fill's lightness towards white
// HSL lightness lift, saturation kept (white stays white)
function brighten([r, g, b], k) {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h = 0,
    sat = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  const L = l + (1 - l) * k * (l < 0.5 ? 1 : 0.5),
    S = Math.min(1, sat * 1.05);
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S,
    p = 2 * L - q;
  const f = (t) => {
    t = (t + 1) % 1;
    return t < 1 / 6
      ? p + (q - p) * 6 * t
      : t < 1 / 2
        ? q
        : t < 2 / 3
          ? p + (q - p) * (2 / 3 - t) * 6
          : p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
const { data, info } = await sharp(src)
  .flatten({ background: '#ffffff' })
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width,
  H = info.height,
  C = info.channels;
const px = (p) => [data[p * C], data[p * C + 1], data[p * C + 2]];
const isBlack = (p) => {
  const [r, g, b] = px(p);
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  return mx < 70 && mx - mn < 30;
};
const black = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) black[p] = isBlack(p) ? 1 : 0;
// distance (in px, up to 3) to the nearest black pixel
const near = new Uint8Array(W * H).fill(9);
for (let p = 0; p < W * H; p++) if (black[p]) near[p] = 0;
for (let it = 1; it <= 3; it++)
  for (let p = 0; p < W * H; p++)
    if (near[p] === 9) {
      const x = p % W,
        y = (p / W) | 0;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < W - 1 ? p + 1 : -1,
        y > 0 ? p - W : -1,
        y < H - 1 ? p + W : -1,
      ])
        if (q >= 0 && near[q] === it - 1) {
          near[p] = it;
          break;
        }
    }
// label the non-black areas
const label = new Int32Array(W * H).fill(-1);
const comps = [];
for (let s = 0; s < W * H; s++) {
  if (black[s] || label[s] >= 0) continue;
  const id = comps.length;
  const st = [s];
  const pts = [];
  while (st.length) {
    const p = st.pop();
    if (label[p] >= 0 || black[p]) continue;
    label[p] = id;
    pts.push(p);
    const x = p % W,
      y = (p / W) | 0;
    if (x > 0) st.push(p - 1);
    if (x < W - 1) st.push(p + 1);
    if (y > 0) st.push(p - W);
    if (y < H - 1) st.push(p + W);
  }
  let border = false,
    interior = false;
  const cnt = new Map();
  for (const p of pts) {
    const x = p % W,
      y = (p / W) | 0;
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
    if (near[p] >= 3) {
      interior = true;
      const k = px(p).join(',');
      cnt.set(k, (cnt.get(k) || 0) + 1);
    }
  }
  let color = interior
    ? [...cnt]
        .sort((a, b) => b[1] - a[1])[0][0]
        .split(',')
        .map(Number)
    : null;
  if (color && BRIGHT > 0) color = brighten(color, BRIGHT);
  comps.push({ border, color, n: pts.length });
}
// clean image at source size: outside transparent, halo-only strips black, fills solid
const N = 1024;
const blackMask = Buffer.alloc(W * H);
for (let p = 0; p < W * H; p++)
  blackMask[p] = black[p] || (!comps[label[p]].border && !comps[label[p]].color) ? 0 : 255;
const bigMask = await sharp(
  await sharp(blackMask, { raw: { width: W, height: H, channels: 1 } })
    .resize(N, N, { kernel: 'lanczos3' })
    .png()
    .toBuffer(),
)
  .blur(1.0)
  .png()
  .toBuffer();
const bigBlack = await sharp(bigMask).threshold(165).extractChannel(0).raw().toBuffer();
const outRgba = Buffer.alloc(N * N * 4);
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++) {
    const P = y * N + x;
    const sx = Math.min(W - 1, Math.floor((x * W) / N)),
      sy = Math.min(H - 1, Math.floor((y * H) / N));
    if (bigBlack[P] < 128) {
      outRgba.set([0, 0, 0, 255], P * 4);
      continue;
    }
    // nearest labelled source pixel that is not black, around (sx, sy)
    let c = null;
    for (let r = 0; r <= 4 && !c; r++)
      for (let dy = -r; dy <= r && !c; dy++)
        for (let dx = -r; dx <= r && !c; dx++) {
          const xx = sx + dx,
            yy = sy + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const q = yy * W + xx;
          if (black[q]) continue;
          const comp = comps[label[q]];
          c = comp.border ? 'out' : (comp.color ?? [0, 0, 0]);
        }
    if (!c || c === 'out') continue; // transparent
    outRgba.set([...c, 255], P * 4);
  }
// trim to the drawing, centre on a square with a small margin
const trimmed = await sharp(outRgba, { raw: { width: N, height: N, channels: 4 } })
  .png()
  .toBuffer();
const t = await sharp(trimmed).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const side = Math.round(Math.max(t.info.width, t.info.height) / 0.96);
await sharp({
  create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    {
      input: t.data,
      left: Math.round((side - t.info.width) / 2),
      top: Math.round((side - t.info.height) / 2),
    },
  ])
  .resize(N, N)
  .png()
  .toFile(out);
console.log(
  'ok',
  out,
  comps
    .filter((c) => !c.border && c.color)
    .map((c) => c.color.join('/') + ':' + c.n)
    .join(' '),
);
