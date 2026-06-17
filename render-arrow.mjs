import sharp from 'sharp';
import { readFileSync } from 'node:fs';

// Render one or more arrow paths (label + d) into a single PNG grid so the
// shape can be eyeballed. Usage: node render-arrow.mjs out.png
const VIEWBOX = '-150 -70 140 340';
const HUB = { cx: -80, cy: 80, r: 35 };

// Paths to compare are read from /tmp/arrow-candidates.json: [{label, d}]
const candidates = JSON.parse(
  readFileSync('/tmp/arrow-candidates.json', 'utf8')
);

const CELL_W = 180;
const CELL_H = Math.round((CELL_W * 340) / 140);
const cols = candidates.length;

function cell(d, i) {
  // gusts disc behind + body fill + black hairline outline, like the marker.
  return (
    `<svg x="${i * CELL_W}" y="0" width="${CELL_W}" height="${CELL_H}" viewBox="${VIEWBOX}">` +
    `<rect x="-150" y="-70" width="140" height="340" fill="#e2e8f0"/>` +
    `<circle cx="${HUB.cx}" cy="${HUB.cy}" r="${HUB.r}" fill="#b91c1c"/>` +
    `<path d="${d}" fill="#0ea5e9" paint-order="stroke" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/>` +
    `</svg>`
  );
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * CELL_W}" height="${CELL_H}">` +
  `<rect width="100%" height="100%" fill="#fff"/>` +
  candidates.map((c, i) => cell(c.d, i)).join('') +
  `</svg>`;

await sharp(Buffer.from(svg)).png().toFile(process.argv[2] ?? '/tmp/arrow.png');
console.log('wrote', process.argv[2] ?? '/tmp/arrow.png');
