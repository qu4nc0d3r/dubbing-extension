// shortcut: unofficial keyless Google Translate endpoint, may rate-limit; swap for an official API if it starts failing.
async function translate(text) {
  const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=' + encodeURIComponent(text));
  return (await r.json())[0].map((s) => s[0]).join('');
}

// MV3 service workers can't play audio, so playback lives in an offscreen document (Chrome closes it when idle).
async function speak(text) {
  if (!(await chrome.offscreen.hasDocument())) {
    await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Phát giọng đọc tiếng Việt' });
  }
  chrome.runtime.sendMessage({ type: 'play', text }).catch((e) => console.warn('play failed', e));
}

let chain = Promise.resolve(), gen = 0;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'stop') { gen++; return; } // offscreen.js receives the same message and silences playback
  if (msg.type !== 'say') return;
  // Translate in parallel but speak in arrival order; drop results that land after a stop.
  const g = gen, p = translate(msg.text).catch((e) => (console.warn('translate failed', e), ''));
  chain = chain.then(() => p).then((vi) => vi && g === gen && speak(vi)).catch((e) => console.warn('speak failed', e));
});
