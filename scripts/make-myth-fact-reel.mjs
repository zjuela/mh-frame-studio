// Builds a 9:16 "Myth vs Fact" educational Reel (MP4) from a small JSON file.
//
//   node scripts/make-myth-fact-reel.mjs scripts/reels/myth-fact.json [--music track.mp3]
//
// The JSON holds the hook, the myths with their facts and a photo for each
// (see scripts/reels/myth-fact.json). A myth's optional "crop" (e.g. "centre")
// overrides the automatic crop of its photo. Write each myth on two lines split
// by "\n"; `*word*` marks the keyword, on a coral bar in the myth and in teal in
// the fact. A "\n" in a fact sets its line breaks. Timeline: hook over a dentist photo →
// for each myth, a MYTH card on the darkened photo slides over to a FACT card
// on the full-colour photo → end card with a general-information note.
// Writes public/videos/<name>.mp4 and src/assets/images/reels/<name>-poster.jpg.
// Needs ffmpeg on the PATH.

import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import {
  W,
  H,
  TEAL,
  NAVY,
  CORAL,
  FONT,
  esc,
  titleCase,
  wrap,
  overlay,
  fitPill,
  fitHighlightLines,
  textWidth,
  textLines,
  fullBleed,
  assemble,
} from './lib/reel-kit.mjs';

const {
  values: { music },
  positionals: [configFile],
} = parseArgs({ allowPositionals: true, options: { music: { type: 'string' } } });
if (!configFile) {
  console.error('Usage: node scripts/make-myth-fact-reel.mjs <config.json> [--music track.mp3]');
  process.exit(1);
}
const config = JSON.parse(readFileSync(configFile, 'utf8'));
const { name, hook, hookImage, brand, cta, myths } = config;

const tmp = mkdtempSync(join(tmpdir(), 'reel-'));
const frame = (n) => join(tmp, `${n}.png`);

// Darkens the lower part of the frame so white text stays readable.
const shade = (from = 0.15, to = 0.85) => `
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="${from}"/>
    <stop offset="1" stop-color="#000" stop-opacity="${to}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>`;

const counter = (i) =>
  `<text x="${W - 80}" y="140" text-anchor="end" font-family="${FONT}" font-size="40" font-weight="700" fill="#ffffffcc">${i + 1}/${myths.length}</text>`;

// Keeps a `*keyword*` that wraps onto the next line marked on both lines.
const carryMarks = (lines) => {
  let open = false;
  return lines.map((line) => {
    const out = (open ? '*' : '') + line;
    open = (out.match(/\*/g) ?? []).length % 2 === 1;
    return open ? out + '*' : out;
  });
};
const parts = (line) => line.split(/(\*[^*]+\*)/).filter(Boolean);
const plain = (line) => line.replace(/\*/g, '');

/** A centred myth line, with a coral bar behind its `*keyword*`. */
const MYTH_SIZE = 80;
const mythLine = async (line, y) => {
  const x = (W - (await textWidth(plain(line), MYTH_SIZE))) / 2;
  let bar = '';
  const marked = line.match(/^(.*?)\*([^*]+)\*/);
  if (marked) {
    const [, before, keyword] = marked;
    const end = await textWidth(before + keyword, MYTH_SIZE);
    const kw = await textWidth(keyword, MYTH_SIZE);
    const pad = 18;
    bar = `<rect x="${x + end - kw - pad}" y="${y - MYTH_SIZE * 0.98}" width="${kw + 2 * pad}" height="${MYTH_SIZE * 1.3}" rx="16" fill="${CORAL}"/>`;
  }
  return (
    bar +
    `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${MYTH_SIZE}" font-weight="800" fill="#fff">${parts(line)
      .map((part) => esc(plain(part)))
      .join('')}</text>`
  );
};

const scene = async (n, photo, svg) =>
  sharp(photo)
    .composite([{ input: overlay(svg), left: 0, top: 0 }])
    .toFile(frame(n));

// Hook.
await scene(
  'hook',
  await fullBleed(hookImage),
  shade(0.05, 0.75) +
    (await fitPill(80, 120, 'MYTH OR FACT?', CORAL, 40)) +
    (await fitHighlightLines(wrap(titleCase(hook), 18), 1240, { size: 72, fill: TEAL }))
);

// Myths and facts.
for (const [i, { myth, fact, image, crop }] of myths.entries()) {
  const position = crop ? { position: crop } : {};
  const mythLines = myth.split('\n');
  await scene(
    `myth${i}`,
    await fullBleed(image, { brightness: 0.45, saturation: 0.15, ...position }),
    shade(0.2, 0.6) +
      counter(i) +
      `<g transform="rotate(-8 ${W / 2} 640)">
        <rect x="${W / 2 - 230}" y="560" width="460" height="170" rx="20" fill="none" stroke="${CORAL}" stroke-width="12"/>
        <text x="${W / 2}" y="690" text-anchor="middle" font-family="${FONT}" font-size="128" font-weight="900" letter-spacing="8" fill="${CORAL}">MYTH</text>
      </g>` +
      (await Promise.all(mythLines.map((line, j) => mythLine(line, 960 + j * MYTH_SIZE * 1.45)))).join('')
  );

  const factLines = fact.includes('\n') ? fact.split('\n') : carryMarks(wrap(fact, 26));
  const cardH = factLines.length * 72 + 100;
  const cardY = 1200;
  await scene(
    `fact${i}`,
    await fullBleed(image, position),
    shade(0.1, 0.7) +
      counter(i) +
      (await fitPill(80, cardY - 130, 'FACT', TEAL, 56)) +
      `<rect x="70" y="${cardY}" width="${W - 140}" height="${cardH}" rx="36" fill="#ffffff" fill-opacity="0.95"/>` +
      factLines
        .map(
          (line, j) =>
            `<text x="120" y="${cardY + 98 + j * 72}" font-family="${FONT}" font-size="56" font-weight="700" fill="${NAVY}">${parts(
              line
            )
              .map((part) =>
                part.startsWith('*') ? `<tspan fill="${TEAL}" font-weight="800">${esc(plain(part))}</tspan>` : esc(part)
              )
              .join('')}</text>`
        )
        .join('')
  );
}

// End card.
const ctaLines = wrap(cta, 20);
await scene(
  'end',
  await sharp({ create: { width: W, height: H, channels: 3, background: NAVY } })
    .png()
    .toBuffer(),
  `<rect x="${W / 2 - 90}" y="560" width="180" height="180" rx="44" fill="${TEAL}"/>
   <path d="M${W / 2 - 45} 610h38v80h-38z" fill="#fff" opacity="0.55"/>
   <path d="M${W / 2 + 7} 610h38v80h-38z" fill="#fff"/>` +
    textLines(ctaLines, 870, { size: 68, weight: 800, gap: 1.24 }) +
    textLines([brand], 900 + ctaLines.length * 84, { size: 40, weight: 400, fill: '#a9c7cf' }) +
    textLines(['General information, not medical advice.'], 1720, { size: 28, weight: 400, fill: '#ffffff99' })
);

const out = `public/videos/${name}.mp4`;
const total = assemble({
  scenes: [
    { file: frame('hook'), duration: 3 },
    ...myths.flatMap((_, i) => [
      { file: frame(`myth${i}`), duration: 2.5 },
      { file: frame(`fact${i}`), duration: 4 },
    ]),
    { file: frame('end'), duration: 3.5 },
  ],
  transitions: [
    { type: 'fade', duration: 0.4 },
    ...myths.flatMap((_, i) => [
      { type: 'slideleft', duration: 0.4 },
      { type: 'fade', duration: i === myths.length - 1 ? 0.5 : 0.4 },
    ]),
  ],
  out,
  music,
});

// Poster for the site card: the hook photo without text (the card adds its own).
mkdirSync('src/assets/images/reels', { recursive: true });
await sharp(await fullBleed(hookImage))
  .resize(720, 1280)
  .jpeg({ quality: 82 })
  .toFile(`src/assets/images/reels/${name}-poster.jpg`);

rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${out} (${total}s) and src/assets/images/reels/${name}-poster.jpg`);
