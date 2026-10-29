// Builds a 9:16 transformation Reel (MP4) from one before/after photo pair.
//
//   node scripts/make-transformation-reel.mjs --before b.jpg --after a.jpg \
//     --procedure "Clear aligners" --hook "12 months of aligners" \
//     [--brand "@yourpractice"] [--cta "Book your free consultation"] \
//     [--music track.mp3] [--name aligners-reel]
//
// Timeline (~14.5 s): hook over the before photo → slider wipe to the after
// → before/after stacked → end card. The procedure name and "Results may
// vary" stay on screen throughout, as many state rules expect.
// Writes public/videos/<name>.mp4 and src/assets/images/reels/<name>-poster.jpg.
// Needs ffmpeg on the PATH.

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import {
  W,
  H,
  FPS,
  TEAL,
  NAVY,
  SLATE,
  esc,
  wrap,
  overlay,
  pill,
  highlightLines,
  textLines,
  rounded,
  blurredBackground,
  assemble,
} from './lib/reel-kit.mjs';

const { values: args } = parseArgs({
  options: {
    before: { type: 'string' },
    after: { type: 'string' },
    procedure: { type: 'string' },
    hook: { type: 'string', default: 'Wait for the after…' },
    brand: { type: 'string', default: '@yourpractice' },
    cta: { type: 'string', default: 'Book your free consultation' },
    music: { type: 'string' },
    name: { type: 'string', default: 'transformation-reel' },
  },
});
if (!args.before || !args.after || !args.procedure) {
  console.error('Usage: --before <img> --after <img> --procedure "<name>" [--hook ...] [--brand ...] [--music ...]');
  process.exit(1);
}

const caption = (y) =>
  textLines([args.procedure], y, { size: 40 }) +
  textLines([`Results may vary · ${args.brand}`], y + 54, { size: 30, weight: 400, fill: '#ffffffcc' });

const tmp = mkdtempSync(join(tmpdir(), 'reel-'));
const frame = (name) => join(tmp, `${name}.png`);

// 1) Before (with hook) and 2) after: photo as a large square card.
const CARD = 1000;
const CARD_Y = 520;
for (const [name, file, label, fill, withHook] of [
  ['before', args.before, 'BEFORE', SLATE, true],
  ['after', args.after, 'AFTER', TEAL, false],
]) {
  await sharp(await blurredBackground(file))
    .composite([
      { input: await rounded(file, CARD, CARD), left: (W - CARD) / 2, top: CARD_Y },
      {
        input: overlay(
          (withHook ? highlightLines(wrap(args.hook, 18), 170) : '') +
            pill(80, CARD_Y + 40, label, fill) +
            caption(CARD_Y + CARD + 110)
        ),
        left: 0,
        top: 0,
      },
    ])
    .toFile(frame(name));
}

// 3) Before and after stacked.
const SW = 1000;
const SH = 700;
await sharp(await blurredBackground(args.after))
  .composite([
    { input: await rounded(args.before, SW, SH), left: (W - SW) / 2, top: 180 },
    { input: await rounded(args.after, SW, SH), left: (W - SW) / 2, top: 180 + SH + 24 },
    {
      input: overlay(
        pill(80, 220, 'BEFORE', SLATE) + pill(80, 220 + SH + 24, 'AFTER', TEAL) + caption(180 + 2 * SH + 120)
      ),
      left: 0,
      top: 0,
    },
  ])
  .toFile(frame('split'));

// 4) End card.
const ctaLines = wrap(args.cta, 20);
await sharp({ create: { width: W, height: H, channels: 3, background: NAVY } })
  .composite([
    {
      input: overlay(`
        <rect x="${W / 2 - 90}" y="560" width="180" height="180" rx="44" fill="${TEAL}"/>
        <path d="M${W / 2 - 45} 610h38v80h-38z" fill="#fff" opacity="0.55"/>
        <path d="M${W / 2 + 7} 610h38v80h-38z" fill="#fff"/>
        ${textLines(ctaLines, 870, { size: 68, weight: 800, gap: 1.24 })}
        ${textLines([args.brand], 900 + ctaLines.length * 84, { size: 40, weight: 400, fill: '#a9c7cf' })}
        <text x="${W / 2}" y="1720" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#ffffff99">${esc(args.procedure)} · Results may vary. Individual results differ.</text>`),
      left: 0,
      top: 0,
    },
  ])
  .toFile(frame('end'));

// Before and after both sit at exactly HOLD zoom while the wipe runs, so the
// two photos line up at the slider line.
const WIPE_AT = 3;
const HOLD = 1.03;
const out = `public/videos/${args.name}.mp4`;
assemble({
  scenes: [
    { file: frame('before'), duration: 4, zoom: `1+${HOLD - 1}*min(on,${WIPE_AT * FPS})/${WIPE_AT * FPS}` },
    { file: frame('after'), duration: 5, zoom: `${HOLD}+0.03*max(on-${FPS},0)/${4 * FPS}` },
    { file: frame('split'), duration: 4 },
    { file: frame('end'), duration: 3.5 },
  ],
  transitions: [
    { type: 'wiperight', duration: 1, line: true },
    { type: 'fade', duration: 0.5 },
    { type: 'fade', duration: 0.5 },
  ],
  out,
  music: args.music,
});

// Poster for the site card: the stacked before/after frame.
mkdirSync('src/assets/images/reels', { recursive: true });
await sharp(frame('split'))
  .resize(720, 1280)
  .jpeg({ quality: 82 })
  .toFile(`src/assets/images/reels/${args.name}-poster.jpg`);

rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${out} and src/assets/images/reels/${args.name}-poster.jpg`);
