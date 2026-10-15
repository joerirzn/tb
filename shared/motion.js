// Toolbox motion helpers (see motion.css).
//   tbIn(el, delay)  play the entry animation on something that just appeared
// On its own it also fades in images once they have loaded, and fades in a
// message (role=alert/status, .msg, .status, .note) whenever its text changes.
(function () {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.tbIn = function (el, delay) {
    if (!el || reduce) return;
    el.classList.remove('tb-in');
    void el.offsetWidth;                                  // restart the animation
    el.style.animationDelay = delay ? delay + 'ms' : '';
    el.classList.add('tb-in');
    el.addEventListener('animationend', () => { el.classList.remove('tb-in'); el.style.animationDelay = ''; }, { once: true });
  };

  function fadeImage(img) {
    if (reduce || img.complete || img.dataset.tbImg) return;
    img.dataset.tbImg = '1';
    img.classList.add('tb-img');
    const done = () => img.classList.add('tb-img-in');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }

  const MESSAGE = '[role="alert"], [role="status"], .msg, .status, .fitnote';
  function fadeMessage(el) {
    if (reduce || !el.textContent.trim()) return;
    el.classList.remove('tb-fade'); void el.offsetWidth; el.classList.add('tb-fade');
  }

  function start() {
    document.querySelectorAll('img').forEach(fadeImage);
    new MutationObserver(list => {
      for (const m of list) {
        // a message element whose own text was replaced (not a whole new form being built)
        if (m.type === 'childList' && m.target.nodeType === 1 && m.target.matches(MESSAGE)) fadeMessage(m.target);
        m.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          if (n.tagName === 'IMG') fadeImage(n);
          else if (n.querySelectorAll) n.querySelectorAll('img').forEach(fadeImage);
        });
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
