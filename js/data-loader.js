// data-loader.js
// Embeds the dataset directly (avoids fetch() issues in sandboxed iframe previews).
window.KONKANI_DATA = null;

async function loadKonkaniData() {
  if (window.KONKANI_DATA) return window.KONKANI_DATA;
  const res = await fetch('data/scripts.json');
  const json = await res.json();
  window.KONKANI_DATA = json;
  return json;
}
