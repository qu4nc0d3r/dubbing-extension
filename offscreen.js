let queue = [], audio = null;

function next() {
  if (audio || !queue.length) return;
  const a = audio = new Audio(queue.shift());
  a.playbackRate = Math.min(1.15 + queue.length * 0.3, 2); // speed up when falling behind the video
  const done = () => { if (audio === a) { audio = null; next(); } };
  a.onended = a.onerror = done;
  a.play().catch(done);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'stop') { queue = []; audio?.pause(); audio = null; }
  if (msg.type !== 'play') return;
  // shortcut: unofficial Google Translate voice, max ~200 chars per request and may rate-limit; swap for a paid TTS API if it breaks.
  for (const part of msg.text.match(/.{1,200}(\s|$)/g)) {
    queue.push('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=' + encodeURIComponent(part.trim()));
  }
  next();
});
