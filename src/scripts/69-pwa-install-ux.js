/* ============================================================
   VELORA — PWA install prompt mobile hardening
   Keeps the install card's close control clear of floating actions.
   ============================================================ */
(function () {
  'use strict';

  const TARGET_TEXT = 'Install Velora';

  function hasTargetText(node) {
    return !!node && typeof node.textContent === 'string' &&
      node.textContent.toLowerCase().includes(TARGET_TEXT.toLowerCase());
  }

  function isCandidate(el) {
    if (!(el instanceof HTMLElement)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 260 || rect.height < 60) return false;
    const pos = getComputedStyle(el).position;
    return pos === 'fixed' || pos === 'sticky' || pos === 'absolute';
  }

  function findPrompt() {
    const nodes = document.querySelectorAll('body *');
    for (let i = nodes.length - 1; i >= 0; i -= 1) {
      const node = nodes[i];
      if (!hasTargetText(node)) continue;

      let el = node;
      for (let depth = 0; depth < 6 && el; depth += 1, el = el.parentElement) {
        if (isCandidate(el)) return el;
      }
    }
    return null;
  }

  function hardenPrompt() {
    const prompt = findPrompt();
    if (!prompt) return;

    prompt.classList.add('velora-install-prompt');

    const closeButtons = prompt.querySelectorAll('button');
    closeButtons.forEach((button) => {
      const label = (button.getAttribute('aria-label') || button.title || button.textContent || '').trim().toLowerCase();
      if (label === '×' || label === '✕' || label.includes('close') || label.includes('cerrar') || label.includes('إغلاق')) {
        button.classList.add('velora-install-prompt-close');
      }
    });
  }

  function ensureStyles() {
    if (document.getElementById('veloraInstallPromptMobileStyle')) return;

    const style = document.createElement('style');
    style.id = 'veloraInstallPromptMobileStyle';
    style.textContent = [
      '.velora-install-prompt{z-index:1080!important;position:fixed!important;}',
      '.velora-install-prompt{padding-right:6.5rem!important;}',
      '.velora-install-prompt-close{position:absolute!important;right:.7rem!important;top:.7rem!important;z-index:30!important;width:2.6rem!important;height:2.6rem!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;}',
      '@media(max-width:700px){.velora-install-prompt{max-width:calc(100vw - 1rem)!important;right:.5rem!important;left:.5rem!important;bottom:.55rem!important;}}',
      '@media(min-width:701px){.velora-install-prompt{max-width:calc(100vw - 2rem)!important;}}',
      '@media(max-width:430px){.velora-install-prompt{padding-right:5.2rem!important;}.velora-install-prompt-close{right:.45rem!important;top:.45rem!important;width:2.35rem!important;height:2.35rem!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function init() {
    ensureStyles();
    hardenPrompt();

    if (typeof MutationObserver === 'function' && document.body) {
      const observer = new MutationObserver(hardenPrompt);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    window.setTimeout(hardenPrompt, 250);
    window.setTimeout(hardenPrompt, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
