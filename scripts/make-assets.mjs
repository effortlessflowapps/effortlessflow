/**
 * EffortlessFlow asset pipeline.
 * Normalizes brand SVGs to canonical hexes, derives variants, and
 * rasterizes favicons + the OG image. Run: bun scripts/make-assets.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const BRAND = path.resolve(ROOT, '../../Assets');
const CANON = {
  forest: '#014426',
  orange: '#FF6D00',
  canvas: '#FFFAF0',
};

await mkdir(path.join(ROOT, 'src/assets'), { recursive: true });

/* ---------- Wordmark variants (recolor + tighten viewBox) ---------- */

const wordmarkSrc = await readFile(
  path.join(BRAND, 'Brand wordmark light transparent.svg'),
  'utf8',
);

// Measure the artwork bounds at 1 user-unit = 1px so we can tighten the viewBox.
const probe = await sharp(Buffer.from(wordmarkSrc)).png().toBuffer();
const trimmed = sharp(probe).trim();
const { width, height } = await trimmed.metadata();
const meta = await trimmed.toBuffer({ resolveWithObject: true });
const box = {
  left: -meta.info.trimOffsetLeft,
  top: -meta.info.trimOffsetTop,
  width: meta.info.width,
  height: meta.info.height,
};
console.log('wordmark content bbox:', JSON.stringify(box));

const pad = 14;
const vb = [
  box.left - pad,
  box.top - pad,
  box.width + pad * 2,
  box.height + pad * 2,
].join(' ');

function wordmarkVariant(lettering) {
  return wordmarkSrc
    .replace(/\.s0 \{ fill: #[0-9a-f]+ \}/, `.s0 { fill: ${CANON.orange} }`)
    .replace(/\.s1 \{ fill: #[0-9a-f]+ \}/, `.s1 { fill: ${lettering} }`)
    .replace(/viewBox="[^"]+"/, `viewBox="${vb}"`)
    .replace(/\s(width|height)="[^"]*"/g, '');
}

await writeFile(
  path.join(ROOT, 'src/assets/wordmark-forest.svg'),
  wordmarkVariant(CANON.forest),
);
await writeFile(
  path.join(ROOT, 'src/assets/wordmark-light.svg'),
  wordmarkVariant(CANON.canvas),
);

/* ---------- Compact E mark → favicon set ---------- */

const eSrc = await readFile(
  path.join(BRAND, 'ChatGPT Image Sep 17, 2026, 08_42_44 AM.svg'),
  'utf8',
);
const faviconSvg = eSrc
  .replace(/\.s0 \{ fill: #[0-9a-f]+ \}/, `.s0 { fill: ${CANON.forest} }`)
  .replace(/\.s1 \{ fill: #[0-9a-f]+ \}/, `.s1 { fill: ${CANON.canvas} }`)
  .replace(/\.s2 \{ fill: #[0-9a-f]+ \}/, `.s2 { fill: ${CANON.orange} }`)
  .replace(/\s(width|height)="[^"]*"/g, '');

await writeFile(path.join(ROOT, 'public/favicon.svg'), faviconSvg);

const ePng = sharp(Buffer.from(faviconSvg), { density: 300 }).png();
for (const size of [512, 192, 180, 48, 32, 16]) {
  await ePng
    .clone()
    .resize(size, size, { fit: 'fill' })
    .png()
    .toFile(
      path.join(ROOT, 'public', size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`),
    );
}

// favicon.ico bundling 16 + 32 + 48
const { execFileSync } = await import('node:child_process');
execFileSync('magick', [
  path.join(ROOT, 'public/icon-48.png'),
  path.join(ROOT, 'public/icon-32.png'),
  path.join(ROOT, 'public/icon-16.png'),
  path.join(ROOT, 'public/favicon.ico'),
]);

/* ---------- OG image: canvas + wordmark + flow line ---------- */

// Scale wordmark to ~760px wide inside the 1200x630 card.
const scale = 760 / box.width;
const wmW = box.width * scale;
const wmH = box.height * scale;
const wmX = (1200 - wmW) / 2;
const wmY = 240 - wmH / 2;

const lettering = wordmarkSrc.match(/<path id="Path 1"[^>]*d="([^"]+)"/)[1];
const sweep = wordmarkSrc.match(/<path id="Path 2"[^>]*d="([^"]+)"/)[1];

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${CANON.canvas}"/>
  <g transform="translate(${wmX - box.left * scale} ${wmY - box.top * scale}) scale(${scale})">
    <path d="${sweep}" fill="${CANON.orange}"/>
    <path fill-rule="evenodd" d="${lettering}" fill="${CANON.forest}"/>
  </g>
  <path d="M 170 470 C 340 520, 520 420, 700 460 S 980 520, 1040 470"
        fill="none" stroke="${CANON.orange}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
  <circle cx="1046" cy="468" r="9" fill="${CANON.orange}"/>
</svg>`;

await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toFile(path.join(ROOT, 'public/og-default.png'));

console.log('assets done');
