// Editor wiring for the Vice City Cover Art Studio: the studio state, the
// control panel, sample photos, file uploads, the PNG export and the
// screenshot-scene hook. Everything runs in the browser; photos are read on
// the person's own machine and never leave it.
import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const RESOLUTIONS = {
  '1080': [1080, 1080],
  portrait: [1080, 1350],
  widescreen: [1920, 1080],
};

const RANDOM_CAPTIONS = ['NEON RUNAWAY', 'VICE NIGHTS', 'OCEAN DRIVE', 'PALM PARADISE'];
const RANDOM_THEMES = ['sunset', 'cyber', 'ocean'];
const RANDOM_LAYOUTS = ['single', 'dual', 'triple'];

const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');

class StudioState {
  constructor() {
    this.layout = 'dual';
    this.caption = 'SUNSET HEIST';
    this.subcaption = 'VICE CITY STORIES';
    this.theme = 'sunset';
    this.resolution = 'portrait';
    this.img1 = null;
    this.img2 = null;
    this.t1 = { zoom: 1, x: 0, y: 0 };
    this.t2 = { zoom: 1, x: 0, y: 0 };
  }

  // Loads a bundled sample photo into one panel slot. The promise always
  // resolves (false on a missing file) so a bad sample name can never hang
  // the app or a screenshot scene.
  loadSample(name, slot = 1) {
    return new Promise((resolve) => {
      const img = new Image();
      const done = (loaded) => {
        if (loaded) {
          if (slot === 2) this.img2 = img;
          else this.img1 = img;
        }
        redraw();
        resolve(loaded);
      };
      img.onload = () => done(true);
      img.onerror = () => {
        console.warn(`sample photo not found: samples/${name}.jpg`);
        done(false);
      };
      img.src = `samples/${name}.jpg`;
    });
  }
}

const state = new StudioState();

function readTransform(prefix) {
  return {
    zoom: Number($(prefix + 'Zoom').value),
    x: Number($(prefix + 'PanX').value),
    y: Number($(prefix + 'PanY').value),
  };
}

function syncTransformControls(prefix, transform) {
  $(prefix + 'Zoom').value = String(transform.zoom);
  $(prefix + 'PanX').value = String(transform.x);
  $(prefix + 'PanY').value = String(transform.y);
}

// Reads every control into the state, sizes the canvas for the chosen
// export resolution, hides the second photo's controls on the single-panel
// layout, and repaints the cover.
function redraw() {
  state.layout = $('layoutSelect').value;
  state.caption = $('captionInput').value;
  state.subcaption = $('subcaptionInput').value;
  state.theme = $('themeSelect').value;
  state.resolution = $('resolutionSelect').value;
  state.t1 = readTransform('photo1');
  state.t2 = readTransform('photo2');

  const [w, h] = RESOLUTIONS[state.resolution] ?? RESOLUTIONS.portrait;
  canvas.width = w;
  canvas.height = h;
  $('secondaryPhotoGroup').style.display = state.layout === 'single' ? 'none' : '';
  drawCover(canvas, state);
}

function bindPhotoInput(inputId, slot) {
  $(inputId).addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (slot === 2) state.img2 = img;
        else state.img1 = img;
        redraw();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Controls: every change repaints at once, so the preview is always live.
$('layoutSelect').addEventListener('change', redraw);
$('captionInput').addEventListener('input', redraw);
$('subcaptionInput').addEventListener('input', redraw);
$('themeSelect').addEventListener('change', redraw);
$('resolutionSelect').addEventListener('change', redraw);
for (const prefix of ['photo1', 'photo2']) {
  for (const suffix of ['Zoom', 'PanX', 'PanY']) {
    $(prefix + suffix).addEventListener('input', redraw);
  }
}

$('sample1Btn').addEventListener('click', () => state.loadSample('pier', 1));
$('sample2Btn').addEventListener('click', () => state.loadSample('boulevard', 1));
$('samplePier2Btn').addEventListener('click', () => state.loadSample('pier', 2));
$('sampleBlvd2Btn').addEventListener('click', () => state.loadSample('boulevard', 2));

bindPhotoInput('photoInput1', 1);
bindPhotoInput('photoInput2', 2);

$('randomizeBtn').addEventListener('click', () => {
  state.theme = pick(RANDOM_THEMES);
  state.layout = pick(RANDOM_LAYOUTS);
  $('themeSelect').value = state.theme;
  $('layoutSelect').value = state.layout;
  $('captionInput').value = pick(RANDOM_CAPTIONS);
  state.t1 = { zoom: 1, x: 0, y: 0 };
  state.t2 = { zoom: 1, x: 0, y: 0 };
  syncTransformControls('photo1', state.t1);
  syncTransformControls('photo2', state.t2);
  redraw();
});

$('exportBtn').addEventListener('click', () => {
  const slug = (state.caption || 'cover')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cover';
  const link = document.createElement('a');
  link.download = `${slug}-${canvas.width}x${canvas.height}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// Start with two different sample photos, one per panel slot, so the
// multi-panel layouts show two photos at once; then run a screenshot scene
// when the URL asks for one.
Promise.all([state.loadSample('pier', 1), state.loadSample('boulevard', 2)]).then(() => {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) runShot(shot, params, state);
});
