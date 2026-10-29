// Turns one before/after source photo (two shots joined in a single image)
// into a labelled post: matched crops, BEFORE / AFTER tags, the procedure
// name and a "results may vary" line.
//
//   node scripts/make-before-after.mjs scripts/before-after/posts.json
//
// Each post in the JSON names its source, where the two shots meet
// (`split`: axis plus the start and end of the divider, as fractions of the
// image), which shot is the before, a crop applied to both shots, and the
// layout: "side" (side by side) or "stack" (before above after) on a canvas
// `width` wide, plus an optional fixed `height` (e.g. 1920 for a Story).
// Photos are only cropped and resized, never colour-corrected or retouched,
// so the clinical result is shown as it was photographed.
// Writes src/assets/images/before-after/<name>.jpg.

import { mkdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { TEAL, NAVY, SLATE, FONT, esc, pill } from './lib/reel-kit.mjs';

const {
  positionals: [configFile],
} = parseArgs({ allowPositionals: true });
if (!configFile) {
  console.error('Usage: node scripts/make-before-after.mjs <config.json>');
  process.exit(1);
}
const { brand, posts } = JSON.parse(readFileSync(configFile, 'utf8'));
const outDir = 'src/assets/images/before-after';
mkdirSync(outDir, { recursive: true });

const PAD = 48;
const GAP = 20;
const RADIUS = 24;

/** The two shots of a source photo as { before, after } pixel regions. */
const halves = ({ width, height }, { axis, divider: [a, b] }, beforeFirst) => {
  const size = axis === 'x' ? width : height;
  const first = [0, Math.floor(a * size)];
  const second = [Math.ceil(b * size), size];
  const region = ([start, end]) =>
    axis === 'x'
      ? { left: start, top: 0, width: end - start, height }
      : { left: 0, top: start, width, height: end - start };
  return beforeFirst
    ? { before: region(first), after: region(second) }
    : { before: region(second), after: region(first) };
};

/** The same fractional crop [x0, y0, x1, y1] inside a shot. */
const cropWithin = (r, [x0, y0, x1, y1]) => ({
  left: r.left + Math.round(x0 * r.width),
  top: r.top + Math.round(y0 * r.height),
  width: Math.round((x1 - x0) * r.width),
  height: Math.round((y1 - y0) * r.height),
});

const panel = (file, region, w, h) =>
  sharp(file)
    .extract(region)
    .resize(w, h, { fit: 'cover' })
    .composite([
      {
        input: Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${RADIUS}"/></svg>`),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

const svg = (w, h, body) =>
  Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`);

const text = (x, y, s, { size, weight = 700, fill = NAVY, anchor = 'start', spacing = 0 }) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${fill}">${esc(s)}</text>`;

for (const post of posts) {
  const { name, source, procedure, layout, width: W, crop = [0, 0, 1, 1] } = post;
  const meta = await sharp(source).metadata();
  const shots = halves(meta, post.split, post.before === 'first');
  const before = cropWithin(shots.before, crop);
  const after = cropWithin(shots.after, crop);
  const aspect = before.width / before.height;

  // Header and footer scale with the canvas so a Story and a web image read alike.
  const s = W / 1080;
  const headerH = Math.round(150 * s);
  const footerH = Math.round(90 * s);

  const side = layout === 'side';
  const panelW = side ? Math.round((W - 2 * PAD - GAP) / 2) : W - 2 * PAD;
  const panelH = Math.round(panelW / aspect);
  const contentH = side ? panelH : 2 * panelH + GAP;
  // A fixed height (Story, 4:5 post) centres header, photos and footer as one block.
  const blockH = headerH + contentH + footerH;
  const H = post.height ?? blockH + 2 * PAD;
  const y0 = Math.round((H - blockH) / 2);
  const top = y0 + headerH;
  const slots = side
    ? [
        { left: PAD, top },
        { left: PAD + panelW + GAP, top },
      ]
    : [
        { left: PAD, top },
        { left: PAD, top: top + panelH + GAP },
      ];

  const tagSize = Math.round(30 * s);
  const tags = [
    ['BEFORE', SLATE],
    ['AFTER', TEAL],
  ]
    .map(([label, fill], i) => pill(slots[i].left + 24 * s, slots[i].top + 24 * s, label, fill, tagSize))
    .join('');

  // Header: procedure name, with "Before & after" above it; brand on the right.
  const headerY = y0 + headerH * 0.3;
  const overlay = svg(
    W,
    H,
    text(PAD, headerY, 'BEFORE & AFTER', { size: 26 * s, fill: TEAL, spacing: 3 * s }) +
      text(PAD, headerY + 64 * s, procedure, { size: 58 * s, weight: 800 }) +
      text(W - PAD, headerY + 64 * s, brand, { size: 30 * s, weight: 400, fill: '#64748b', anchor: 'end' }) +
      tags +
      text(W / 2, y0 + headerH + contentH + footerH * 0.65, 'Results may vary. Individual results differ.', {
        size: 26 * s,
        weight: 400,
        fill: '#64748b',
        anchor: 'middle',
      })
  );

  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite([
      { input: await panel(source, before, panelW, panelH), ...slots[0] },
      { input: await panel(source, after, panelW, panelH), ...slots[1] },
      { input: overlay, left: 0, top: 0 },
    ])
    .jpeg({ quality: 88 })
    .toFile(`${outDir}/${name}.jpg`);
  console.log(`Wrote ${outDir}/${name}.jpg (${W}×${H})`);
}
