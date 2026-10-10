// shortcut: unofficial keyless Google Translate endpoint, may rate-limit; swap for an official API if it starts failing.
async function translate(text) {
  const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=' + encodeURIComponent(text));
  return (await r.json())[0].map((s) => s[0]).join('');
}

const translations = new Map(); // sentence id -> Promise<vi>, shared by its 'load' (ahead of time) and 'play'
function vi(id, text) {
  if (!translations.has(id)) {
    translations.set(id, translate(text).catch((e) => { translations.delete(id); console.warn('translate failed', e); return ''; }));
  }
  return translations.get(id);
}

let creating;
// MV3 service workers can't play audio, so playback lives in an offscreen document (Chrome closes it when idle).
async function toOffscreen(msg) {
  if (!(await chrome.offscreen.hasDocument())) {
    if (!msg.vi) return; // nothing is playing, so nothing to stop
    await (creating ??= chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Phát giọng đọc tiếng Việt' }).finally(() => (creating = null)));
  }
  chrome.runtime.sendMessage({ ...msg, target: 'offscreen' }).catch((e) => console.warn('offscreen message failed', e));
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg.text) return void toOffscreen(msg); // stop / reset
  vi(msg.id, msg.text).then((t) => t && toOffscreen({ ...msg, vi: t }));
});
