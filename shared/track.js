// Reports a finished export for "time saved": which tool, how many files, and how long someone
// actively worked on it. Active = the tab is visible and there was a mouse, keyboard or touch
// action in the last minute; leaving a tool open does not count. The time runs from opening
// the tool (or the previous export) to this export. Tools call tbTrack(files) after a real export.
(function () {
  const tool = location.pathname.replace(/index\.html$/, '').replace(/([^/])$/, '$1/');   // e.g. /banner-generator/
  const IDLE = 60 * 1000;
  let active = 0, last = Date.now(), lastInput = Date.now();

  const touch = () => { lastInput = Date.now(); };
  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'input', 'dragover', 'drop'].forEach(e => addEventListener(e, touch, { passive: true, capture: true }));
  setInterval(() => {
    const now = Date.now();
    if (document.visibilityState === 'visible' && now - lastInput < IDLE) active += now - last;
    last = now;
  }, 1000);

  window.tbTrack = function (files) {
    const seconds = Math.round(active / 1000);
    active = 0;   // the next export is measured from here
    if (location.protocol === 'file:') return;
    const body = JSON.stringify({ tool, items: Math.max(1, files || 1), seconds });
    fetch('/api/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => { });
  };
})();
