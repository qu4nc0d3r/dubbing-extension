const DEFAULTS = { on: false, duck: 0.2 };
let duck = DEFAULTS.duck, timer, inAd = false, ytPlan = [], loaded = new Set(), fired = '', prev = '', buf = [], bufStart = 0, lastNew = 0;
const ducked = new Map(); // video -> volume before ducking

const send = (msg) => chrome.runtime.sendMessage(msg).catch(() => {}); // worker restarting / extension reloaded

function reset() {
  loaded.clear(); fired = ''; buf = []; prev = '';
  send({ type: 'reset' });
}

// youtube.js forwards the caption track the player downloads; a new video or caption language replaces it.
window.addEventListener('message', (e) => {
  if (e.source !== window || typeof e.data?.dubbingTimedtext !== 'string') return;
  try { ytPlan = toSentences(json3Cues(JSON.parse(e.data.dubbingTimedtext))); reset(); } catch {} // not json3: keep the live fallback
});
document.addEventListener('yt-navigate-start', () => { ytPlan = []; reset(); });

function activeVideo() {
  const vs = [...document.querySelectorAll('video')];
  return vs.find((v) => !v.paused) || vs[0];
}

function trackCues(v) {
  const tracks = [...v.textTracks].filter((t) => t.kind === 'subtitles' || t.kind === 'captions');
  const t = tracks.find((t) => t.mode !== 'disabled') || tracks.find((t) => /^en/i.test(t.language)) || tracks[0];
  if (!t) return [];
  if (t.mode === 'disabled') t.mode = 'hidden'; // load cues without drawing them
  return [...(t.cues || [])].map((c) => ({ start: c.startTime, end: c.endTime, text: c.text.replace(/<[^>]+>/g, '').trim() })).filter((c) => c.text);
}

function tick() {
  const v = activeVideo();
  // YouTube ads reuse the video element and may start without a pause event: silence the sentence in progress and wait.
  if (document.querySelector('.ad-showing')) { if (!inAd) send({ type: 'stop' }); inAd = true; return; }
  inAd = false;
  if (!v || v.paused) return;
  // YouTube re-applies its own volume (e.g. after ads), so re-duck whenever the volume isn't what we set.
  if (!ducked.has(v) || Math.abs(v.volume - ducked.get(v) * duck) > 0.01) { ducked.set(v, v.volume); v.volume *= duck; }
  const t = v.currentTime, plan = ytPlan.length ? ytPlan : toSentences(trackCues(v));
  if (!plan.length) return liveCaptions(v, t);
  plan.forEach((s, i) => {
    const id = s.start + '|' + s.text;
    if (s.start > t - 1 && s.start < t + 20 && !loaded.has(id)) { loaded.add(id); send({ type: 'load', id, text: s.text }); }
    if (s.start <= t && t < s.start + 0.5 && fired !== id) {
      fired = id;
      // Fit the Vietnamese into the time before the next sentence so it stays with the speaker.
      send({ type: 'play', id, text: s.text, at: Date.now(), slot: ((plan[i + 1]?.start ?? s.end) - t) / v.playbackRate });
    }
  });
}

// No timed captions yet (e.g. the YouTube track download wasn't seen): dub what's on screen, a little behind.
function liveCaptions(v, t) {
  const text = [...document.querySelectorAll('.ytp-caption-segment')].map((s) => s.textContent).join(' ').trim();
  if (text) {
    const added = newWords(prev, text);
    prev = text;
    if (added.length) { if (!buf.length) bufStart = t; buf.push(...added); lastNew = Date.now(); }
  }
  const s = buf.join(' ');
  if (buf.length && (END.test(s) || buf.length >= 25 || Date.now() - lastNew > 800)) {
    send({ type: 'play', id: t + '|' + s, text: s, at: Date.now(), slot: Math.max(t - bufStart, 2) / v.playbackRate });
    buf = [];
  }
}

function apply(s) {
  duck = s.duck;
  for (const [v, vol] of ducked) v.volume = vol;
  ducked.clear();
  if (!s.on && timer) reset(); // only when switching off, not on every page load
  clearInterval(timer);
  timer = s.on && setInterval(tick, 100);
}

// Media events don't bubble, but a capturing listener on document still sees them.
document.addEventListener('pause', () => timer && send({ type: 'stop' }), true);
document.addEventListener('seeking', () => timer && reset(), true);

chrome.storage.local.get(DEFAULTS, apply);
chrome.storage.onChanged.addListener(() => chrome.storage.local.get(DEFAULTS, apply));
