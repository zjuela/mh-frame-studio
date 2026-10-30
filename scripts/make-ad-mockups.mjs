// Builds still mock-ups of a Meta ad: the first frame of each hook variant
// (9:16, for Reels and Stories) and the 4:5 feed version shown inside a
// Facebook-style feed post. They preview an ad before it's filmed or cut.
//
//   node scripts/make-ad-mockups.mjs scripts/ads/aligner-consult.json
//
// Hook styles: "talking" (speaker on camera with the hook as a title),
// "reply" (answering a viewer's comment) and "broll" (opens on another shot).
// Each hook names its photo (from src/assets/images/demo/), where to centre
// the 9:16 crop (`focusX`, 0–1), an optional caption of the first spoken line
// (*starred* words are highlighted) and optional `titleY` / `captionY`.
// Text is kept inside the Reels safe zone; the script warns if it isn't.
// Writes src/assets/images/ads/<name>-hook-<n>.jpg and <name>-feed.jpg.

import { mkdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { W, H, TEAL, NAVY, CORAL, FONT, esc, wrap, overlay } from './lib/reel-kit.mjs';

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
    <stop offset="0" stop-color="#000" stop-opacity="0.25"/>
    <stop offset="0.4" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>`;

// Reels and Stories cover the top 14% and bottom 35% of the frame with the
// app's own controls, so hook text stays between these lines.
const SAFE_TOP = Math.round(H * 0.14);
const SAFE_BOTTOM = Math.round(H * 0.65);
// Darker than the brand coral so white text on it passes 4.5:1.
const HOOK_RED = '#c8442f';
const HIGHLIGHT = '#fcd34d';

/** Rendered width of one line of text, measured by sharp's text renderer. */
const textWidth = async (text, size, weight = 'Bold') => {
  const { width } = await sharp({
    text: { text: esc(text.replace(/\*/g, '')), font: `Helvetica ${weight} ${size}`, dpi: 72 },
  }).metadata();
  return width;
};

/**
 * Wraps text and keeps *starred* highlights intact across line breaks: a
 * highlight that runs onto the next line is closed and reopened.
 */
const wrapMarked = (text, max) => {
  let open = false;
  return wrap(text, max).map((line) => {
    const out = (open ? '*' : '') + line;
    open = (out.match(/\*/g) ?? []).length % 2 === 1;
    return open ? out + '*' : out;
  });
};

/** Text with *starred* words picked out in the highlight colour. */
const marked = (line) =>
  line
    .split(/(\*[^*]+\*)/)
    .map((part) => (part.startsWith('*') ? `<tspan fill="${HIGHLIGHT}">${esc(part.slice(1, -1))}</tspan>` : esc(part)))
    .join('');

/** Centred lines, each on its own rounded box sized to the text. */
const boxedLines = async (lines, y, { size, fill, opacity = 1, weight = 800, padX, lineGap }) => {
  const boxH = Math.round(size * 1.5);
  let svg = '';
  for (const [i, line] of lines.entries()) {
    const w = (await textWidth(line, size, weight === 800 ? 'Heavy' : 'Bold')) + 2 * padX;
    const top = y + i * (boxH + lineGap);
    svg += `<rect x="${(W - w) / 2}" y="${top}" width="${w}" height="${boxH}" rx="${size * 0.28}" fill="${fill}" fill-opacity="${opacity}"/>
      <text x="${W / 2}" y="${top + boxH * 0.69}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="#fff">${marked(line)}</text>`;
  }
  return { svg, bottom: y + lines.length * (boxH + lineGap) - lineGap };
};

/** The hook as a bold title, one coloured bar per line (two lines at most). */
const hookTitle = (text, y, fill) => boxedLines(wrap(text, 22), y, { size: 66, fill, padX: 30, lineGap: 6 });

/** Burned-in caption of the first spoken line: white on a dark translucent box. */
const caption = (text, y) =>
  boxedLines(wrapMarked(text, 28), y, { size: 48, fill: '#0f172a', opacity: 0.78, weight: 700, padX: 26, lineGap: 8 });

/** A viewer's comment pinned on screen, as in a "reply to comment" video. */
const replyBubble = async (from, text, y) => {
  const label = `Reply to ${from}'s comment`;
  const w = Math.max(await textWidth(label, 32, 'Regular'), await textWidth(text, 54)) + 140;
  const x = (W - w) / 2;
  const svg = `<rect x="${x}" y="${y}" width="${w}" height="170" rx="28" fill="#fff"/>
    <circle cx="${x + 54}" cy="${y + 52}" r="22" fill="${CORAL}"/>
    <text x="${x + 92}" y="${y + 63}" font-family="${FONT}" font-size="32" fill="#64748b">${esc(label)}</text>
    <text x="${x + 40}" y="${y + 135}" font-family="${FONT}" font-size="54" font-weight="800" fill="${NAVY}">${esc(text)}</text>`;
  return { svg, bottom: y + 170 };
};

/** A landscape photo cropped to 9:16 around a horizontal focus point (0–1). */
const portraitCrop = async (file, focusX = 0.5) => {
  const resized = await sharp(file).resize({ height: H }).toBuffer({ resolveWithObject: true });
  const left = Math.round(Math.min(Math.max(focusX * resized.info.width - W / 2, 0), resized.info.width - W));
  return sharp(resized.data).extract({ left, top: 0, width: W, height: H }).png().toBuffer();
};

for (const [i, hook] of ad.hooks.entries()) {
  const parts = [];
  if (hook.style === 'reply') parts.push(await replyBubble(hook.from, hook.text, hook.titleY ?? SAFE_TOP + 20));
  else parts.push(await hookTitle(hook.text, hook.titleY ?? 800, hook.style === 'broll' ? TEAL : HOOK_RED));
  if (hook.caption) parts.push(await caption(hook.caption, hook.captionY ?? 1085));
  const tops = [hook.titleY ?? (hook.style === 'reply' ? SAFE_TOP + 20 : 800), hook.captionY ?? 1085];
  if (Math.min(...tops) < SAFE_TOP || Math.max(...parts.map((p) => p.bottom)) > SAFE_BOTTOM)
    console.warn(`Hook ${i + 1}: text reaches outside the Reels safe zone (${SAFE_TOP}–${SAFE_BOTTOM}px).`);
  await sharp(await portraitCrop(photo(hook.image), hook.focusX))
    .composite([{ input: overlay(shade + parts.map((p) => p.svg).join('')), left: 0, top: 0 }])
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
