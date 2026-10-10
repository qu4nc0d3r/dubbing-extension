const DEFAULTS = { on: false, duck: 0.2 };
let duck = DEFAULTS.duck, prev = '', buf = [], lastNew = 0, timer;
const ducked = new Map(); // video -> volume before ducking

const send = (msg) => chrome.runtime.sendMessage(msg).catch(() => {}); // worker restarting / extension reloaded

function activeVideo() {
  const vs = [...document.querySelectorAll('video')];
  return vs.find((v) => !v.paused) || vs[0];
}

function captionText(v) {
  const yt = document.querySelectorAll('.ytp-caption-segment');
  if (yt.length) return [...yt].map((s) => s.textContent).join(' ');
  const tracks = [...v.textTracks].filter((t) => t.kind === 'subtitles' || t.kind === 'captions');
  const t = tracks.find((t) => t.mode !== 'disabled') || tracks.find((t) => /^en/i.test(t.language)) || tracks[0];
  if (!t) return '';
  if (t.mode === 'disabled') t.mode = 'hidden'; // load cues without drawing them
  return [...(t.activeCues || [])].map((c) => c.text.replace(/<[^>]+>/g, '')).join(' ');
}

function tick() {
  const v = activeVideo();
  if (!v || v.paused) return;
  if (!ducked.has(v)) { ducked.set(v, v.volume); v.volume *= duck; }
  const text = captionText(v).trim();
  if (text) {
    const added = newWords(prev, text);
    prev = text;
    if (added.length) { buf.push(...added); lastNew = Date.now(); }
  }
  const s = buf.join(' ');
  // Flush on sentence end, long buffer, or a pause in speech (auto captions have little punctuation).
  if (buf.length && (/[.?!…]["')\]]?$/.test(s) || buf.length >= 25 || Date.now() - lastNew > 800)) {
    send({ type: 'say', text: s });
    buf = [];
  }
}

function apply(s) {
  duck = s.duck;
  for (const [v, vol] of ducked) v.volume = vol;
  ducked.clear();
  clearInterval(timer);
  timer = s.on && setInterval(tick, 250);
  if (!s.on) send({ type: 'stop' });
}

// Media events don't bubble, but a capturing listener on document still sees them.
document.addEventListener('pause', () => timer && send({ type: 'stop' }), true);
document.addEventListener('seeking', () => { if (timer) { buf = []; prev = ''; send({ type: 'stop' }); } }, true);

chrome.storage.local.get(DEFAULTS, apply);
chrome.storage.onChanged.addListener(() => chrome.storage.local.get(DEFAULTS, apply));
