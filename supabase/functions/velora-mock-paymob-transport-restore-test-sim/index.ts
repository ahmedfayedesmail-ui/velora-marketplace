
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

const serviceKey = () => {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const p = JSON.parse(raw);
      if (p?.default) return String(p.default);
    } catch {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
};

async function hmacSha512(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqualHex(a: string, b: string) {
  const aa = a.trim().toLowerCase();
  const bb = b.trim().toLowerCase();
  if (!aa || aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const key = serviceKey();
    if (!supabaseUrl || !key) {
      return json({ ok: false, code: "SUPABASE_SERVER_CREDENTIALS_MISSING" }, 503);
    }

    const sb = createClient(supabaseUrl, key);
    const secretResult = await sb.rpc("velora_get_mock_paymob_hmac_internal");
    if (secretResult.error) throw secretResult.error;
    const secret = String(secretResult.data ?? "");
    if (!secret) return json({ ok: false, code: "MOCK_PAYMOB_HMAC_MISSING" }, 503);

    const presented = req.headers.get("X-Velora-Mock-Transport-HMAC") ?? "";
    const expected = await hmacSha512(secret, "RT-SIM-4C-B");
    if (!constantTimeEqualHex(expected, presented)) {
      return json({ ok: false, error: "invalid_transport_auth" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const delayMsRaw = Number(body?.delay_ms ?? 2000);
    const delayMs = Number.isInteger(delayMsRaw) && delayMsRaw >= 2000
      ? Math.min(delayMsRaw, 5000)
      : 2000;

    const startedAt = new Date().toISOString();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const completedAt = new Date().toISOString();

    return json({
      ok: true,
      transport: "mock-paymob-http",
      provider: "paymob",
      scenario: "timeout_transport",
      delayMs,
      startedAt,
      completedAt,
    });
  } catch (error) {
    console.error(
      "mock_paymob_transport_failed",
      error instanceof Error ? error.message : "unknown_error",
    );
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "mock_paymob_transport_failed",
    }, 500);
  }
});
