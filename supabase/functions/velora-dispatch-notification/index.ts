import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-velora-internal-secret",
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return Response.json(
        { error: "METHOD_NOT_ALLOWED" },
        { status: 405, headers: corsHeaders },
      );
    }

    const internalSecret = req.headers.get("x-velora-internal-secret");
    const authCheck = await admin.rpc(
      "velora_validate_notification_dispatch_secret",
      { p_secret: internalSecret },
    );

    if (authCheck.error || authCheck.data !== true) {
      return Response.json(
        { error: "UNAUTHORIZED" },
        { status: 401, headers: corsHeaders },
      );
    }

    const body = await req.json().catch(() => ({}));
    const notificationId =
      typeof body?.notification_id === "string" ? body.notification_id : "";

    if (!notificationId) {
      return Response.json(
        { error: "NOTIFICATION_ID_REQUIRED" },
        { status: 400, headers: corsHeaders },
      );
    }

    const notificationResult = await admin
      .from("notifications")
      .select("id,user_id,type,title,body,entity_type,entity_id,created_at")
      .eq("id", notificationId)
      .maybeSingle();

    if (notificationResult.error) {
      return Response.json(
        { error: "NOTIFICATION_UNAVAILABLE" },
        { status: 500, headers: corsHeaders },
      );
    }

    const notification = notificationResult.data;
    if (!notification) {
      return Response.json(
        { error: "NOTIFICATION_NOT_FOUND" },
        { status: 404, headers: corsHeaders },
      );
    }

    if (notification.type === "push_test") {
      return Response.json(
        { ok: true, skipped: "push_test" },
        { status: 200, headers: corsHeaders },
      );
    }

    const configResult = await admin.rpc("velora_get_push_sender_config");
    if (configResult.error) {
      return Response.json(
        { error: "PUSH_CONFIG_UNAVAILABLE" },
        { status: 500, headers: corsHeaders },
      );
    }

    const config = Array.isArray(configResult.data)
      ? configResult.data[0]
      : configResult.data;

    if (
      !config?.vapid_public_key ||
      !config?.vapid_private_key ||
      !config?.vapid_subject
    ) {
      return Response.json(
        { error: "PUSH_CONFIG_INCOMPLETE" },
        { status: 500, headers: corsHeaders },
      );
    }

    const subscriptionResult = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", notification.user_id)
      .eq("active", true);

    if (subscriptionResult.error) {
      return Response.json(
        { error: "SUBSCRIPTIONS_UNAVAILABLE" },
        { status: 500, headers: corsHeaders },
      );
    }

    const subscriptions = subscriptionResult.data ?? [];
    if (!subscriptions.length) {
      return Response.json(
        {
          ok: true,
          notification_id: notification.id,
          subscriptions: 0,
          sent: 0,
        },
        { status: 200, headers: corsHeaders },
      );
    }

    webpush.setVapidDetails(
      config.vapid_subject,
      config.vapid_public_key,
      config.vapid_private_key,
    );

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body ?? "",
      url: "/",
      tag: "velora-" + notification.type + "-" + notification.id,
    });

    let sent = 0;
    let skipped = 0;
    let removed = 0;
    const errors: Array<{ subscription_id: string; status?: number }> = [];

    for (const subscription of subscriptions) {
      const claimResult = await admin.rpc("velora_claim_push_delivery", {
        p_notification_id: notification.id,
        p_subscription_id: subscription.id,
      });

      if (claimResult.error) {
        errors.push({
          subscription_id: subscription.id,
          detail: "DELIVERY_CLAIM_FAILED",
        });
        continue;
      }

      if (claimResult.data !== true) {
        skipped += 1;
        continue;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
          { TTL: 3600 },
        );

        const deliveredResult = await admin.rpc("velora_mark_push_delivery", {
          p_notification_id: notification.id,
          p_subscription_id: subscription.id,
        });

        if (deliveredResult.error || deliveredResult.data !== true) {
          errors.push({
            subscription_id: subscription.id,
            detail: "DELIVERY_MARK_FAILED",
          });
          continue;
        }

        sent += 1;
      } catch (error) {
        await admin.rpc("velora_unmark_push_delivery", {
          p_notification_id: notification.id,
          p_subscription_id: subscription.id,
        });

        const status =
          typeof (error as { statusCode?: unknown })?.statusCode === "number"
            ? (error as { statusCode: number }).statusCode
            : undefined;

        const rawBody = (error as { body?: unknown })?.body;
        const detail = typeof rawBody === "string" ? rawBody.slice(0, 800) : undefined;
        errors.push({ subscription_id: subscription.id, status, detail });

        if (status === 404 || status === 410) {
          await admin
            .from("push_subscriptions")
            .update({
              active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
          removed += 1;
        }
      }
    }

    return Response.json(
      {
        ok: sent > 0 || skipped > 0 || subscriptions.length === 0,
        notification_id: notification.id,
        subscriptions: subscriptions.length,
        sent,
        skipped,
        removed,
        errors,
      },
      {
        status: sent > 0 || skipped > 0 ? 200 : 502,
        headers: corsHeaders,
      },
    );
  },
};
