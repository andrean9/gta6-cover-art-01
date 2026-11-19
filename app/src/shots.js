// Screenshot scenes: applies a shot's query parameters (?shot=cover or
// ?shot=editor) so headless Chrome can capture the app in a known state,
// then flags readiness on window.__shotReady once the cover has repainted.
export async function runShot(shot, query, appState) {
  const apply = (id, value) => {
    if (value === null || value === undefined || value === '') return;
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  apply('captionInput', query.get('caption'));
  apply('subcaptionInput', query.get('subcaption'));
  apply('layoutSelect', query.get('layout'));
  apply('themeSelect', query.get('theme'));
  apply('resolutionSelect', query.get('resolution'));

  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2');
  await appState.loadSample(photo, 1);
  if (photo2) await appState.loadSample(photo2, 2);

  // A cover scene hides the editor chrome: the shot is the exported art,
  // full frame.
  if (shot === 'cover') document.body.classList.add('shot-cover');

  // Two animation frames: let the canvas repaint, then signal the capture.
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  window.__shotReady = true;
}
