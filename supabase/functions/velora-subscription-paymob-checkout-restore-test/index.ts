import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

const BASE = "https://accept.paymob.com";
const cents = (n: number) => Math.round(n * 100);

async function markInitializationFailed(
  supabase: ReturnType<typeof createClient>,
  paymentAttemptId: string,
  failureCode: string,
  failureReason: string,
  cancelPendingSubscription: boolean,
) {
  const { error } = await supabase.rpc(
    "velora_mark_subscription_payment_initialization_failed",
    {
      p_payment_attempt_id: paymentAttemptId,
      p_failure_code: failureCode,
      p_failure_reason: failureReason,
      p_cancel_pending_subscription: cancelPendingSubscription,
    },
  );
  if (error) throw error;
}

function billing(profile: Record<string, unknown>, seller: Record<string, unknown>) {
  const name = String(profile.full_name || seller.store_name || "Velora Seller").trim() || "Velora Seller";
  const parts = name.split(/\s+/);
  const first = parts.shift() || "Velora";
  const last = parts.join(" ") || "Seller";
  return {
    apartment: "NA",
    building: "NA",
    floor: "NA",
    street: "NA",
    city: "Cairo",
    state: "Cairo",
    country: "EG",
    postal_code: "NA",
    first_name: first.slice(0, 50),
    last_name: last.slice(0, 50),
    email: String(profile.email || "").trim(),
    phone_number: String(seller.phone || "+200000000000").trim() || "+200000000000",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const getServiceKey = () => {
      const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.default) return String(parsed.default);
        } catch (_) {}
      }
      return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    };
    const recoverProviderSession = async (paymentAttemptId: string, providerSessionId: string, providerOrderId: string) => {
      const serviceKey = getServiceKey();
      if (!serviceKey) throw new Error("SUPABASE_SERVER_CREDENTIALS_MISSING");
      const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey);
      const {data,error} = await admin.rpc("velora_recover_paymob_provider_session", {
        p_payment_attempt_id: paymentAttemptId,
        p_provider_session_id: providerSessionId,
        p_provider_order_id: providerOrderId,
      });
      if (error) throw error;
      return data;
    };

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) return json({ ok: false, code: "AUTH_REQUIRED" }, 401);

    const body = await req.json().catch(() => ({}));
    const planId = body?.plan_id;
    const countryCode = String(body?.country_code || "EG").toUpperCase();
    const billingCycle = String(body?.billing_cycle || "monthly").toLowerCase();
    const idempotencyKey = String(body?.idempotency_key || "").trim();
    const returnUrl = typeof body?.return_url === "string" && /^https?:\/\//i.test(body.return_url)
      ? body.return_url
      : undefined;
    let paymentAttemptId: string | null = null;
    let providerIntentCreated = false;

    if (!planId || !idempotencyKey) return json({ ok: false, code: "MISSING_REQUIRED_FIELDS" }, 400);
    if (countryCode !== "EG") return json({ ok: false, code: "PAYMOB_EGYPT_ONLY" }, 400);

    const { data: startRows, error: startError } = await supabase.rpc(
      "velora_start_subscription_purchase",
      {
        p_plan_id: planId,
        p_country_code: countryCode,
        p_billing_cycle: billingCycle,
        p_idempotency_key: idempotencyKey,
      },
    );
    if (startError) throw startError;
    const start = Array.isArray(startRows) ? startRows[0] : startRows;
    if (!start?.subscription_id || !start?.payment_attempt_id) {
      throw new Error("subscription_payment_not_created");
    }
    paymentAttemptId = String(start.payment_attempt_id);

    if (String(start.provider_code || "").toLowerCase() !== "paymob") {
      await markInitializationFailed(
        supabase,
        paymentAttemptId,
        "PAYMOB_ROUTE_NOT_SELECTED",
        "Paymob route was not selected for subscription checkout.",
        true,
      );
      return json({
        ok: true,
        status: "BLOCKED",
        code: "PAYMOB_ROUTE_NOT_SELECTED",
        data: start,
      }, 409);
    }

    const secretKey = Deno.env.get("PAYMOB_SECRET_KEY");
    const publicKey = Deno.env.get("PAYMOB_PUBLIC_KEY");
    const integrationId = Number(Deno.env.get("PAYMOB_INTEGRATION_ID") || "5920533");
    if (!secretKey || !publicKey) {
      await markInitializationFailed(
        supabase,
        paymentAttemptId,
        "PAYMOB_CREDENTIALS_MISSING",
        "Paymob credentials are not configured.",
        true,
      );
      return json({
        ok: false,
        status: "BLOCKED",
        code: "PAYMOB_CREDENTIALS_MISSING",
        subscription_id: start.subscription_id,
        payment_attempt_id: start.payment_attempt_id,
      }, 503);
    }

    const [{ data: profile, error: profileError }, { data: seller, error: sellerError }, { data: plan, error: planError }] =
      await Promise.all([
        supabase.from("profiles").select("full_name,email").eq("id", authData.user.id).maybeSingle(),
        supabase.from("sellers").select("store_name,phone").eq("user_id", authData.user.id).maybeSingle(),
        supabase.from("subscription_plans").select("name").eq("id", planId).maybeSingle(),
      ]);
    if (profileError) throw profileError;
    if (sellerError) throw sellerError;
    if (planError) throw planError;
    if (!profile) throw new Error("PROFILE_NOT_FOUND");
    if (!seller) throw new Error("SELLER_NOT_FOUND");

    const amount = Number(start.price);
    const currency = String(start.currency_code || "").toUpperCase();
    if (currency !== "EGP" || !Number.isFinite(amount) || amount <= 0) {
      await markInitializationFailed(
        supabase,
        paymentAttemptId,
        "PAYMOB_UNSUPPORTED_SUBSCRIPTION",
        "Resolved subscription amount or currency is not supported by the test Paymob adapter.",
        true,
      );
      return json({
        ok: false,
        status: "BLOCKED",
        code: "PAYMOB_UNSUPPORTED_SUBSCRIPTION",
        currency,
        amount,
      }, 400);
    }

    const notificationUrl =
      `${Deno.env.get("SUPABASE_URL") ?? ""}/functions/v1/velora-paymob-webhook-restore-test`;

    const payload = {
      amount: cents(amount),
      currency: "EGP",
      payment_methods: [integrationId],
      items: [{
        name: `Velora ${String(plan?.name || "Seller")} Subscription`,
        amount: cents(amount),
        description: `Velora seller subscription — ${billingCycle}`,
        quantity: 1,
      }],
      billing_data: billing(profile as Record<string, unknown>, seller as Record<string, unknown>),
      extras: {
        velora_seller_subscription_id: String(start.subscription_id),
        velora_payment_attempt_id: String(start.payment_attempt_id),
        velora_payment_flow: "initial_subscription",
      },
      special_reference: `velora-sub-${start.subscription_id}`,
      expiration: 1800,
      notification_url: notificationUrl,
      redirection_url: returnUrl,
    };

    const paymobResponse = await fetch(`${BASE}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const paymobJson = await paymobResponse.json();
    if (!paymobResponse.ok) {
      await markInitializationFailed(
        supabase,
        paymentAttemptId,
        "PAYMOB_INTENTION_CREATE_FAILED",
        String(paymobJson?.detail || paymobJson?.message || "paymob_error"),
        true,
      );
      return json({
        ok: false,
        status: "FAILED",
        code: "PAYMOB_INTENTION_CREATE_FAILED",
        subscription_id: start.subscription_id,
        payment_attempt_id: start.payment_attempt_id,
        provider_error: paymobJson?.detail || paymobJson?.message || "paymob_error",
      }, 502);
    }

    providerIntentCreated = true;
    const intentionId = paymobJson?.id;
    const intentionOrderId = paymobJson?.intention_order_id ?? paymobJson?.order_id;
    const clientSecret = paymobJson?.client_secret;
    if (!intentionId || !intentionOrderId) {
      throw new Error("PAYMOB_MISSING_INTENTION_FIELDS");
    }
    if (!clientSecret) {
      try {
        const recovery = await recoverProviderSession(
          paymentAttemptId,
          String(intentionId),
          String(intentionOrderId),
        );
        return json({
          ok: false,
          status: "FAILED",
          code: "PAYMOB_CLIENT_SECRET_MISSING",
          subscription_id: start.subscription_id,
          payment_attempt_id: start.payment_attempt_id,
          provider_session_recovered: Boolean(recovery?.ok),
          local_payment_attempt_status: "pending",
          recovery: "retry_subscription_checkout",
        }, 502);
      } catch (recoveryError) {
        console.error(
          "subscription_provider_session_recovery_failed",
          recoveryError instanceof Error ? recoveryError.message : "unknown_error",
        );
        return json({
          ok: false,
          status: "FAILED",
          code: "PAYMOB_PROVIDER_SESSION_RECOVERY_FAILED",
          subscription_id: start.subscription_id,
          payment_attempt_id: start.payment_attempt_id,
          local_payment_attempt_status: "pending",
          recovery: "manual_reconciliation_required",
        }, 502);
      }
    }

    let attachError: Error | null = null;
    let attach: unknown = null;
    for (let bindAttempt = 0; bindAttempt < 2; bindAttempt += 1) {
      const { data: attachData, error } = await supabase.rpc(
        "velora_attach_subscription_payment_provider_session",
        {
          p_payment_attempt_id: start.payment_attempt_id,
          p_provider_code: "paymob",
          p_provider_session_id: String(intentionId),
          p_provider_order_id: String(intentionOrderId),
        },
      );
      if (!error) {
        attach = attachData;
        attachError = null;
        break;
      }
      attachError = error;
      if (bindAttempt === 0) await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (attachError) {
      try {
        const recovery = await recoverProviderSession(
          paymentAttemptId,
          String(intentionId),
          String(intentionOrderId),
        );
        return json({
          ok: false,
          status: "FAILED",
          code: "PAYMOB_PROVIDER_SESSION_BIND_RECOVERED",
          subscription_id: start.subscription_id,
          payment_attempt_id: start.payment_attempt_id,
          provider_session_recovered: Boolean(recovery?.ok),
          local_payment_attempt_status: "pending",
          recovery: "retry_subscription_checkout",
        }, 502);
      } catch (recoveryError) {
        console.error(
          "subscription_provider_session_recovery_failed",
          recoveryError instanceof Error ? recoveryError.message : "unknown_error",
        );
        return json({
          ok: false,
          status: "FAILED",
          code: "PAYMOB_PROVIDER_SESSION_BIND_FAILED",
          subscription_id: start.subscription_id,
          payment_attempt_id: start.payment_attempt_id,
          local_payment_attempt_status: "pending",
          recovery: "manual_reconciliation_required",
        }, 502);
      }
    }

    return json({
      ok: true,
      status: "READY",
      provider: "paymob",
      environment: "test",
      subscription_id: start.subscription_id,
      payment_attempt_id: start.payment_attempt_id,
      intention_id: String(intentionId),
      provider_order_id: String(intentionOrderId),
      provider_session_attached: Boolean(attach?.ok),
      checkout_url: `${BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`,
    });
  } catch (error) {
    if (paymentAttemptId) {
      if (providerIntentCreated) {
        console.error(
          "subscription_provider_intent_unexpected_failure",
          error instanceof Error ? error.message : "unknown_error",
        );
      } else {
        try {
          await markInitializationFailed(
            supabase,
            paymentAttemptId,
            error instanceof Error ? error.name || "SUBSCRIPTION_CHECKOUT_FAILED" : "SUBSCRIPTION_CHECKOUT_FAILED",
            error instanceof Error ? error.message : "subscription_paymob_checkout_failed",
            true,
          );
        } catch (reconcileError) {
          console.error(
            "subscription_payment_initialization_reconcile_failed",
            reconcileError instanceof Error ? reconcileError.message : "unknown_error",
          );
        }
      }
    }
    return json({
      ok: false,
      status: "FAILED",
      error: error instanceof Error ? error.message : "subscription_paymob_checkout_failed",
      payment_attempt_id: paymentAttemptId,
      local_payment_attempt_status: providerIntentCreated ? "pending" : null,
      recovery: providerIntentCreated ? "retry_subscription_checkout_or_reconcile_provider_intention" : null,
    }, 400);
  }
});
