// Vice City Cover Art Generator entry point (Node 22, stdlib only).
// Copies app/ and screenshots/ to output directory and generates dossier.json using vendored makefun-app.ts.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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
