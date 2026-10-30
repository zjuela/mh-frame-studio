// Shared building blocks for the sample Reel generators in scripts/.
// Scenes are rendered as 1080×1920 stills with sharp (or are video clips with a
// text overlay), then ffmpeg adds a slow push-in to each still and joins them
// with transitions. Needs ffmpeg.

import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const TEAL = '#0d7480';
export const NAVY = '#0f3460';
export const CORAL = '#e85d4a';
export const SLATE = '#334155';
export const FONT = 'Helvetica, Arial, sans-serif';

export const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Greedy word wrap; SVG text has no wrapping of its own.
export const wrap = (text, max) =>
  text.split(' ').reduce((lines, word) => {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
    return lines;
  }, []);

/** Full-frame SVG overlay as a buffer for sharp's composite. */
export const overlay = (svg) =>
  Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`);

/**
 * The width of a line of text as the SVG renders it, from the first to the last
 * inked pixel. Pass it to `pill` / `highlightLines` so their backgrounds fit.
 */
export const textWidth = async (text, size, { weight = 800, spacing = 0 } = {}) => {
  const svg = `<svg width="${Math.ceil(text.length * size * 1.2 + 40)}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="${size * 1.5}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}">${esc(text)}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).trim().toBuffer({ resolveWithObject: true });
  return info.width;
};

/**
 * Rounded label like the BEFORE / AFTER tags on the site. Its width is
 * estimated from the letter count unless `textW` (from `textWidth`) is given.
 */
export const pill = (x, y, text, fill, size = 34, textW = text.length * (size * 0.7 + 2)) => {
  const h = size * 1.9;
  return `<rect x="${x}" y="${y}" width="${textW + size * 1.6}" height="${h}" rx="${h / 2}" fill="${fill}"/>
   <text x="${x + size * 0.8}" y="${y + h * 0.69}" font-family="${FONT}" font-size="${size}" font-weight="800" letter-spacing="2" fill="#fff">${esc(text)}</text>`;
};

/**
 * Centred lines of text, each on its own coloured highlight bar. Bar widths are
 * estimated from the letter count unless `widths` (from `textWidth`) are given.
 */
export const highlightLines = (lines, y, { size = 64, fill = CORAL, gap = 1.62, widths } = {}) =>
  lines
    .map((line, i) => {
      const w = (widths?.[i] ?? line.length * size * 0.6) + size;
      const ly = y + i * size * gap;
      return `<rect x="${(W - w) / 2}" y="${ly}" width="${w}" height="${size * 1.44}" rx="${size / 4}" fill="${fill}"/>
        <text x="${W / 2}" y="${ly + size * 1.03}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="800" fill="#fff">${esc(line)}</text>`;
    })
    .join('');

/** Centred plain text lines. */
export const textLines = (lines, y, { size = 48, weight = 700, fill = '#fff', gap = 1.3 } = {}) =>
  lines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${y + i * size * gap}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`
    )
    .join('');

/**
 * A photo cropped to w×h with rounded corners. The crop is centred by default
 * so a before and an after of the same size line up exactly; pass
 * `{ focus: true }` to crop around the photo's subject instead.
 */
export const rounded = async (file, w, h, { r = 36, focus = false } = {}) =>
  sharp(file)
    .resize(w, h, { fit: 'cover', position: focus ? sharp.strategy.attention : 'centre' })
    .composite([
      {
        input: Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}"/></svg>`),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

/** The photo filling the frame, blurred and darkened, as a backdrop. */
export const blurredBackground = (file) =>
  sharp(file).resize(W, H, { fit: 'cover' }).blur(60).modulate({ brightness: 0.45 }).png().toBuffer();

/**
 * The photo filling the frame. The crop follows the photo's subject unless
 * `position` names a fixed one ('centre', 'top', 'left', …).
 */
export const fullBleed = (file, { brightness = 1, saturation = 1, position = sharp.strategy.attention } = {}) =>
  sharp(file).resize(W, H, { fit: 'cover', position }).modulate({ brightness, saturation }).png().toBuffer();

/**
 * Joins scenes into an MP4.
 * scenes:      [{ file, duration, zoom?, video?, overlay? }]: zoom is a zoompan
 *              expression in `on` (frame number); the default is a slow 3% push-in.
 *              With `video: true` the file is a clip, played from its start and
 *              cropped to fill the frame. `overlay` is a transparent PNG laid over it.
 * transitions: one per gap, { type, duration, line? }: type is any ffmpeg xfade
 *              transition; `line` draws a slider bar across a wipe.
 */
export const assemble = ({ scenes, transitions, out, music }) => {
  const still = (file, duration) => ['-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', file];
  const inputs = scenes.flatMap(({ file, duration, video }) =>
    video ? ['-t', String(duration), '-i', file] : still(file, duration)
  );
  // Overlays are extra inputs after the scenes.
  const overlays = scenes.flatMap(({ overlay, duration }, i) => (overlay ? [{ i, file: overlay, duration }] : []));
  overlays.forEach(({ file, duration }) => inputs.push(...still(file, duration)));

  const filters = scenes.map(({ duration, zoom, video }, i) =>
    video
      ? `[${i}:v]fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,trim=duration=${duration},setpts=PTS-STARTPTS[v${i}]`
      : `[${i}:v]scale=${W * 2}:${H * 2},zoompan=z='${zoom ?? `1+0.03*on/${duration * FPS}`}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},setsar=1[v${i}]`
  );
  overlays.forEach(({ i }, k) => {
    filters.push(`[v${i}][${scenes.length + k}:v]overlay=0:0[v${i}o]`);
  });
  const scene = (i) => (scenes[i].overlay ? `v${i}o` : `v${i}`);

  let label = scene(0);
  let elapsed = scenes[0].duration;
  transitions.forEach(({ type, duration, line }, i) => {
    const offset = +(elapsed - duration).toFixed(3);
    const next = `x${i}`;
    filters.push(`[${label}][${scene(i + 1)}]xfade=transition=${type}:duration=${duration}:offset=${offset}[${next}]`);
    label = next;
    if (line) {
      filters.push(`color=white:s=8x${H}:r=${FPS}[line${i}]`);
      filters.push(
        `[${label}][line${i}]overlay=x='(t-${offset})/${duration}*${W}-4':y=0:enable='between(t,${offset},${offset + duration})'[${next}l]`
      );
      label = `${next}l`;
    }
    elapsed = offset + scenes[i + 1].duration;
  });
  filters.push(`[${label}]format=yuv420p[out]`);
  const total = +elapsed.toFixed(3);

  const audio = music ? ['-i', music] : ['-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=r=44100:cl=stereo'];
  const audioFilter = music ? ['-af', `afade=t=out:st=${total - 1.5}:d=1.5`] : [];

  mkdirSync(out.replace(/\/[^/]+$/, ''), { recursive: true });
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      ...inputs,
      ...audio,
      '-filter_complex',
      filters.join(';'),
      '-map',
      '[out]',
      '-map',
      `${scenes.length + overlays.length}:a`,
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
  return total;
};
