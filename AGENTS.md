# AGENTS.md — Vice City Cover Art Studio (gta6-cover-art-01)

Technical guide and development standards for this repository.

## What this is

A multi-panel web app that turns two photos into a GTA 6-style cover: a
widescreen cover panel, an editor panel with crop/position controls, and a
portrait cover panel. Built for the make.fun gta6-cover-art-01 bounty.

## Stack

- Node.js 22, standard library only — no third-party dependencies.
- `main.ts` (entrypoint): copies screenshots into the output directory and
  writes `dossier.json`.
- `serve.ts`: a static file server for local development.
- `app/`: the browser app (`index.html`, `style.css`, `src/cover.js`,
  `src/main.js`, `src/shots.js`). The canvas renderer draws the cover;
  `shots.js` drives screenshot capture via `window.__shotReady`.

## Running it

- `MAKEFUN_OUTPUT_DIR=out node main.ts` — builds the dossier (exit 0 on
  success). Delete `out/` after verifying; it is gitignored.
- `node serve.ts` — serves the app locally for manual testing.

## Screenshot gates (the entry must satisfy these)

- 3–4 screenshots in `screenshots/`, each a JPEG.
- Each file at most 256 KiB; long side at most 1280 px; short side at
  least 480 px.
- `main.ts` validates every screenshot against these caps before copying
  and warns loudly (stderr) instead of failing silently.

## Code standards

- Standard library only. No image libraries: screenshot dimensions are
  read with a small JPEG header parser (SOF0/SOF1/SOF2 markers).
- Keep `main.ts` the single entrypoint; keep the dossier schema stable
  (`cover`, `images`, `schema`, `text`).
- `vendor/makefun-app.ts` is kit code — do not modify it.
- `LICENSE` is MIT; keep the SPDX identifier.

## Repo layout

- `main.ts`, `serve.ts` — Node entrypoints (root).
- `app/` — the browser app. `app/src/cover.js` renders the cover canvas;
  `app/src/main.js` wires the editor UI; `app/src/shots.js` handles
  screenshot capture.
- `screenshots/` — the 3 entry screenshots. `shots.json` — their capture
  parameters. `README.md` — user-facing guide.
