// Builds still mock-ups of a Meta ad: the first frame of each hook variant
// (9:16, for Reels and Stories) and the 4:5 feed version shown inside a
// Facebook-style feed post. They preview an ad before it's filmed or cut.
//
//   node scripts/make-ad-mockups.mjs scripts/ads/aligner-consult.json
//
// Hook styles: "talking" (speaker on camera with the hook as a title),
// "reply" (answering a viewer's comment) and "broll" (opens on another shot).
// Photos come from src/assets/images/demo/.
// Writes src/assets/images/ads/<name>-hook-<n>.jpg and <name>-feed.jpg.

import { mkdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { W, H, TEAL, NAVY, CORAL, FONT, esc, wrap, overlay, highlightLines, fullBleed } from './lib/reel-kit.mjs';

const {
  positionals: [configFile],
} = parseArgs({ allowPositionals: true });
if (!configFile) {
  console.error('Usage: node scripts/make-ad-mockups.mjs <config.json>');
  process.exit(1);
}
const ad = JSON.parse(readFileSync(configFile, 'utf8'));
const photo = (file) => `src/assets/images/demo/${file}`;
const outDir = 'src/assets/images/ads';
mkdirSync(outDir, { recursive: true });

const shade = `
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.35"/>
    <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>`;

/** Burned-in caption, styled like auto-captions on Reels. */
const subtitle = (line, y) =>
  wrap(line, 24)
    .map(
      (l, i) =>
        `<text x="${W / 2}" y="${y + i * 72}" text-anchor="middle" font-family="${FONT}" font-size="56" font-weight="800" fill="#fff" stroke="#000" stroke-width="10" stroke-linejoin="round" paint-order="stroke">${esc(l)}</text>`
    )
    .join('');

/** A viewer's comment pinned on screen, as in a "reply to comment" video. */
const replyBubble = (from, text, y) => {
  const lines = wrap(text, 22);
  const h = 120 + lines.length * 64;
  return `<rect x="110" y="${y}" width="${W - 220}" height="${h}" rx="28" fill="#fff"/>
    <circle cx="170" cy="${y + 62}" r="26" fill="${CORAL}"/>
    <text x="216" y="${y + 74}" font-family="${FONT}" font-size="34" fill="#64748b">Reply to ${esc(from)}'s comment</text>
    ${lines.map((l, i) => `<text x="150" y="${y + 160 + i * 64}" font-family="${FONT}" font-size="54" font-weight="800" fill="${NAVY}">${esc(l)}</text>`).join('')}`;
};

for (const [i, hook] of ad.hooks.entries()) {
  const file = photo(hook.style === 'broll' ? hook.image : ad.speaker);
  let svg = shade;
  if (hook.style === 'reply') svg += replyBubble(hook.from, hook.text, 800);
  else svg += highlightLines(wrap(hook.text, 18), 800, { size: 72, fill: hook.style === 'broll' ? TEAL : CORAL });
  // The talking-head hooks show the speaker's first line as a caption.
  if (hook.style !== 'broll') svg += subtitle(ad.firstLine, 1290);
  await sharp(await fullBleed(file))
    .composite([{ input: overlay(svg), left: 0, top: 0 }])
    .jpeg({ quality: 84 })
    .toFile(`${outDir}/${ad.name}-hook-${i + 1}.jpg`);
}

// Feed version: the 4:5 creative inside a feed post, on a 9:16 canvas so it
// sits alongside the other cards.
const { feed } = ad;
const CW = 920;
const CH = (CW * 5) / 4;
const creative = await sharp(photo(feed.image))
  .resize(CW, CH, { fit: 'cover', position: sharp.strategy.attention })
  .composite([
    {
      input: Buffer.from(`<svg width="${CW}" height="${CH}" xmlns="http://www.w3.org/2000/svg">
        <rect y="${CH - 260}" width="${CW}" height="260" fill="${NAVY}" fill-opacity="0.92"/>
        <text x="48" y="${CH - 160}" font-family="${FONT}" font-size="64" font-weight="800" fill="#fff">${esc(feed.overlay)}</text>
        <text x="48" y="${CH - 90}" font-family="${FONT}" font-size="36" fill="#a9c7cf">${esc(feed.sub)}</text>
        <text x="48" y="${CH - 36}" font-family="${FONT}" font-size="22" fill="#ffffffaa">${esc(ad.disclaimer)}</text>
      </svg>`),
      left: 0,
      top: 0,
    },
  ])
  .png()
  .toBuffer();

const X = (W - CW) / 2;
const top = 120;
const textLines = wrap(feed.primaryText, 44);
const imgY = top + 130 + textLines.length * 44 + 20;
const barY = imgY + CH;
const post = `
  <rect x="${X}" y="${top}" width="${CW}" height="${barY + 150 - top}" rx="24" fill="#fff"/>
  <circle cx="${X + 60}" cy="${top + 62}" r="34" fill="${TEAL}"/>
  <text x="${X + 112}" y="${top + 56}" font-family="${FONT}" font-size="32" font-weight="700" fill="#111">${esc(ad.page)}</text>
  <text x="${X + 112}" y="${top + 94}" font-family="${FONT}" font-size="26" fill="#65676b">Sponsored</text>
  ${textLines.map((l, j) => `<text x="${X + 28}" y="${top + 160 + j * 44}" font-family="${FONT}" font-size="32" fill="#111">${esc(l)}</text>`).join('')}
  <rect x="${X}" y="${barY}" width="${CW}" height="150" fill="#f0f2f5"/>
  <text x="${X + 28}" y="${barY + 52}" font-family="${FONT}" font-size="24" fill="#65676b">${esc(ad.website.toUpperCase())}</text>
  <text x="${X + 28}" y="${barY + 100}" font-family="${FONT}" font-size="34" font-weight="700" fill="#111">${esc(feed.headline)}</text>
  <rect x="${X + CW - 230}" y="${barY + 42}" width="200" height="72" rx="12" fill="#e4e6eb"/>
  <text x="${X + CW - 130}" y="${barY + 89}" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="700" fill="#111">${esc(feed.cta)}</text>`;

await sharp({ create: { width: W, height: H, channels: 3, background: '#e4e8ee' } })
  .composite([
    { input: overlay(post), left: 0, top: 0 },
    { input: creative, left: X, top: imgY },
  ])
  .jpeg({ quality: 84 })
  .toFile(`${outDir}/${ad.name}-feed.jpg`);

console.log(`Wrote ${ad.hooks.length} hook frames and the feed mock-up to ${outDir}/`);
