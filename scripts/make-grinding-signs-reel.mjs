// Builds a 9:16 "3 signs you grind your teeth" educational Reel (MP4) from
// short video clips, with the text laid over each clip.
//
//   node scripts/make-grinding-signs-reel.mjs scripts/reels/grinding-signs.json [--music track.mp3]
//
// The JSON holds the hook, the signs, the fix and the clip for each, with how
// many seconds of it to use (see scripts/reels/grinding-signs.json). Clips are
// 1080×1920 and at least that long; they play from their start. Timeline: hook →
// one clip per sign with a SIGN n/3 tag, headline and caption → the fix → end
// card with a general-information note.
// Writes public/videos/<name>.mp4 and src/assets/images/reels/<name>-poster.jpg.
// Needs ffmpeg on the PATH.

import { execFileSync } from 'node:child_process';
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
  wrap,
  overlay,
  pill,
  highlightLines,
  textWidth,
  textLines,
  assemble,
} from './lib/reel-kit.mjs';

const {
  values: { music },
  positionals: [configFile],
} = parseArgs({ allowPositionals: true, options: { music: { type: 'string' } } });
if (!configFile) {
  console.error('Usage: node scripts/make-grinding-signs-reel.mjs <config.json> [--music track.mp3]');
  process.exit(1);
}
const { name, brand, hook, signs, fix, cta } = JSON.parse(readFileSync(configFile, 'utf8'));

const tmp = mkdtempSync(join(tmpdir(), 'reel-'));
const frame = (n) => join(tmp, `${n}.png`);

// Clear over the faces, darkening through the lower part where the text sits.
const shade = `
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.2"/>
    <stop offset="0.12" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.7" stop-color="#000" stop-opacity="0.65"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.85"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>`;

const transparent = () => sharp({ create: { width: W, height: H, channels: 4, background: '#0000' } });
const layer = (n, svg) =>
  transparent()
    .composite([{ input: overlay(svg), left: 0, top: 0 }])
    .png()
    .toFile(frame(n));

// Tag, headline and caption stacked up from just above the Reels caption area.
const BOTTOM = 1520;
const TAG_SIZE = 36;
const tagPill = async (x, y, tag, colour) =>
  pill(x, y, tag, colour, TAG_SIZE, await textWidth(tag, TAG_SIZE, { spacing: 2 }));

const card = async (tag, colour, headline, caption) => {
  const capLines = wrap(caption, 40);
  const headLines = wrap(headline, 20);
  const capY = BOTTOM - (capLines.length - 1) * 54;
  const headY = capY - 90 - (headLines.length - 1) * 88;
  return (
    shade +
    (await tagPill(70, headY - 160, tag, colour)) +
    headLines
      .map(
        (line, i) =>
          `<text x="70" y="${headY + i * 88}" font-family="${FONT}" font-size="74" font-weight="800" fill="#fff">${esc(line)}</text>`
      )
      .join('') +
    capLines
      .map(
        (line, i) =>
          `<text x="70" y="${capY + i * 54}" font-family="${FONT}" font-size="42" font-weight="500" fill="#fcd34d">${esc(line)}</text>`
      )
      .join('')
  );
};

// Hook: a coral tag over the title on teal bars.
const HOOK_SIZE = 66;
const hookLines = wrap(hook.text, 22);
await layer(
  'hook',
  shade +
    (await tagPill(70, 300, hook.tag, CORAL)) +
    highlightLines(hookLines, 1180, {
      size: HOOK_SIZE,
      fill: TEAL,
      widths: await Promise.all(hookLines.map((line) => textWidth(line, HOOK_SIZE))),
    })
);
for (const [i, sign] of signs.entries())
  await layer(`sign${i}`, await card(`SIGN ${i + 1}/${signs.length}`, CORAL, sign.headline, sign.caption));
await layer('fix', await card(fix.tag, TEAL, fix.headline, fix.caption));

// End card.
const ctaLines = wrap(cta, 16);
await sharp({ create: { width: W, height: H, channels: 3, background: NAVY } })
  .composite([
    {
      input: overlay(
        `<rect x="${W / 2 - 90}" y="560" width="180" height="180" rx="44" fill="${TEAL}"/>
         <rect x="${W / 2 - 40}" y="610" width="80" height="70" rx="10" fill="none" stroke="#fff" stroke-width="10"/>
         <path d="M${W / 2 - 40} 632h80M${W / 2 - 22} 598v24M${W / 2 + 22} 598v24" stroke="#fff" stroke-width="10" stroke-linecap="round"/>` +
          textLines(ctaLines, 870, { size: 68, weight: 800, gap: 1.24 }) +
          textLines([brand], 900 + ctaLines.length * 84, { size: 40, weight: 400, fill: '#a9c7cf' }) +
          textLines(['General information, not medical advice.', 'See your dentist about any symptoms.'], 1700, {
            size: 28,
            weight: 400,
            fill: '#ffffff99',
          })
      ),
      left: 0,
      top: 0,
    },
  ])
  .png()
  .toFile(frame('end'));

const END_SECONDS = 3.5;
const out = `public/videos/${name}.mp4`;
const total = assemble({
  scenes: [
    { file: hook.clip, duration: hook.duration, video: true, overlay: frame('hook') },
    ...signs.map((sign, i) => ({ file: sign.clip, duration: sign.duration, video: true, overlay: frame(`sign${i}`) })),
    { file: fix.clip, duration: fix.duration, video: true, overlay: frame('fix') },
    { file: frame('end'), duration: END_SECONDS, zoom: '1' },
  ],
  transitions: [
    ...signs.map(() => ({ type: 'fade', duration: 0.4 })),
    { type: 'fade', duration: 0.4 },
    { type: 'fade', duration: 0.5 },
  ],
  out,
  music,
});

// Poster for the site card: the hook clip's first frame without text (the card adds its own).
mkdirSync('src/assets/images/reels', { recursive: true });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', hook.clip, '-frames:v', '1', frame('poster')]);
await sharp(frame('poster'))
  .resize(720, 1280)
  .jpeg({ quality: 82 })
  .toFile(`src/assets/images/reels/${name}-poster.jpg`);

rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${out} (${total}s) and src/assets/images/reels/${name}-poster.jpg`);
