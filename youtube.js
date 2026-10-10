// Runs in the page so it sees YouTube's own caption downloads: fetching the track directly returns nothing without the player's token.
const isCaptions = (url) => String(url).includes('/api/timedtext');
const forward = (text) => text && window.postMessage({ dubbingTimedtext: text }, '*');

const fetch0 = window.fetch;
window.fetch = async function (input, init) {
  const r = await fetch0.call(this, input, init);
  if (isCaptions(input instanceof Request ? input.url : input)) r.clone().text().then(forward, () => {});
  return r;
};

const open0 = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
  if (isCaptions(url)) {
    this.addEventListener('load', () => {
      const r = this.response;
      forward(typeof r === 'string' ? r : r instanceof ArrayBuffer ? new TextDecoder().decode(r) : JSON.stringify(r));
    });
  }
  return open0.call(this, method, url, ...rest);
};
