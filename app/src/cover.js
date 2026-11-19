// Cover renderer for the Vice City Cover Art Studio.
// Paints a multi-panel GTA-style poster onto a canvas: a Vice City sunset
// backdrop, one to three photo panels with per-photo crop and position, and
// bold poster lettering. Every size is derived from the canvas itself, so the
// same code draws the square, portrait and widescreen exports.

const THEMES = {
  sunset: {
    skyTop: '#140530', skyMid: '#a313ff', skyBottom: '#ff7a00',
    neon: '#00f3ff', sun: '#ffd166',
    tintTop: 'rgba(255, 42, 133, 0.18)', tintBottom: 'rgba(0, 243, 255, 0.14)',
  },
  cyber: {
    skyTop: '#06021f', skyMid: '#ff007f', skyBottom: '#6a00ff',
    neon: '#00ffff', sun: '#ff5ce1',
    tintTop: 'rgba(255, 0, 127, 0.18)', tintBottom: 'rgba(0, 255, 255, 0.14)',
  },
  ocean: {
    skyTop: '#021c22', skyMid: '#0066ff', skyBottom: '#ff9e00',
    neon: '#00ffaa', sun: '#fff3b0',
    tintTop: 'rgba(0, 119, 255, 0.18)', tintBottom: 'rgba(255, 170, 0, 0.14)',
  },
};

const LAYOUTS = new Set(['single', 'dual', 'triple']);
const DEFAULT_TRANSFORM = { zoom: 1, x: 0, y: 0 };

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const theme = THEMES[state.theme] ?? THEMES.sunset;
  const layout = LAYOUTS.has(state.layout) ? state.layout : 'dual';

  ctx.clearRect(0, 0, width, height);
  paintBackdrop(ctx, width, height, theme);

  const panels = panelRects(width, height, layout);
  const photos = layout === 'single'
    ? [[state.img1, state.t1]]
    : layout === 'dual'
      ? [[state.img1, state.t1], [state.img2 ?? state.img1, state.t2]]
      : [[state.img1, state.t1], [state.img2 ?? state.img1, state.t2], [state.img1, state.t1]];
  panels.forEach((rect, i) => {
    const [img, transform] = photos[i];
    paintPhoto(ctx, img, rect, transform ?? DEFAULT_TRANSFORM, theme);
    framePanel(ctx, rect, theme, width);
  });

  paintLettering(ctx, width, height, state, theme);
}

// The sky gradient, a soft glow behind the lettering zone and a faint
// diagonal light streak, so the margins read as a sunset even where the
// panels do not cover the canvas.
function paintBackdrop(ctx, width, height, theme) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.45, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width / 2, height * 0.92, 0,
    width / 2, height * 0.92, width * 0.65,
  );
  glow.addColorStop(0, theme.tintTop);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.5);
  const streak = ctx.createLinearGradient(-width, 0, width, 0);
  streak.addColorStop(0, 'rgba(255, 255, 255, 0)');
  streak.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  streak.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = streak;
  ctx.fillRect(-width, -height * 0.12, width * 2, height * 0.24);
  ctx.restore();
}

// Panel rectangles: a margin band around the canvas, a lettering zone at the
// bottom, and the remaining band split into one, two or three panels.
function panelRects(width, height, layout) {
  const margin = Math.max(24, Math.round(width * 0.037));
  const gap = Math.max(10, Math.round(margin * 0.5));
  const typeZone = Math.round(height * 0.22);
  const top = margin;
  const panelH = height - typeZone - margin * 2;
  const innerW = width - margin * 2;

  if (layout === 'single') return [{ x: margin, y: top, w: innerW, h: panelH }];
  if (layout === 'dual') {
    const w = (innerW - gap) / 2;
    return [
      { x: margin, y: top, w, h: panelH },
      { x: margin + w + gap, y: top, w, h: panelH },
    ];
  }
  const w = (innerW - gap * 2) / 3;
  return [0, 1, 2].map((i) => ({ x: margin + i * (w + gap), y: top, w, h: panelH }));
}

// Draws one photo cover-fitted into its panel, with the photo's own zoom
// (a multiplier on the cover scale) and pan (a -1..1 shift across the
// overflow in each axis). A themed tint and a vignette grade the photo.
function paintPhoto(ctx, img, rect, transform, theme) {
  const { x, y, w, h } = rect;
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = '#160b2e';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = `700 ${Math.max(14, Math.round(w * 0.08))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
    return;
  }

  const zoom = Math.min(2.5, Math.max(1, transform.zoom || 1));
  const panX = Math.min(1, Math.max(-1, transform.x || 0));
  const panY = Math.min(1, Math.max(-1, transform.y || 0));
  const coverScale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = coverScale * zoom;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const drawX = x - (drawW - w) / 2 + (panX * (drawW - w)) / 2;
  const drawY = y - (drawH - h) / 2 + (panY * (drawH - h)) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  const tint = ctx.createLinearGradient(x, y, x, y + h);
  tint.addColorStop(0, theme.tintTop);
  tint.addColorStop(1, theme.tintBottom);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);

  const shade = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// A neon frame with a soft outer glow and a thin inner highlight, so each
// panel reads as a printed poster tile.
function framePanel(ctx, rect, theme, canvasWidth) {
  const { x, y, w, h } = rect;
  const line = Math.max(2, Math.round(canvasWidth * 0.004));
  ctx.save();
  ctx.shadowColor = theme.neon;
  ctx.shadowBlur = line * 4;
  ctx.strokeStyle = theme.neon;
  ctx.lineWidth = line;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + line + 2, y + line + 2, w - (line + 2) * 2, h - (line + 2) * 2);
  ctx.restore();
}

// Poster lettering in the bottom zone: a sub-headline banner, a neon rule,
// and the main caption, sized from the canvas width and shrunk until it
// fits, so long captions never spill off the edge.
function paintLettering(ctx, width, height, state, theme) {
  const margin = Math.max(24, Math.round(width * 0.037));
  const zoneH = Math.round(height * 0.22);
  const zoneTop = height - zoneH;
  const caption = (state.caption || 'SUNSET HEIST').toUpperCase();
  const subcaption = (state.subcaption || 'VICE CITY STORIES').toUpperCase();

  ctx.save();
  ctx.textAlign = 'center';

  const bannerH = Math.round(zoneH * 0.3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
  ctx.fillRect(0, zoneTop, width, bannerH);
  const subSize = Math.max(14, Math.round(width * 0.026));
  ctx.font = `900 ${subSize}px sans-serif`;
  ctx.fillStyle = theme.neon;
  try { ctx.letterSpacing = `${Math.round(subSize * 0.25)}px`; } catch { /* older canvas */ }
  ctx.textBaseline = 'middle';
  ctx.fillText(subcaption, width / 2, zoneTop + bannerH / 2);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  const ruleW = Math.round(width * 0.3);
  ctx.fillStyle = theme.neon;
  ctx.fillRect((width - ruleW) / 2, zoneTop + bannerH + Math.round(zoneH * 0.08), ruleW, 2);

  let capSize = Math.round(width * 0.082);
  ctx.font = `900 ${capSize}px sans-serif`;
  const maxW = width - margin * 2;
  while (capSize > 20 && ctx.measureText(caption).width > maxW) {
    capSize -= 2;
    ctx.font = `900 ${capSize}px sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = theme.skyMid;
  ctx.shadowBlur = Math.round(width * 0.02);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(caption, width / 2, height - Math.round(zoneH * 0.16));
  ctx.restore();
}
