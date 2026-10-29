// Builds the favicons and the social-share (Open Graph) image from the logo
// and a demo before/after pair. Re-run after changing the name or colours.
//
// Usage: node scripts/make-brand-images.mjs

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fav = path.join(root, 'src/assets/favicons');
const img = path.join(root, 'src/assets/images');

const NAME = 'M&amp;H Frame Studio';
const TEAL = '#0d7480';
const NAVY = '#0c1e34';

const logo = fs.readFileSync(path.join(fav, 'favicon.svg'));
await sharp(logo, { density: 600 }).resize(180, 180).png().toFile(path.join(fav, 'apple-touch-icon.png'));

// favicon.ico: a single 32x32 PNG wrapped in an ICO container.
const png32 = await sharp(logo, { density: 300 }).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);
fs.writeFileSync(path.join(fav, 'favicon.ico'), Buffer.concat([header, png32]));

// Open Graph image, 1200x628: text on the left, before/after split on the right.
const W = 1200;
const H = 628;
const PW = 560;
const before = await sharp(path.join(img, 'pairs/smile-before.jpg'))
  .resize(PW, H, { fit: 'cover' })
  .extract({ left: 0, top: 0, width: PW / 2, height: H })
  .toBuffer();
const after = await sharp(path.join(img, 'pairs/smile-after.jpg'))
  .resize(PW, H, { fit: 'cover' })
  .extract({ left: PW / 2, top: 0, width: PW / 2, height: H })
  .toBuffer();

const text = Buffer.from(`
<svg width="${W - PW}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${NAVY}"/>
  <g transform="translate(64 80)">
    <rect width="56" height="56" rx="14" fill="${TEAL}"/>
    <path d="M14 16h12v24H14z" fill="#fff" opacity="0.55"/>
    <path d="M30 16h12v24H30z" fill="#fff"/>
    <path d="M28 10v36" stroke="#fff" stroke-width="2.5"/>
    <text x="76" y="38" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#fff">${NAME}</text>
  </g>
  <text font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="54" fill="#fff">
    <tspan x="64" y="290">Before &amp; afters</tspan>
    <tspan x="64" y="356">that make patients</tspan>
    <tspan x="64" y="422" fill="#f08c78">book.</tspan>
  </text>
  <text x="64" y="530" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#a9c7cf">Photo &amp; video editing for dental practices</text>
</svg>`);

const label = (t, bg) =>
  Buffer.from(
    `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="40" rx="20" fill="${bg}"/><text x="60" y="27" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#fff">${t}</text></svg>`
  );

await sharp({ create: { width: W, height: H, channels: 3, background: NAVY } })
  .composite([
    { input: text, left: 0, top: 0 },
    { input: before, left: W - PW, top: 0 },
    { input: after, left: W - PW / 2, top: 0 },
    {
      input: Buffer.from(`<svg width="4" height="${H}"><rect width="4" height="${H}" fill="#fff"/></svg>`),
      left: W - PW / 2 - 2,
      top: 0,
    },
    { input: label('BEFORE', 'rgba(0,0,0,0.6)'), left: W - PW + 20, top: 24 },
    { input: label('AFTER', TEAL), left: W - 140, top: 24 },
  ])
  .png()
  .toFile(path.join(img, 'default.png'));

console.log('✓ favicons and default.png');
