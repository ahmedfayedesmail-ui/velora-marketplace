import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

const encoder = new TextEncoder();

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return new Uint8Array(digest);
}

function constantTimeBytesEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function authorizeScheduler(req: Request) {
  const presented = req.headers.get("X-Velora-Scheduler-Token") ?? "";
  const expected = Deno.env.get("VELORA_SCHEDULER_TOKEN") ?? "";
  if (!expected) return { ok: false, status: 503, code: "SCHEDULER_SECRET_NOT_CONFIGURED" };
  if (!presented) return { ok: false, status: 401, code: "SCHEDULER_TOKEN_MISSING" };

  const [a, b] = await Promise.all([sha256(presented), sha256(expected)]);
  if (!constantTimeBytesEqual(a, b)) {
    return { ok: false, status: 401, code: "SCHEDULER_TOKEN_INVALID" };
  }

  return { ok: true };
}

function getServiceKey() {
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysRaw) {
    try {
      const parsed = JSON.parse(secretKeysRaw);
      if (parsed?.default) return String(parsed.default);
    } catch (_) {}
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  return "";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const auth = await authorizeScheduler(req);
  if (!auth.ok) return json({ ok: false, code: auth.code }, auth.status);

  const serviceKey = getServiceKey();
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  if (!serviceKey || !supabaseUrl) {
    return json({ ok: false, code: "SUPABASE_SERVER_CREDENTIALS_MISSING" }, 503);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedBatchSize = Number(body?.batch_size ?? 15);
    const batchSize = Number.isInteger(requestedBatchSize) && requestedBatchSize > 0
      ? Math.min(requestedBatchSize, 15)
      : 15;

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.rpc("velora_run_renewal_batch", {
      p_batch_size: batchSize,
    });

    if (error) {
      console.error("renewal_batch_claim_failed", error.message);
      return json({ ok: false, code: "RENEWAL_BATCH_CLAIM_FAILED" }, 500);
    }

    const jobs = Array.isArray(data) ? data : data ? [data] : [];

    return json({
      ok: true,
      mode: "orchestration_only",
      actual_charge_executed: false,
      batch_size: batchSize,
      claimed_count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error(
      "renewal_orchestrator_failed",
      error instanceof Error ? error.message : "unknown_error",
    );
    return json({ ok: false, code: "RENEWAL_ORCHESTRATOR_FAILED" }, 500);
  }
});