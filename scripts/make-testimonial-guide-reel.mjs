// Builds a 9:16 "how to film a patient testimonial" guide Reel (MP4) for
// clients: one still per clip showing the camera position and framing, with
// the question to ask the patient as a subtitle. The stills don't move.
//
//   node scripts/make-testimonial-guide-reel.mjs scripts/reels/testimonial-guide.json [--music track.mp3]
//
// The JSON holds the setup checklist and the clips (see
// scripts/reels/testimonial-guide.json). Each clip names its photo and the
// crop (`focusX` / `focusY`, 0–1, and `zoom` to crop tighter than the full
// height). A photo that doesn't exist yet is replaced by `placeholder`.
// `prompts` and each clip's `prompt` are the image prompts for generating the
// photos; the script doesn't use them. Timeline: setup card → one still per
// clip with fades between → end card, fitted to `length` seconds.
// Writes public/videos/<name>.mp4 and src/assets/images/reels/<name>-poster.jpg.
// Needs ffmpeg on the PATH.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
  textLines,
  assemble,
} from './lib/reel-kit.mjs';

const {
  values: { music },
  positionals: [configFile],
} = parseArgs({ allowPositionals: true, options: { music: { type: 'string' } } });
if (!configFile) {
  console.error('Usage: node scripts/make-testimonial-guide-reel.mjs <config.json> [--music track.mp3]');
  process.exit(1);
}
const { name, title, brand, length, placeholder, setup, clips, cta } = JSON.parse(readFileSync(configFile, 'utf8'));

const missing = new Set();
const photo = (file) => {
  if (existsSync(file)) return file;
  missing.add(file);
  return placeholder;
};

const tmp = mkdtempSync(join(tmpdir(), 'reel-'));
const frame = (n) => join(tmp, `${n}.png`);

// Below the Reels controls at the top of the frame.
const SAFE_TOP = Math.round(H * 0.14);

/** The photo cropped to 9:16 around a focus point; `zoom` > 1 crops tighter. */
const crop = async (file, { focusX = 0.5, focusY = 0.5, zoom = 1, brightness = 1 } = {}) => {
  const { data, info } = await sharp(file)
    .resize(Math.round(W * zoom), Math.round(H * zoom), { fit: 'outside' })
    .toBuffer({ resolveWithObject: true });
  const clamp = (v, max) => Math.round(Math.min(Math.max(v, 0), max));
  return sharp(data)
    .extract({
      left: clamp(focusX * info.width - W / 2, info.width - W),
      top: clamp(focusY * info.height - H / 2, info.height - H),
      width: W,
      height: H,
    })
    .modulate({ brightness })
    .png()
    .toBuffer();
};

// Clear over the face, darkening through the bottom third where the text sits.
const shade = `
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.25"/>
    <stop offset="0.15" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.75" stop-color="#000" stop-opacity="0.6"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.85"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>`;

// Rule-of-thirds guide, as on a camera's grid overlay.
const grid = [1, 2]
  .map(
    (
      k
    ) => `<line x1="${(W * k) / 3}" y1="0" x2="${(W * k) / 3}" y2="${H}" stroke="#fff" stroke-opacity="0.22" stroke-width="2"/>
    <line x1="0" y1="${(H * k) / 3}" x2="${W}" y2="${(H * k) / 3}" stroke="#fff" stroke-opacity="0.22" stroke-width="2"/>`
  )
  .join('');

const scene = async (n, photo, svg) =>
  sharp(photo)
    .composite([{ input: overlay(svg), left: 0, top: 0 }])
    .toFile(frame(n));

// Setup card: the checklist over the first clip's photo, below the title.
const titleLines = wrap(titleCase(title), 18);
const listY = SAFE_TOP + 200 + titleLines.length * 92 + 60;
await scene(
  'setup',
  await crop(photo(clips[0].image), { ...clips[0], brightness: 0.4 }),
  (await fitPill(70, SAFE_TOP, 'BEFORE YOU RECORD', CORAL, 36)) +
    titleLines
      .map(
        (line, i) =>
          `<text x="70" y="${SAFE_TOP + 200 + i * 92}" font-family="${FONT}" font-size="76" font-weight="800" fill="#fff">${esc(line)}</text>`
      )
      .join('') +
    setup
      .map(
        (item, i) => `<circle cx="104" cy="${listY + i * 120}" r="30" fill="${TEAL}"/>
        <path d="M90 ${listY + i * 120} l10 10 l18 -20" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="160" y="${listY + 14 + i * 120}" font-family="${FONT}" font-size="46" font-weight="700" fill="#fff">${esc(item)}</text>`
      )
      .join('')
);

// One scene per clip. The photos put the face in the upper half, so the shot,
// angle and question stack up from the bottom edge instead of the Reels safe zone.
const BOTTOM = H - 80;
for (const [i, clip] of clips.entries()) {
  const qLines = wrap(clip.question, 30);
  const cardH = qLines.length * 66 + 70;
  const cardY = BOTTOM - cardH;
  const tipY = cardY - 126;
  await scene(
    `clip${i}`,
    await crop(photo(clip.image), clip),
    shade +
      grid +
      (await fitPill(70, tipY - 268, `CLIP ${i + 1} / ${clips.length}`, CORAL, 34)) +
      `<text x="70" y="${tipY - 112}" font-family="${FONT}" font-size="66" font-weight="800" fill="#fff">${esc(clip.shot)}</text>
       <text x="70" y="${tipY - 52}" font-family="${FONT}" font-size="40" font-weight="700" fill="#fcd34d">${esc(clip.angle)}</text>
       <text x="70" y="${tipY}" font-family="${FONT}" font-size="34" fill="#ffffffdd">${esc(clip.tip)}</text>` +
      (await fitPill(70, cardY - 86, 'ASK THE PATIENT', TEAL, 30)) +
      `<rect x="60" y="${cardY}" width="${W - 120}" height="${cardH}" rx="30" fill="#fff" fill-opacity="0.95"/>` +
      qLines
        .map(
          (line, j) =>
            `<text x="100" y="${cardY + 84 + j * 66}" font-family="${FONT}" font-size="50" font-weight="700" fill="${NAVY}">${esc(line)}</text>`
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
   <polygon points="${W / 2 - 30},610 ${W / 2 - 30},690 ${W / 2 + 40},650" fill="#fff"/>` +
    textLines(ctaLines, 870, { size: 68, weight: 800, gap: 1.24 }) +
    textLines([brand], 900 + ctaLines.length * 84, { size: 40, weight: 400, fill: '#a9c7cf' })
);

const transitions = [...clips.map(() => ({ type: 'fade', duration: 0.4 })), { type: 'fade', duration: 0.5 }];
// Every clip gets the same time, whatever fits `length` after the setup and end cards.
const SETUP_SECONDS = 5;
const END_SECONDS = 4;
const overlap = transitions.reduce((sum, t) => sum + t.duration, 0);
const clipSeconds = +((length - SETUP_SECONDS - END_SECONDS + overlap) / clips.length).toFixed(3);

const out = `public/videos/${name}.mp4`;
const total = assemble({
  scenes: [
    { file: frame('setup'), duration: SETUP_SECONDS },
    // zoom '1' holds the frame still instead of the default push-in.
    ...clips.map((_, i) => ({ file: frame(`clip${i}`), duration: clipSeconds, zoom: '1' })),
    { file: frame('end'), duration: END_SECONDS },
  ],
  transitions,
  out,
  music,
});

// Poster for the site card: the first clip's photo without text (the card adds its own).
mkdirSync('src/assets/images/reels', { recursive: true });
await sharp(await crop(photo(clips[0].image), clips[0]))
  .resize(720, 1280)
  .jpeg({ quality: 82 })
  .toFile(`src/assets/images/reels/${name}-poster.jpg`);

rmSync(tmp, { recursive: true, force: true });
if (missing.size)
  console.warn(`Used the placeholder for ${missing.size} photos not made yet:\n  ${[...missing].join('\n  ')}`);
console.log(`Wrote ${out} (${total}s) and src/assets/images/reels/${name}-poster.jpg`);
