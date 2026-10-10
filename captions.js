// Words in `next` not already shown in `prev`: rolling captions drop old words off the front and append new ones.
function newWords(prev, next) {
  const a = prev.split(/\s+/).filter(Boolean), b = next.split(/\s+/).filter(Boolean);
  for (let k = Math.min(a.length, b.length); k > 0; k--) {
    if (a.slice(-k).join(' ') === b.slice(0, k).join(' ')) return b.slice(k);
  }
  return b;
}

if (typeof module === 'object') module.exports = { newWords };
