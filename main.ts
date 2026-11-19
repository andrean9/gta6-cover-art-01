// Vice City Cover Art Generator entry point (Node 22, stdlib only).
// Copies app/ and screenshots/ to output directory and generates dossier.json using vendored makefun-app.ts.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
const shotDir = join(here, 'screenshots');
const shotFiles = existsSync(shotDir)
  ? readdirSync(shotDir).filter((name) => !name.startsWith('.'))
  : [];

// Read a JPEG's pixel dimensions from its SOF marker (stdlib only, no
// image library): scan the marker segments until SOF0/SOF1/SOF2, then
// read height and width as big-endian uint16. Returns null when the
// file is not a parseable JPEG.
function jpegDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2; // standalone markers carry no length field
      continue;
    }
    if (marker === 0xda) return null; // start of scan: no SOF found
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

// Validate every screenshot against the gate caps BEFORE copying, so a
// violation is reported here instead of failing the entry at judging.
for (const name of shotFiles) {
  const path = join(shotDir, name);
  const size = statSync(path).size;
  if (size > 262144) {
    console.error(`warning: ${name} is ${size} bytes, over the 256 KiB screenshot cap`);
  }
  if (/\.jpe?g$/i.test(name)) {
    const dims = jpegDimensions(readFileSync(path));
    if (dims === null) {
      console.error(`warning: ${name} is not a parseable JPEG`);
    } else {
      const longSide = Math.max(dims.width, dims.height);
      const shortSide = Math.min(dims.width, dims.height);
      if (longSide > 1280) {
        console.error(`warning: ${name} is ${dims.width}x${dims.height}, long side over the 1280 cap`);
      }
      if (shortSide < 480) {
        console.error(`warning: ${name} is ${dims.width}x${dims.height}, short side under the 480 minimum`);
      }
    }
  }
}
if (shotFiles.length > 0) {
  cpSync(shotDir, join(out, 'screenshots'), { recursive: true });
}
// The gate needs 3 to 4 screenshots; warn loudly instead of failing
// silently when the entry would be invalid.
if (shotFiles.length < 3) {
  console.error(`warning: screenshots/ holds ${shotFiles.length} file(s); the gate needs 3 to 4`);
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(
  `wrote ${out}/dossier.json (${statSync(join(out, 'dossier.json')).size} bytes) ` +
  `with ${shotFiles.length} screenshot(s): ${shotFiles.join(', ') || 'none'}`,
);
