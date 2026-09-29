import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import webpush from "npm:web-push";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return Response.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405, headers: corsHeaders });
    }

    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ error: "AUTH_REQUIRED" }, { status: 401, headers: corsHeaders });
    }

    const configResult = await ctx.supabaseAdmin.rpc("velora_get_push_sender_config");
    if (configResult.error) {
      return Response.json({ error: "PUSH_CONFIG_UNAVAILABLE" }, { status: 500, headers: corsHeaders });
    }

    const config = Array.isArray(configResult.data) ? configResult.data[0] : configResult.data;
    if (!config?.vapid_public_key || !config?.vapid_private_key || !config?.vapid_subject) {
      return Response.json({ error: "PUSH_CONFIG_INCOMPLETE" }, { status: 500, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : "Velora test notification";
    const message =
      typeof body?.body === "string" && body.body.trim()
        ? body.body.trim().slice(0, 240)
        : "✅ Push notifications are working on your phone.";
    const url =
      typeof body?.url === "string" && body.url.startsWith("/")
        ? body.url
        : "/";

    const subscriptionResult = await ctx.supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId)
      .eq("active", true);

    if (subscriptionResult.error) {
      return Response.json({ error: "SUBSCRIPTIONS_UNAVAILABLE" }, { status: 500, headers: corsHeaders });
    }

    const subscriptions = subscriptionResult.data || [];
    if (!subscriptions.length) {
      return Response.json({ error: "NO_ACTIVE_PUSH_SUBSCRIPTION" }, { status: 409, headers: corsHeaders });
    }

    const inserted = await ctx.supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type: "push_test",
        title,
        body: message,
        entity_type: "system",
        entity_id: null,
      })
      .select("id")
      .single();

    if (inserted.error) {
      return Response.json({ error: "NOTIFICATION_CREATE_FAILED" }, { status: 500, headers: corsHeaders });
    }

    webpush.setVapidDetails(
      config.vapid_subject,
      config.vapid_public_key,
      config.vapid_private_key,
    );

    let sent = 0;
    let removed = 0;
    const errors: Array<{ subscription_id: string; status?: number }> = [];

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({ title, body: message, url, tag: "velora-push-test" }),
          { TTL: 3600 },
        );

        await ctx.supabaseAdmin.rpc("velora_mark_push_delivery", {
          p_notification_id: inserted.data.id,
          p_subscription_id: subscription.id,
        });
        sent += 1;
      } catch (error) {
        const status = typeof error?.statusCode === "number" ? error.statusCode : undefined;
        errors.push({ subscription_id: subscription.id, status });

        if (status === 404 || status === 410) {
          await ctx.supabaseAdmin
            .from("push_subscriptions")
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq("id", subscription.id);
          removed += 1;
        }
      }
    }

    return Response.json(
      {
        ok: sent > 0,
        notification_id: inserted.data.id,
        subscriptions: subscriptions.length,
        sent,
        removed,
        errors,
      },
      { status: sent > 0 ? 200 : 502, headers: corsHeaders },
    );
  }),
};
