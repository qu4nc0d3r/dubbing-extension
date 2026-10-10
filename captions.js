const END = /[.?!…]["')\]]?$/;

// Words in `next` not already shown in `prev`: rolling captions drop old words off the front and append new ones.
function newWords(prev, next) {
  const a = prev.split(/\s+/).filter(Boolean), b = next.split(/\s+/).filter(Boolean);
  for (let k = Math.min(a.length, b.length); k > 0; k--) {
    if (a.slice(-k).join(' ') === b.slice(0, k).join(' ')) return b.slice(k);
  }
  return b;
}

// YouTube json3 caption track -> cues in seconds; auto captions arrive word by word via tOffsetMs.
function json3Cues(json) {
  const cues = [];
  for (const e of json.events || []) {
    for (const s of e.segs || []) {
      const text = (s.utf8 || '').trim();
      if (text) cues.push({ start: (e.tStartMs + (s.tOffsetMs || 0)) / 1000, end: (e.tStartMs + (e.dDurationMs || 0)) / 1000, text });
    }
  }
  return cues;
}

// Merge cues into sentences so each translates well and gets its own time slot. Tracks without
// punctuation (auto captions) split on pauses; nothing runs past 10s.
function toSentences(cues) {
  const punct = cues.some((c) => END.test(c.text));
  const out = [];
  let cur = null, prevStart = 0;
  for (const c of cues) {
    if (cur && (c.start - cur.start > 10 || (!punct && c.start - prevStart > 0.8))) { out.push(cur); cur = null; }
    if (cur) { cur.text += ' ' + c.text; cur.end = Math.max(cur.end, c.end); } else cur = { ...c };
    prevStart = c.start;
    if (END.test(c.text)) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}

if (typeof module === 'object') module.exports = { newWords, json3Cues, toSentences };
