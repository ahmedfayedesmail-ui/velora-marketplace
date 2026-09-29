import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PAYMOB_BASE = "https://accept.paymob.com";
const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

const getApiKey = () => {
  const v = Deno.env.get("PAYMOB_API_KEY");
  return String(v || "").trim();
};

async function generateToken(apiKey: string) {
  const response = await fetch(`${PAYMOB_BASE}/api/auth/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  let body: Record<string, unknown> = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  return {
    response,
    token: typeof body.token === "string" ? body.token.trim() : "",
  };
}

Deno.serve(async (req: Request) => {
  let outerStage = "handler_start";
  try {
  if (req.method === "GET") {
    const apiKey = getApiKey();
    if (!apiKey) {
      return json(
        {
          ok: false,
          provider: "paymob",
          environment: "test",
          credential_configured: false,
          auth_http_status: null,
        },
        503,
      );
    }

    try {
      const { response, token } = await generateToken(apiKey);
      return json(
        {
          ok: response.ok && Boolean(token),
          provider: "paymob",
          environment: "test",
          credential_configured: true,
          auth_http_status: response.status,
          token_obtained: Boolean(token),
          expires_in_minutes: token ? 60 : null,
        },
        response.ok && token ? 200 : 502,
      );
    } catch (error) {
      return json(
        {
          ok: false,
          provider: "paymob",
          environment: "test",
          credential_configured: true,
          auth_http_status: null,
          token_obtained: false,
          error_class: error instanceof Error ? error.name : "Error",
        },
        502,
      );
    }
  }

  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  outerStage = "request_auth";
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKeysRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "";
  let publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  try {
    const parsed = JSON.parse(publishableKeysRaw);
    if (parsed?.default) publishableKey = String(parsed.default);
  } catch {
    // Keep legacy anon fallback.
  }

  if (!supabaseUrl || !publishableKey || !bearer) {
    return json({ ok: false, code: "AUTH_REQUIRED" }, 401);
  }

  let stage = "client_creation";
  try {
    stage = "client_creation";
    outerStage = "client_creation";
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });

    stage = "user_auth";
    outerStage = "user_auth";
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ ok: false, code: "AUTH_REQUIRED" }, 401);

    stage = "input_validation";
    let input: Record<string, unknown> = {};
    try {
      input = await req.json();
    } catch {
      return json({ ok: false, code: "INVALID_JSON" }, 400);
    }

    const paymentAttemptId = typeof input.payment_attempt_id === "string"
      ? input.payment_attempt_id.trim()
      : "";
    if (!paymentAttemptId) return json({ ok: false, code: "PAYMENT_ATTEMPT_REQUIRED" }, 400);

    stage = "attempt_lookup";
    outerStage = "attempt_lookup";
    const { data: attempt, error: attemptError } = await userClient
      .from("payment_attempts")
      .select("id,order_id,purpose,status,metadata,provider_id")
      .eq("id", paymentAttemptId)
      .eq("user_id", userData.user.id)
      .eq("purpose", "marketplace_order")
      .maybeSingle();

    if (attemptError) {
      return json({ ok: false, code: "PAYMENT_ATTEMPT_LOOKUP_FAILED" }, 500);
    }
    if (!attempt) return json({ ok: false, code: "PAYMENT_ATTEMPT_NOT_FOUND" }, 404);

    const providerOrderId = String(attempt.metadata?.paymob_order_id || "").trim();
    if (!providerOrderId) return json({ ok: false, code: "PAYMOB_ORDER_ID_MISSING" }, 422);

    stage = "provider_auth";
    outerStage = "provider_auth";
    const apiKey = getApiKey();
    if (!apiKey) {
      return json(
        {
          ok: false,
          code: "PAYMOB_API_KEY_MISSING",
        },
        503,
      );
    }
    const auth = await generateToken(apiKey);
    if (!auth.response.ok || !auth.token) {
      return json(
        {
          ok: false,
          code: "PAYMOB_AUTH_FAILED",
          auth_http_status: auth.response.status,
        },
        502,
      );
    }

    stage = "provider_inquiry";
    outerStage = "provider_inquiry";
    const inquiryResponse = await fetch(
      `${PAYMOB_BASE}/api/ecommerce/orders/transaction_inquiry`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          auth_token: auth.token,
          order_id: providerOrderId,
        }),
      },
    );

    let inquiry: Record<string, unknown> = {};
    let providerResponseText = "";
    try {
      providerResponseText = await inquiryResponse.text();
      try {
        inquiry = providerResponseText ? JSON.parse(providerResponseText) : {};
      } catch {
        inquiry = {};
      }
    } catch {
      providerResponseText = "";
      inquiry = {};
    }

    const providerResultStatus = inquiryResponse.ok
      ? 200
      : inquiryResponse.status === 404
        ? 404
        : 502;

    return json(
      {
        ok: inquiryResponse.ok,
        code: inquiryResponse.status === 404 ? "PAYMOB_TRANSACTION_NOT_FOUND" : null,
        provider: "paymob",
        environment: "test",
        payment_attempt_id: attempt.id,
        paymob_order_id: providerOrderId,
        local_attempt_status: attempt.status,
        inquiry_http_status: inquiryResponse.status,
        provider_response_content_type: inquiryResponse.headers.get("content-type"),
        provider_response_body_length: providerResponseText.length,
        provider_response_keys: Object.keys(inquiry).sort(),
        provider_error_code:
          typeof inquiry.code === "string"
            ? inquiry.code
            : typeof inquiry.message === "string"
              ? inquiry.message.slice(0, 160)
              : null,
        provider_transaction_id: inquiry.id ?? null,
        integration_id: inquiry.integration_id ?? null,
        is_3d_secure: inquiry.is_3d_secure ?? null,
        error_occured: inquiry.error_occured ?? null,
        is_live: inquiry.is_live ?? null,
        data_gateway_integration_pk:
          inquiry.data && typeof inquiry.data === "object"
            ? (inquiry.data as Record<string, unknown>).gateway_integration_pk ?? null
            : null,
        data_migs_result:
          inquiry.data && typeof inquiry.data === "object"
            ? (inquiry.data as Record<string, unknown>).migs_result ?? null
            : null,
        data_txn_response_code:
          inquiry.data && typeof inquiry.data === "object"
            ? (inquiry.data as Record<string, unknown>).txn_response_code ?? null
            : null,
        data_migs_authentication_status:
          inquiry.data && typeof inquiry.data === "object"
            && (inquiry.data as Record<string, unknown>).migs_order
            && typeof (inquiry.data as Record<string, unknown>).migs_order === "object"
            ? ((inquiry.data as Record<string, unknown>).migs_order as Record<string, unknown>).authenticationStatus ?? null
            : null,
        data_migs_status:
          inquiry.data && typeof inquiry.data === "object"
            && (inquiry.data as Record<string, unknown>).migs_order
            && typeof (inquiry.data as Record<string, unknown>).migs_order === "object"
            ? ((inquiry.data as Record<string, unknown>).migs_order as Record<string, unknown>).status ?? null
            : null,
        pending: inquiry.pending ?? null,
        success: inquiry.success ?? null,
        is_refunded: inquiry.is_refunded ?? null,
        is_voided: inquiry.is_voided ?? null,
        is_auth: inquiry.is_auth ?? null,
        is_capture: inquiry.is_capture ?? null,
        is_captured: inquiry.is_captured ?? null,
        provider_order_id_from_response:
          inquiry.order && typeof inquiry.order === "object"
            ? (inquiry.order as Record<string, unknown>).id ?? null
            : null,
      },
      providerResultStatus,
    );
  } catch (error) {
    return json(
      {
        ok: false,
        code: "PAYMOB_INQUIRY_REQUEST_FAILED",
        stage,
        error_class: error instanceof Error ? error.name : "Error",
      },
      502,
    );
  }

  } catch (error) {
    return json(
      {
        ok: false,
        code: "PAYMOB_INQUIRY_UNHANDLED_ERROR",
        stage: outerStage,
        error_class: error instanceof Error ? error.name : "Error",
      },
      502,
    );
  }
});