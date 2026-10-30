// Builds sample custom social posts in the practice's brand: a single-image
// post (full-bleed photo with a headline, button and calendar card) and carousels (text slides with an icon,
// background shapes and a slide counter). All are 1080×1350, the 4:5 feed size.
//
//   node scripts/make-social-posts.mjs scripts/social/posts.json
//
// Photos come from src/assets/images/demo/.
// Writes src/assets/images/social/<name>.jpg for a photo post and
// <name>-<n>.jpg for each carousel slide.

import { mkdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { TEAL, NAVY, CORAL, FONT, esc, wrap } from './lib/reel-kit.mjs';

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

/**
 * Full-bleed photo with a navy fade at the bottom for the headline and a
 * button, plus an optional calendar-style card (`badge`) for the key fact.
 * `focusX` (0–1) picks where the 4:5 crop sits across a wide photo.
 */
async function photoPost({ name, image, focusX = 0.5, kicker: k, title, button, badge: card }) {
  const src = sharp(`src/assets/images/demo/${image}`);
  const { width, height } = await src.metadata();
  const cropW = Math.min(width, Math.round((height * W) / H));
  const left = Math.round(Math.min(Math.max(width * focusX - cropW / 2, 0), width - cropW));
  const photo = await src
    .extract({ left, top: 0, width: cropW, height: Math.round((cropW * H) / W) })
    .resize(W, H)
    .toBuffer();

  // Laid out from the bottom up: button, headline (baselines 104px apart), kicker.
  const titleLines = wrap(title, 12);
  const buttonY = H - 214;
  const titleTop = buttonY - 60 - (titleLines.length - 1) * 104;
  const kickerY = titleTop - 76 - 36 - 56;
  const fade = `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}" stop-opacity="0"/>
      <stop offset="0.45" stop-color="${NAVY}" stop-opacity="0.8"/>
      <stop offset="1" stop-color="${NAVY}" stop-opacity="0.97"/>
    </linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.25"/>
    </filter></defs>
    <rect x="0" y="${kickerY - 260}" width="${W}" height="${H - kickerY + 260}" fill="url(#fade)"/>`;

  // A tear-off calendar page: coloured header, big day, time underneath.
  const cardW = 300;
  const cx = W - PAD - cardW;
  const calendar = card
    ? `<g filter="url(#shadow)"><rect x="${cx}" y="90" width="${cardW}" height="330" rx="28" fill="#fff"/></g>
       <path d="M${cx} 118a28 28 0 0 1 28-28h${cardW - 56}a28 28 0 0 1 28 28v62h-${cardW}z" fill="${CORAL}"/>
       <text x="${cx + cardW / 2}" y="148" text-anchor="middle" font-family="${FONT}" font-size="32" font-weight="800" letter-spacing="5" fill="#fff">${esc(card.top)}</text>
       <text x="${cx + cardW / 2}" y="320" text-anchor="middle" font-family="${FONT}" font-size="130" font-weight="800" fill="${NAVY}">${esc(card.main)}</text>
       <text x="${cx + cardW / 2}" y="384" text-anchor="middle" font-family="${FONT}" font-size="34" font-weight="700" fill="${TEAL}">${esc(card.bottom)}</text>`
    : '';

  const kickerW = k.length * 23 + 50;
  const overlay = svg(
    fade +
      calendar +
      `<rect x="${PAD}" y="${kickerY}" width="${kickerW}" height="56" rx="28" fill="${MINT}"/>
       <text x="${PAD + 28}" y="${kickerY + 38}" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="4" fill="${NAVY}">${esc(k)}</text>` +
      lines(titleLines, PAD, titleTop, { size: 100, weight: 800, gap: 1.04 }) +
      (button
        ? `<rect x="${PAD}" y="${buttonY}" width="${button.length * 21 + 120}" height="84" rx="42" fill="${CORAL}"/>
           <text x="${PAD + 44}" y="${buttonY + 55}" font-family="${FONT}" font-size="34" font-weight="800" fill="#fff">${esc(button)}  →</text>`
        : '') +
      `<text x="${W - PAD}" y="${H - 64}" text-anchor="end" font-family="${FONT}" font-size="30" fill="#fff" opacity="0.8">${esc(brand)}</text>`
  );
  await save(sharp(photo).composite([{ input: overlay, left: 0, top: 0 }]), `${name}.jpg`);
}

// Line icons drawn on a 24-unit grid, one per slide (`icon` in the JSON).
const ICONS = {
  toothbrush: `<g transform="rotate(-45 12 12)"><rect x="1" y="12" width="13" height="3.5" rx="1.75"/><rect x="14" y="11" width="8" height="4.5" rx="1.2"/><path d="M15.5 11V7M18 11V7M20.5 11V7"/></g>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>`,
  'calendar-check': `<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4"/>`,
  frayed: `<rect x="4" y="13" width="16" height="4" rx="1.5"/><path d="M10 17v5h4v-5M7 13 4.5 5M10.5 13 9.5 4M13.5 13l1-9M17 13l3-7"/>`,
  electric: `<rect x="8" y="9" width="8" height="13" rx="3"/><rect x="10" y="2" width="4" height="7" rx="1"/><path d="m12.5 12-2 3.5h3l-2 3.5"/>`,
  air: `<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h6"/>`,
};

/** Icon in a soft circle. */
const badge = (name, x, y, r = 74) =>
  `<circle cx="${x + r}" cy="${y + r}" r="${r}" fill="${MINT}" fill-opacity="0.18"/>
   <circle cx="${x + r}" cy="${y + r}" r="${r}" fill="none" stroke="${MINT}" stroke-opacity="0.5" stroke-width="3"/>
   <g transform="translate(${x + r - 48} ${y + r - 48}) scale(4)" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ''}</g>`;

// One full wave per slide width, so it runs on from one slide to the next as you swipe.
const WAVE_Y = H - 200;
const wave = `<path d="M0 ${WAVE_Y} C${W * 0.18} ${WAVE_Y - 60} ${W * 0.32} ${WAVE_Y - 60} ${W / 2} ${WAVE_Y} S${W * 0.82} ${WAVE_Y + 60} ${W} ${WAVE_Y}" fill="none" stroke="${MINT}" stroke-opacity="0.45" stroke-width="5"/>`;

const dots = (x, y) =>
  Array.from(
    { length: 20 },
    (_, k) => `<circle cx="${x + (k % 5) * 34}" cy="${y + Math.floor(k / 5) * 34}" r="4.5"/>`
  ).join('');

/** Slide position as dots, the current one stretched into a pill. */
const progress = (i, total) => {
  let x = W - PAD - (total - 1) * 26 - 48;
  return Array.from({ length: total }, (_, k) => {
    const w = k === i ? 48 : 14;
    const dot = `<rect x="${x}" y="${H - 85}" width="${w}" height="14" rx="7" fill="#fff" fill-opacity="${k === i ? 1 : 0.35}"/>`;
    x += w + 12;
    return dot;
  }).join('');
};

/** Text slides alternating navy and teal, with an icon, background shapes and an "n / total" counter. */
async function carousel({ name, slides }) {
  for (const [i, slide] of slides.entries()) {
    const big = i > 0 && slide.title.length < 20;
    const titleLines = wrap(slide.title, big ? 14 : 18);
    const size = big ? 110 : 84;
    // Centre kicker, title and text as one block between the icon and the wave.
    const textLines = wrap(slide.text, 38);
    const buttonH = slide.button ? 130 : 0;
    const blockH = 40 + titleLines.length * size * 1.15 + 40 + textLines.length * 56 + buttonH;
    const top = 330 + (WAVE_Y - 60 - 330 - blockH) / 2;
    const textY = top + size + titleLines.length * size * 1.15 + 40;
    const counter = `${i + 1} / ${slides.length}`;
    // The big circles alternate corners so neighbouring slides don't look the same.
    const [cx, cy] = i % 2 ? [W - 60, 200] : [W + 40, H - 380];
    const overlay = svg(
      `<circle cx="${cx}" cy="${cy}" r="300" fill="#fff" fill-opacity="0.05"/>
       <circle cx="${cx}" cy="${cy}" r="400" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-width="3"/>
       <g fill="#fff" fill-opacity="0.16">${dots(W - PAD - 136, i % 2 ? H - 420 : 190)}</g>` +
        wave +
        badge(slide.icon, PAD, 110) +
        `<rect x="${W - PAD - 130}" y="70" width="130" height="56" rx="28" fill="#fff" opacity="0.18"/>
       <text x="${W - PAD - 65}" y="108" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="700" fill="#fff">${counter}</text>` +
        kicker(PAD, top - 40, slide.kicker) +
        lines(titleLines, PAD, top + size, { size, weight: 800, gap: 1.15 }) +
        lines(textLines, PAD, textY, {
          size: 40,
          weight: 400,
          fill: '#e2e8f0',
          gap: 1.4,
        }) +
        (slide.button
          ? `<rect x="${PAD}" y="${textY + textLines.length * 56 + 20}" width="300" height="88" rx="44" fill="${CORAL}"/>
             <text x="${PAD + 150}" y="${textY + textLines.length * 56 + 76}" text-anchor="middle" font-family="${FONT}" font-size="36" font-weight="800" fill="#fff">${esc(slide.button)}</text>`
          : '') +
        progress(i, slides.length) +
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
