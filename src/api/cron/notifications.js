const webpush = require('web-push');

function json(res, status, body) {
  res.status(status).json(body);
}

async function supabaseFetch(path, options) {
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('SUPABASE_SERVER_ENV_MISSING');

  const response = await fetch(base + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(options && options.headers ? options.headers : {})
    }
  });

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

  if (!response.ok) {
    throw new Error('SUPABASE_' + response.status + ':' + (typeof data === 'string' ? data : JSON.stringify(data)));
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (!cronSecret || auth !== 'Bearer ' + cronSecret) {
    return json(res, 401, { error: 'UNAUTHORIZED' });
  }

  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY ||
    'BE5Yra8z7oNzKQdZ8qCfxOR5LPAqOdTsWuWMogdUeNRsfTWN_1ercDjb5A1LQuZrWgwWV0ovA5GIM55qD8Msmyc';
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPrivate || !vapidSubject) {
    return json(res, 503, { error: 'VAPID_NOT_CONFIGURED' });
  }

  try {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const created = await supabaseFetch(
      '/rest/v1/rpc/velora_process_notification_lifecycle',
      {
        method: 'POST',
        body: JSON.stringify({ p_limit: 100 })
      }
    );

    const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const notifications = await supabaseFetch(
      '/rest/v1/notifications?select=id,user_id,type,title,body,entity_type,entity_id,created_at' +
      '&type=in.(beauty_experience,replenishment)' +
      '&created_at=gte.' + encodeURIComponent(since) +
      '&order=created_at.desc&limit=100',
      { method: 'GET' }
    );

    const subscriptions = await supabaseFetch(
      '/rest/v1/push_subscriptions?select=id,user_id,endpoint,p256dh,auth&active=eq.true&limit=500',
      { method: 'GET' }
    );

    let attempted = 0;
    let delivered = 0;
    let expired = 0;

    for (const notification of Array.isArray(notifications) ? notifications : []) {
      const targets = (Array.isArray(subscriptions) ? subscriptions : [])
        .filter((s) => String(s.user_id) === String(notification.user_id));

      for (const sub of targets) {
        attempted += 1;

        const claim = await supabaseFetch(
          '/rest/v1/rpc/velora_mark_push_delivery',
          {
            method: 'POST',
            body: JSON.stringify({
              p_notification_id: notification.id,
              p_subscription_id: sub.id
            })
          }
        );

        if (claim !== true) {
          continue;
        }

        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            JSON.stringify({
              title: notification.title,
              body: notification.body,
              tag: notification.type + '-' + notification.id,
              url: '/#' + (notification.entity_type || 'account')
            }),
            { TTL: 86400 }
          );
          delivered += 1;
        } catch (error) {
          const status = error && error.statusCode;
          if (status === 404 || status === 410) {
            expired += 1;
            await supabaseFetch(
              '/rest/v1/rpc/velora_remove_push_subscription',
              {
                method: 'POST',
                body: JSON.stringify({ p_subscription_id: sub.id })
              }
            );
          }
          await supabaseFetch(
            '/rest/v1/rpc/velora_unmark_push_delivery',
            {
              method: 'POST',
              body: JSON.stringify({
                p_notification_id: notification.id,
                p_subscription_id: sub.id
              })
            }
          );
        }
      }
    }

    return json(res, 200, {
      ok: true,
      lifecycleNotificationsCreated: Number(created || 0),
      attempted,
      delivered,
      expired
    });
  } catch (error) {
    console.error('Velora notification cron:', error);
    return json(res, 500, { error: error.message || 'INTERNAL_ERROR' });
  }
};
