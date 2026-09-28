
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { MockPaymobAdapter } from "./_shared/mock-paymob.ts";

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function authorize(req: Request, supabase: ReturnType<typeof createClient>) {
  const presented = req.headers.get("X-Velora-Scheduler-Token") ?? "";
  const expected = Deno.env.get("VELORA_SCHEDULER_TOKEN") ?? "";

  if (expected && presented) {
    const [a, b] = await Promise.all([sha256(presented), sha256(expected)]);
    if (constantTimeEqual(a, b)) return { ok: true };
  }

  // Restore-Test only: deterministic RT-SIM-4 invocation path.
  // The token is stored server-side in Supabase Vault and is never exposed
  // through the source, logs, or the user-facing response.
  const testPresented = req.headers.get("X-Velora-RT-SIM4-Token") ?? "";
  if (testPresented) {
    const testTokenResult = await supabase.rpc("velora_get_rt_sim4_scheduler_token_internal");
    if (!testTokenResult.error && testTokenResult.data) {
      const [a, b] = await Promise.all([sha256(testPresented), sha256(String(testTokenResult.data))]);
      if (constantTimeEqual(a, b)) return { ok: true, test_only: true };
    }
  }

  if (!expected) return { ok: false, status: 503, code: "SCHEDULER_SECRET_NOT_CONFIGURED" };
  if (!presented) return { ok: false, status: 401, code: "SCHEDULER_TOKEN_MISSING" };
  return { ok: false, status: 401, code: "SCHEDULER_TOKEN_INVALID" };
}

function getServiceKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.default) return String(parsed.default);
    } catch (_) {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const serviceKey = getServiceKey();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    if (!serviceKey || !supabaseUrl) {
      return json({ ok: false, code: "SUPABASE_SERVER_CREDENTIALS_MISSING" }, 503);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const auth = await authorize(req, supabase);
    if (!auth.ok) return json({ ok: false, code: auth.code }, auth.status);
    const hmacResult = await supabase.rpc("velora_get_mock_paymob_hmac_internal");
    if (hmacResult.error) throw hmacResult.error;

    const body = await req.json().catch(() => ({}));
    const batchRaw = Number(body?.batch_size ?? 1);
    const batchSize = Number.isInteger(batchRaw) && batchRaw > 0 ? Math.min(batchRaw, 15) : 1;
    const scenario = typeof body?.scenario === "string" ? body.scenario : "success";

    const claimedResult = await supabase.rpc("velora_run_renewal_batch", { p_batch_size: batchSize });
    if (claimedResult.error) throw claimedResult.error;

    const jobs = Array.isArray(claimedResult.data) ? claimedResult.data : claimedResult.data ? [claimedResult.data] : [];
    const webhookUrl = supabaseUrl + "/functions/v1/velora-paymob-webhook-restore-test";

    const adapter = new MockPaymobAdapter({
      mockHmac: String(hmacResult.data ?? ""),
      scenario,
      callbackOrder: body?.callback_order,
      timeoutMode: body?.timeout_mode,
      transportUrl: supabaseUrl + "/functions/v1/velora-mock-paymob-transport-restore-test-sim",
      transportCallerDeadlineMs: body?.transport_deadline_ms,
    });

    const results = [];
    for (const job of jobs) {
      const attemptResult = await supabase.rpc(
        "velora_create_subscription_renewal_payment_attempt_internal",
        { p_job_id: job.job_id },
      );
      if (attemptResult.error) throw attemptResult.error;

      const attempt = attemptResult.data;

      // RT-SIM-4F crash-recovery guard:
      // if the renewal job was reclaimed with the same pending attempt,
      // do NOT invoke the provider again. The original provider charge/callback
      // may still be in flight and must be reconciled by its original callback.
      let charge: unknown;
      if (attempt?.reused === true) {
        const pendingAttempt = await supabase
          .from("payment_attempts")
          .select("status,provider_payment_id,payment_reference")
          .eq("id", String(attempt.payment_attempt_id))
          .maybeSingle();
        if (pendingAttempt.error) throw pendingAttempt.error;

        if (["pending", "authorized", "requires_action"].includes(String(pendingAttempt.data?.status ?? ""))) {
          charge = {
            ok: true,
            provider: "paymob",
            adapter_mode: "mock",
            outcome: "reused_existing_attempt",
            paymentAttemptId: String(attempt.payment_attempt_id),
            existingAttemptStatus: String(pendingAttempt.data?.status ?? ""),
            providerPaymentId: pendingAttempt.data?.provider_payment_id ?? null,
            callbackDelivered: false,
            duplicateCallbackDelivered: false,
            providerChargeSkipped: true,
            reuseGuard: "active_attempt_reused",
          };
        } else {
          charge = await adapter.createRenewalPayment({
            paymentAttemptId: String(attempt.payment_attempt_id),
            sellerSubscriptionId: String(job.seller_subscription_id),
            renewalIdempotencyKey: String(job.renewal_idempotency_key),
            amount: Number(job.price),
            currencyCode: String(job.currency_code),
            webhookUrl,
          });
        }
      } else {
        charge = await adapter.createRenewalPayment({
          paymentAttemptId: String(attempt.payment_attempt_id),
          sellerSubscriptionId: String(job.seller_subscription_id),
          renewalIdempotencyKey: String(job.renewal_idempotency_key),
          amount: Number(job.price),
          currencyCode: String(job.currency_code),
          webhookUrl,
        });
      }

      results.push({
        job_id: job.job_id,
        seller_subscription_id: job.seller_subscription_id,
        payment_attempt_id: attempt.payment_attempt_id,
        attempt_count: job.attempt_count,
        renewal_idempotency_key: job.renewal_idempotency_key,
        attempt_reused: attempt?.reused === true,
        provider_result: charge,
      });
    }

    return json({
      ok: true,
      provider: "paymob",
      adapter_mode: "mock",
      claimed_count: jobs.length,
      scenario,
      results,
    });
  } catch (error) {
    console.error("mock_renewal_executor_failed", error instanceof Error ? error.message : "unknown_error");
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "mock_renewal_executor_failed",
    }, 500);
  }
});
