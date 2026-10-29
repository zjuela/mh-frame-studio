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

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

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

const W = 1080;
const H = 1920;
const FPS = 30;
const TEAL = '#0d7480';
const NAVY = '#0f3460';
const CORAL = '#e85d4a';
const FONT = 'Helvetica, Arial, sans-serif';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Greedy word wrap; SVG text has no wrapping of its own.
const wrap = (text, max) =>
  text.split(' ').reduce((lines, word) => {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
    return lines;
  }, []);

const pill = (x, y, text, fill) =>
  `<rect x="${x}" y="${y}" width="${text.length * 22 + 56}" height="64" rx="32" fill="${fill}"/>
   <text x="${x + 28}" y="${y + 44}" font-family="${FONT}" font-size="34" font-weight="800" letter-spacing="2" fill="#fff">${esc(text)}</text>`;

const hookSvg = (y) => {
  const lines = wrap(args.hook, 18);
  return lines
    .map((line, i) => {
      const w = line.length * 38 + 60;
      const ly = y + i * 104;
      return `<rect x="${(W - w) / 2}" y="${ly}" width="${w}" height="92" rx="16" fill="${CORAL}"/>
        <text x="${W / 2}" y="${ly + 66}" text-anchor="middle" font-family="${FONT}" font-size="64" font-weight="800" fill="#fff">${esc(line)}</text>`;
    })
    .join('');
};

const captionSvg = (y) =>
  `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="700" fill="#fff">${esc(args.procedure)}</text>
   <text x="${W / 2}" y="${y + 54}" text-anchor="middle" font-family="${FONT}" font-size="30" fill="#ffffffcc">Results may vary · ${esc(args.brand)}</text>`;

const overlay = (svg) => Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`);

const rounded = async (file, w, h, r = 36) =>
  sharp(file)
    .resize(w, h, { fit: 'cover' })
    .composite([
      {
        input: Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}"/></svg>`),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

const blurredBackground = (file) =>
  sharp(file).resize(W, H, { fit: 'cover' }).blur(60).modulate({ brightness: 0.45 }).png().toBuffer();

const tmp = mkdtempSync(join(tmpdir(), 'reel-'));
const frame = (name) => join(tmp, `${name}.png`);

// 1) Before (with hook) and 2) after: photo as a large square card.
const CARD = 1000;
const CARD_Y = 520;
for (const [name, file, label, fill, withHook] of [
  ['before', args.before, 'BEFORE', '#334155', true],
  ['after', args.after, 'AFTER', TEAL, false],
]) {
  await sharp(await blurredBackground(file))
    .composite([
      { input: await rounded(file, CARD, CARD), left: (W - CARD) / 2, top: CARD_Y },
      {
        input: overlay(
          (withHook ? hookSvg(170) : '') + pill(80, CARD_Y + 40, label, fill) + captionSvg(CARD_Y + CARD + 110)
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
        pill(80, 220, 'BEFORE', '#334155') + pill(80, 220 + SH + 24, 'AFTER', TEAL) + captionSvg(180 + 2 * SH + 120)
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
        ${ctaLines
          .map(
            (l, i) =>
              `<text x="${W / 2}" y="${870 + i * 84}" text-anchor="middle" font-family="${FONT}" font-size="68" font-weight="800" fill="#fff">${esc(l)}</text>`
          )
          .join('')}
        <text x="${W / 2}" y="${900 + ctaLines.length * 84}" text-anchor="middle" font-family="${FONT}" font-size="40" fill="#a9c7cf">${esc(args.brand)}</text>
        <text x="${W / 2}" y="1720" text-anchor="middle" font-family="${FONT}" font-size="28" fill="#ffffff99">${esc(args.procedure)} · Results may vary. Individual results differ.</text>`),
      left: 0,
      top: 0,
    },
  ])
  .toFile(frame('end'));

// Assemble: slow push-in on every still, slider wipe before → after, fades after.
const segments = [
  ['before', 4],
  ['after', 5],
  ['split', 4],
  ['end', 3.5],
];
const inputs = segments.flatMap(([name, d]) => [
  '-framerate',
  String(FPS),
  '-loop',
  '1',
  '-t',
  String(d),
  '-i',
  frame(name),
]);
const WIPE_AT = 3;
// Slow push-in on every still. Before and after both sit at exactly HOLD
// zoom while the wipe runs, so the two photos line up at the slider line.
const HOLD = 1.03;
const wipeFrames = WIPE_AT * FPS;
const zoomExpr = [
  `1+${HOLD - 1}*min(on,${wipeFrames})/${wipeFrames}`, // before: push in, then hold for the wipe
  `${HOLD}+0.03*max(on-${FPS},0)/${(segments[1][1] - 1) * FPS}`, // after: hold for the wipe, then push in
  `1+0.03*on/${segments[2][1] * FPS}`,
  `1+0.03*on/${segments[3][1] * FPS}`,
];
const zoom = (i) =>
  `[${i}:v]scale=${W * 2}:${H * 2},zoompan=z='${zoomExpr[i]}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},setsar=1[v${i}]`;
const filter = [
  ...segments.map((_, i) => zoom(i)),
  `[v0][v1]xfade=transition=wiperight:duration=1:offset=${WIPE_AT}[ab]`,
  `color=white:s=8x${H}:r=${FPS}[line]`,
  `[ab][line]overlay=x='(t-${WIPE_AT})*${W}-4':y=0:enable='between(t,${WIPE_AT},${WIPE_AT + 1})'[abl]`,
  `[abl][v2]xfade=transition=fade:duration=0.5:offset=7.5[abc]`,
  `[abc][v3]xfade=transition=fade:duration=0.5:offset=11,format=yuv420p[out]`,
].join(';');
const total = 14.5;

const audio = args.music
  ? ['-i', args.music]
  : ['-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=r=44100:cl=stereo'];
const audioFilter = args.music ? ['-af', `afade=t=out:st=${total - 1.5}:d=1.5`] : [];

mkdirSync('public/videos', { recursive: true });
mkdirSync('src/assets/images/reels', { recursive: true });
const out = `public/videos/${args.name}.mp4`;
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-loglevel',
    'error',
    ...inputs,
    ...audio,
    '-filter_complex',
    filter,
    '-map',
    '[out]',
    '-map',
    `${segments.length}:a`,
    ...audioFilter,
    '-t',
    String(total),
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '23',
    '-profile:v',
    'high',
    '-movflags',
    '+faststart',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    out,
  ],
  { stdio: 'inherit' }
);

// Poster for the site card: the stacked before/after frame.
await sharp(frame('split'))
  .resize(720, 1280)
  .jpeg({ quality: 82 })
  .toFile(`src/assets/images/reels/${args.name}-poster.jpg`);

rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${out} and src/assets/images/reels/${args.name}-poster.jpg`);
