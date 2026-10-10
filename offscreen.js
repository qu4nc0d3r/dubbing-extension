// shortcut: unofficial Google Translate voice, max ~200 chars per request and may rate-limit; swap for a paid TTS API if it breaks.
const TTS = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=';
const clips = new Map(); // sentence id -> preloaded Audio parts
let current = [], lastAt = 0;

function load({ id, vi }) {
  if (!clips.has(id)) clips.set(id, (vi.match(/.{1,200}(\s|$)/g) || []).map((p) => Object.assign(new Audio(TTS + encodeURIComponent(p.trim())), { preload: 'auto', chars: p.length })));
  return clips.get(id);
}

function silence() { current.forEach((a) => a.pause()); current = []; }

function play(msg) {
  const left = msg.slot - (Date.now() - msg.at) / 1000;
  if (msg.at < lastAt || left < 0.3) return; // a later sentence already started, or this one's moment has passed
  lastAt = msg.at;
  const parts = load(msg);
  clips.delete(msg.id);
  silence();
  current = parts;
  // Speed up just enough to finish before the next sentence; ~13 chars/s estimates an mp3 that hasn't fully loaded.
  const secs = parts.reduce((d, a) => d + (isFinite(a.duration) ? a.duration : a.chars / 13), 0);
  const rate = Math.min(Math.max(secs / left, 1), 2);
  const next = (i) => {
    const a = parts[i];
    if (!a || current !== parts) return;
    let done = false;
    const go = () => { if (!done) { done = true; next(i + 1); } };
    a.playbackRate = rate;
    a.onended = a.onerror = go;
    a.play().catch(go);
  };
  next(0);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== 'offscreen') return;
  if (msg.type === 'load') load(msg);
  if (msg.type === 'play') play(msg);
  if (msg.type === 'stop' || msg.type === 'reset') silence();
  if (msg.type === 'reset') { clips.clear(); lastAt = 0; }
});
