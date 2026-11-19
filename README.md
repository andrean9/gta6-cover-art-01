[![make.fun](https://make.fun/badge.svg)](https://make.fun/r/66rnv3bx)

# Vice City Cover Art Studio (gta6-cover-art-01)

An advanced offline web application that transforms photos and captions into stunning Vice City / GTA 6 style poster art. Built entirely with vanilla HTML5, CSS3, and ES modules without external libraries or network dependencies. Your photos are read on your own machine and never uploaded anywhere.

## How to use

1. Open the app (see Local Development below) — it starts with two sample photos already loaded.
2. Load your own photo with the file picker, or keep a sample. Use the Zoom and Position sliders to crop and position each photo inside its panel.
3. Pick a panel layout (Single Epic, 2-Panel Split, 3-Panel Comic), a color theme, and your caption and sub-headline.
4. Choose an export size — Square (1080x1080), Portrait (1080x1350) or Widescreen (1920x1080) — and press **Export High-Res PNG**.

## Features

- **Multi-Panel Layouts**: Choose between Single Epic, 2-Panel Split, and 3-Panel Comic poster configurations.
- **Two photos at once**: fill the panels with one photo or two different ones, each with its own zoom and position controls for cropping.
- **Vice City Color Themes**: Sunset Pink/Orange, Neon Cyber, and Ocean Drive gradients and glow effects.
- **Custom Typography**: Bold custom headlines and sub-headlines styled after iconic crime drama poster aesthetics, auto-fitted so long captions never spill off the edge.
- **High-Resolution Export**: Export crisp PNGs in Square (1080x1080), Portrait (1080x1350), and Widescreen (1920x1080).
- **100% Offline**: Runs purely client-side in any modern browser.

## Screenshots

`screenshots/` holds three captures taken with headless Chrome from the app itself (see `shots.json` for the scenes): the exported widescreen cover, the editor with a photo loaded, and the exported portrait cover.

## Local Development

```bash
# Start local static server
node serve.ts

# Or test build output
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT License - see [LICENSE](LICENSE).
