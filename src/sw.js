/* Velora Web Push Service Worker */
self.addEventListener('push', function(event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data ? event.data.text() : '' };
  }

  var title = data.title || 'Velora';
  var options = {
    body: data.body || 'You have a new update from Velora.',
    tag: data.tag || ('velora-' + Date.now()),
    renotify: false,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var target = event.notification && event.notification.data
    ? event.notification.data.url || '/'
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          if (target && client.url !== new URL(target, self.location.origin).href) {
            try { client.navigate(target); } catch (_) {}
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
