// Builds the demo before/after pairs shown on the site.
//
// "after"  = the original (licensed) photo, cropped to 4:3.
// "before" = the same photo degraded the way raw clinic photos usually arrive:
//            colour cast, wrong exposure, flat contrast, tilted framing.
//
// The demos only show photographic correction; nothing clinical is altered.
// Replace these with real, consented client work as soon as you have it.
//
// Usage: node scripts/make-demo-pairs.mjs

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(root, 'src/assets/images/demo');
const outDir = path.join(root, 'src/assets/images/pairs');

const W = 1600;
const H = 1200;

// Colour casts as 3x3 recombination matrices (rows = output R, G, B).
const CAST = {
  warm: [
    [1.12, 0.04, 0],
    [0.02, 1.0, 0],
    [0, 0, 0.78],
  ],
  cool: [
    [0.84, 0, 0],
    [0, 0.97, 0.03],
    [0, 0.06, 1.15],
  ],
  green: [
    [0.92, 0.04, 0],
    [0.03, 1.08, 0],
    [0, 0.03, 0.9],
  ],
  magenta: [
    [1.08, 0, 0.04],
    [0, 0.9, 0],
    [0.04, 0, 1.06],
  ],
};

const pairs = [
  // name, source, crop gravity, before settings
  {
    name: 'smile',
    src: 'smile.jpg',
    position: 'centre',
    cast: 'warm',
    brightness: 0.78,
    contrast: 0.85,
    rotate: 4,
    shift: 0.04,
  },
  {
    name: 'clinic',
    src: 'clinic.jpg',
    position: 'centre',
    cast: 'cool',
    brightness: 0.62,
    contrast: 0.9,
    rotate: -3,
    shift: 0,
  },
  {
    name: 'headshot',
    src: 'headshot.jpg',
    position: 'north',
    cast: 'green',
    brightness: 0.85,
    contrast: 0.78,
    rotate: 2.5,
    shift: 0.05,
  },
  {
    name: 'consult',
    src: 'consult.jpg',
    position: 'centre',
    cast: 'magenta',
    brightness: 0.7,
    contrast: 0.88,
    rotate: -2,
    shift: -0.03,
  },
  {
    name: 'clinic-2',
    src: 'clinic-2.jpg',
    position: 'centre',
    cast: 'warm',
    brightness: 0.66,
    contrast: 0.85,
    rotate: 3,
    shift: 0.03,
  },
];

for (const p of pairs) {
  const input = path.join(srcDir, p.src);

  const after = await sharp(input)
    .resize(W, H, { fit: 'cover', position: p.position })
    .jpeg({ quality: 85 })
    .toBuffer();
  await sharp(after).toFile(path.join(outDir, `${p.name}-after.jpg`));

  // Tilt, then crop inside the rotated frame so no empty corners show. A shift
  // moves the crop off-centre, like a hurried phone shot.
  const tilted = await sharp(after).rotate(p.rotate, { background: '#222' }).toBuffer();
  const meta = await sharp(tilted).metadata();
  const cw = Math.round(W / 1.15);
  const ch = Math.round(H / 1.15);
  const left = Math.round((meta.width - cw) / 2 + cw * p.shift);
  const top = Math.round((meta.height - ch) / 2);
  const framed = await sharp(tilted)
    .extract({ left, top, width: Math.min(cw, meta.width - left), height: Math.min(ch, meta.height - top) })
    .resize(W, H, { fit: 'cover' })
    .toBuffer();

  const c = p.contrast;
  await sharp(framed)
    .recomb(CAST[p.cast])
    .linear(c, 128 * (1 - c))
    .modulate({ brightness: p.brightness, saturation: 0.85 })
    .jpeg({ quality: 80 })
    .toFile(path.join(outDir, `${p.name}-before.jpg`));

  console.log(`✓ ${p.name}`);
}
