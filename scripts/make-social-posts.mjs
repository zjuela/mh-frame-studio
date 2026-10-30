// Builds sample custom social posts in the practice's brand: a single-image
// post (photo with a text panel) and carousels (text slides with a slide
// counter). All are 1080×1350, the 4:5 feed size.
//
//   node scripts/make-social-posts.mjs scripts/social/posts.json
//
// Photos come from src/assets/images/demo/.
// Writes src/assets/images/social/<name>.jpg for a photo post and
// <name>-<n>.jpg for each carousel slide.

import { mkdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { TEAL, NAVY, FONT, esc, wrap } from './lib/reel-kit.mjs';

const {
  positionals: [configFile],
} = parseArgs({ allowPositionals: true });
if (!configFile) {
  console.error('Usage: node scripts/make-social-posts.mjs <config.json>');
  process.exit(1);
}
const { brand, posts } = JSON.parse(readFileSync(configFile, 'utf8'));
const outDir = 'src/assets/images/social';
mkdirSync(outDir, { recursive: true });

const W = 1080;
const H = 1350;
const PAD = 80;
const MINT = '#7dd3c0';

const svg = (body) => Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`);

const lines = (list, x, y, { size, weight = 700, fill = '#fff', gap = 1.2 }) =>
  list
    .map(
      (l, i) =>
        `<text x="${x}" y="${y + i * size * gap}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`
    )
    .join('');

const kicker = (x, y, s) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="30" font-weight="800" letter-spacing="4" fill="${MINT}">${esc(s)}</text>`;

const brandMark = (fill = '#fff') =>
  `<text x="${PAD}" y="${H - 64}" font-family="${FONT}" font-size="30" font-weight="400" fill="${fill}" opacity="0.8">${esc(brand)}</text>`;

const save = (image, file) =>
  image
    .jpeg({ quality: 88 })
    .toFile(`${outDir}/${file}`)
    .then(() => console.log(`Wrote ${outDir}/${file}`));

/** Photo across the top, headline on a navy panel below. */
async function photoPost({ name, image, kicker: k, title, text }) {
  const photoH = 820;
  const photo = await sharp(`src/assets/images/demo/${image}`)
    .resize(W, photoH, { fit: 'cover', position: sharp.strategy.attention })
    .toBuffer();
  const y = photoH + 110;
  const overlay = svg(
    kicker(PAD, y, k) +
      lines(wrap(title, 22), PAD, y + 88, { size: 76, weight: 800 }) +
      lines([text], PAD, y + 168, { size: 36, weight: 400, fill: '#cbd5e1' }) +
      brandMark()
  );
  await save(
    sharp({ create: { width: W, height: H, channels: 3, background: NAVY } }).composite([
      { input: photo, left: 0, top: 0 },
      { input: overlay, left: 0, top: 0 },
    ]),
    `${name}.jpg`
  );
}

/** Text slides alternating navy and teal, with an "n / total" counter. */
async function carousel({ name, slides }) {
  for (const [i, slide] of slides.entries()) {
    const big = i > 0 && slide.title.length < 20;
    const titleLines = wrap(slide.title, big ? 14 : 18);
    const size = big ? 110 : 84;
    // Centre kicker, title and text as one block.
    const textLines = wrap(slide.text, 38);
    const blockH = 40 + titleLines.length * size * 1.15 + 40 + textLines.length * 56;
    const top = (H - blockH) / 2 + 20;
    const counter = `${i + 1} / ${slides.length}`;
    const overlay = svg(
      `<rect x="${W - PAD - 130}" y="70" width="130" height="56" rx="28" fill="#fff" opacity="0.18"/>
       <text x="${W - PAD - 65}" y="108" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="700" fill="#fff">${counter}</text>` +
        kicker(PAD, top - 40, slide.kicker) +
        lines(titleLines, PAD, top + size, { size, weight: 800, gap: 1.15 }) +
        lines(textLines, PAD, top + size + titleLines.length * size * 1.15 + 40, {
          size: 40,
          weight: 400,
          fill: '#e2e8f0',
          gap: 1.4,
        }) +
        brandMark()
    );
    await save(
      sharp({ create: { width: W, height: H, channels: 3, background: i % 2 ? TEAL : NAVY } }).composite([
        { input: overlay, left: 0, top: 0 },
      ]),
      `${name}-${i + 1}.jpg`
    );
  }
}

for (const post of posts) {
  if (post.type === 'photo') await photoPost(post);
  else await carousel(post);
}
