const on = document.getElementById('on'), duck = document.getElementById('duck');
chrome.storage.local.get({ on: false, duck: 0.2 }, (s) => { on.checked = s.on; duck.value = s.duck; });
on.onchange = () => chrome.storage.local.set({ on: on.checked });
duck.onchange = () => chrome.storage.local.set({ duck: +duck.value });
chrome.tts.getVoices((vs) => {
  if (!vs.some((v) => v.lang?.startsWith('vi'))) document.getElementById('hint').textContent = 'Máy này chưa có giọng đọc tiếng Việt cho Chrome.';
});
