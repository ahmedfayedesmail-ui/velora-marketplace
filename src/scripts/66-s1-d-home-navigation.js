/* ============================================================
   VELORA — Home navigation clarity
   Makes the existing clickable Velora mark explicit on mobile.
   ============================================================ */
(function () {
  'use strict';

  function mountHomeCue() {
    const logo = document.querySelector('.header .logo');
    if (!logo) return;

    logo.setAttribute('aria-label', 'Go to Velora home');
    logo.setAttribute('title', 'Home');

    if (!logo.querySelector('.logo-home-cue')) {
      const cue = document.createElement('span');
      cue.className = 'logo-home-cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.textContent = '⌂ Home';
      logo.appendChild(cue);
    }
  }

  function ensureStyles() {
    if (document.getElementById('veloraHomeCueStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraHomeCueStyle';
    style.textContent = [
      '.logo-home-cue{display:none;font-size:.72rem;font-weight:800;line-height:1;padding:.32rem .5rem;border:1px solid var(--border);border-radius:999px;background:var(--bg-alt);-webkit-text-fill-color:var(--primary);margin-left:.15rem;}',
      '@media(max-width:800px){.header .logo{gap:.38rem}.header .logo-home-cue{display:inline-flex;align-items:center;white-space:nowrap;}}',
      '@media(max-width:430px){.header .logo-home-cue{font-size:.66rem;padding:.28rem .42rem}.header .logo-icon{font-size:1.4rem;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function init() {
    ensureStyles();
    mountHomeCue();
    const header = document.querySelector('.header');
    if (header && typeof MutationObserver === 'function') {
      const observer = new MutationObserver(mountHomeCue);
      observer.observe(header, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('hashchange', mountHomeCue);
})();