// Toolbox motion helpers (see motion.css).
//   tbIn(el, delay)          play the entry animation on something that just appeared
//   tbStagger(list, step)    the same for several things, one after another
//   tbCount(el, to, render)  count a number up to its value (render turns a number into the text/HTML)
//   tbBump(el)               a small hop, e.g. when a vote is added
// When a page opens, its header, settings and results come in one after another by themselves.
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

  window.tbStagger = function (list, step, start) {
    [].slice.call(list || []).filter(el => el && el.offsetParent !== null)
      .forEach((el, i) => window.tbIn(el, (start || 0) + Math.min(i, 12) * (step || 40)));
  };

  window.tbCount = function (el, to, render, ms) {
    if (!el) return;
    if (reduce || !to) { el.innerHTML = render(to); return; }
    const t0 = performance.now(), dur = ms || 900, ease = t => 1 - Math.pow(1 - t, 3);
    if (el._tbCount) cancelAnimationFrame(el._tbCount);
    const frame = now => {
      const t = Math.min(1, (now - t0) / dur);
      el.innerHTML = render(t < 1 ? to * ease(t) : to);
      if (t < 1) el._tbCount = requestAnimationFrame(frame);
    };
    el._tbCount = requestAnimationFrame(frame);
  };

  window.tbBump = function (el) {
    if (!el || reduce) return;
    el.classList.remove('tb-bump'); void el.offsetWidth; el.classList.add('tb-bump');
    el.addEventListener('animationend', () => el.classList.remove('tb-bump'), { once: true });
  };

  // a page opening: the header, then the settings step by step, then the result (or its cards one by one)
  function enter() {
    if (reduce) return;
    const header = document.querySelector('body > .app-header, .board > .app-header');
    const steps = document.querySelectorAll('.layout > .sidebar > *');
    const main = document.querySelector('.layout > .main');
    const cards = main ? main.querySelectorAll(':scope > .preview-block, :scope > .grid > *') : [];
    if (header) window.tbIn(header);
    window.tbStagger(steps, 45, 40);
    if (cards.length) window.tbStagger(cards, 35, 90);
    else if (main) window.tbIn(main, 90);
  }

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
    enter();
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
