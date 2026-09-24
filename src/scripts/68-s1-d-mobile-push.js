/* ============================================================
   VELORA S1-D — MOBILE WEB PUSH
   ------------------------------------------------------------
   Customer opt-in only. No permission prompt on page load.
   Subscription is persisted through authenticated Supabase RPC.
   ============================================================ */
(function () {
  'use strict';

  var VAPID_PUBLIC_KEY = 'BK0OWJTIQ3L62VXZUkoVCyrZkhBSTuajYcusoOcckLId7poLrHYE129EHGh9Kdrb62jrXlCx0rOKtLJv405mfCU';
  var ROOT_ID = 'veloraPushEnableButton';

  function client() {
    return window.mahaSupabase || window.supabaseClient || window.sb || null;
  }

  function toast(message, type) {
    if (typeof showToast === 'function') showToast(message, type || 'success');
  }

  function base64UrlToBytes(base64Url) {
    var padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
    var base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var output = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
  }

  async function currentUser() {
    var sb = client();
    if (!sb || !sb.auth) return null;
    var result = await sb.auth.getUser();
    if (result.error) return null;
    return result.data && result.data.user ? result.data.user : null;
  }

  async function saveSubscription(subscription) {
    var sb = client();
    if (!sb || typeof sb.rpc !== 'function') throw new Error('SUPABASE_UNAVAILABLE');

    var json = subscription.toJSON();
    var keys = json.keys || {};

    var result = await sb.rpc('velora_register_push_subscription', {
      p_endpoint: json.endpoint,
      p_p256dh: keys.p256dh,
      p_auth: keys.auth,
      p_user_agent: navigator.userAgent || null
    });

    if (result.error) throw result.error;
    return result.data;
  }

  async function enablePush() {
    var user = await currentUser();
    if (!user) {
      toast('Please sign in first.', 'warning');
      return false;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      toast('Mobile notifications are not supported in this browser.', 'warning');
      return false;
    }

    var permission = Notification.permission;
    if (permission === 'denied') {
      toast('Notifications are blocked for Velora in your browser settings.', 'warning');
      return false;
    }

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      toast('Notification permission was not granted.', 'warning');
      return false;
    }

    var registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    var existing = await registration.pushManager.getSubscription();
    var subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY)
    });

    await saveSubscription(subscription);
    localStorage.setItem('velora_push_enabled', '1');
    renderButtonState();
    toast('✅ Velora notifications are enabled on this phone.', 'success');
    return true;
  }

  async function disablePush() {
    var registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return;

    var subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    var endpoint = subscription.endpoint;
    var sb = client();
    if (sb && typeof sb.rpc === 'function') {
      try {
        await sb.rpc('velora_unregister_push_subscription', { p_endpoint: endpoint });
      } catch (_) {}
    }

    await subscription.unsubscribe();
    localStorage.removeItem('velora_push_enabled');
    renderButtonState();
    toast('Mobile notifications disabled.', 'success');
  }

  function addButton() {
    var header = document.querySelector('#notifDropdown .notif-header');
    if (!header || document.getElementById(ROOT_ID)) return;
    var button = document.createElement('button');
    button.id = ROOT_ID;
    button.type = 'button';
    button.textContent = 'Enable on this phone';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      enablePush().catch(function (error) {
        console.warn('Velora push enable:', error);
        toast('Could not enable mobile notifications right now.', 'warning');
      });
    });
    header.appendChild(button);
  }

  async function renderButtonState() {
    var button = document.getElementById(ROOT_ID);
    if (!button) return;

    try {
      var registration = await navigator.serviceWorker.getRegistration('/');
      var subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;
      button.textContent = subscription ? 'Disable on this phone' : 'Enable on this phone';
      button.onclick = null;
      button.addEventListener('click', function once(event) {
        event.preventDefault();
        event.stopPropagation();
        if (subscription) {
          disablePush().catch(function (error) {
            console.warn('Velora push disable:', error);
          });
        } else {
          enablePush().catch(function (error) {
            console.warn('Velora push enable:', error);
            toast('Could not enable mobile notifications right now.', 'warning');
          });
        }
      }, { once: true });
    } catch (_) {}
  }

  function observeBell() {
    if (typeof MutationObserver !== 'function' || !document.body) return;
    var observer = new MutationObserver(function () {
      addButton();
      renderButtonState();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    addButton();
    renderButtonState();
  }

  window.veloraEnableMobilePush = enablePush;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeBell, { once: true });
  } else {
    observeBell();
  }
})();
