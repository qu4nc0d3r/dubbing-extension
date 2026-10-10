// shortcut: unofficial keyless Google Translate endpoint, may rate-limit; swap for an official API if it starts failing.
async function translate(text) {
  const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=' + encodeURIComponent(text));
  return (await r.json())[0].map((s) => s[0]).join('');
}

let chain = Promise.resolve(), gen = 0, queue = [], speaking = false;

function next() {
  if (speaking || !queue.length) return;
  speaking = true;
  chrome.tts.speak(queue.shift(), {
    lang: 'vi-VN',
    rate: Math.min(1.15 + queue.length * 0.3, 2), // speed up when falling behind the video
    onEvent: (e) => {
      if (['end', 'interrupted', 'cancelled', 'error'].includes(e.type)) { speaking = false; next(); }
    },
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'stop') { gen++; queue = []; chrome.tts.stop(); return; }
  // Translate in parallel but speak in arrival order; drop results that land after a stop.
  const g = gen, p = translate(msg.text).catch((e) => (console.warn('translate failed', e), ''));
  chain = chain.then(() => p).then((vi) => { if (vi && g === gen) { queue.push(vi); next(); } });
});
