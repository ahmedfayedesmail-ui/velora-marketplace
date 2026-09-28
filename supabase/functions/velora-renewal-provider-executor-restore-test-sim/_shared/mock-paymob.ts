
export type MockScenario =
  | "success" | "failed" | "requires_action" | "pending" | "authorized"
  | "timeout" | "duplicate" | "token_expired" | "cancelled" | "provider_error";

export interface RenewalChargeRequest {
  paymentAttemptId: string;
  sellerSubscriptionId: string;
  renewalIdempotencyKey: string;
  amount: number;
  currencyCode: string;
  webhookUrl: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeScenario(raw: string | undefined): MockScenario {
  const value = (raw ?? "success").trim().toLowerCase() as MockScenario;
  const allowed: MockScenario[] = [
    "success", "failed", "requires_action", "pending", "authorized",
    "timeout", "duplicate", "token_expired", "cancelled", "provider_error",
  ];
  return allowed.includes(value) ? value : "success";
}

function transactionHmacMessage(obj: Record<string, unknown>): string {
  const fields = [
    "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
    "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
    "is_standalone_payment", "is_voided", "order.id", "owner", "pending",
    "source_data.pan", "source_data.sub_type", "source_data.type", "success",
  ];
  const valueFor = (source: Record<string, unknown>, path: string) => {
    const parts = path.split(".");
    let cur: unknown = source;
    for (const part of parts) {
      if (cur === null || cur === undefined) return "";
      cur = (cur as Record<string, unknown>)[part];
    }
    return cur === null || cur === undefined ? "" : String(cur);
  };
  return fields.map((field) => valueFor(obj, field)).join("");
}

async function sha512Hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class MockPaymobAdapter {
  readonly scenario: MockScenario;
  readonly callbackOrder: "before_response" | "after_response";
  readonly timeoutMode: "fast" | "transport";
  readonly mockHmac: string;
  readonly transportUrl: string;
  readonly transportCallerDeadlineMs: number;
  readonly fetchImpl: typeof fetch;

  constructor(options: {
    mockHmac: string;
    scenario?: string;
    callbackOrder?: string;
    timeoutMode?: string;
    transportUrl?: string;
    transportCallerDeadlineMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    this.mockHmac = options.mockHmac;
    this.scenario = normalizeScenario(options.scenario);
    this.callbackOrder = options.callbackOrder === "before_response" ? "before_response" : "after_response";
    this.timeoutMode = options.timeoutMode === "transport" ? "transport" : "fast";
    this.transportUrl = options.transportUrl ?? "";
    const requestedDeadline = Number(options.transportCallerDeadlineMs ?? 750);
    this.transportCallerDeadlineMs = Number.isInteger(requestedDeadline) && requestedDeadline >= 500 && requestedDeadline <= 1000
      ? requestedDeadline
      : 750;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private buildPayload(req: RenewalChargeRequest, providerPaymentId: string) {
    const captured = this.scenario === "success" || this.scenario === "duplicate";
    const authorized = this.scenario === "authorized";
    const failed = this.scenario === "failed" || this.scenario === "provider_error" || this.scenario === "token_expired";
    const requiresAction = this.scenario === "requires_action";

    const obj: Record<string, unknown> = {
      amount_cents: Math.round(req.amount * 100),
      created_at: new Date().toISOString(),
      currency: req.currencyCode,
      error_occured: failed,
      has_parent_transaction: false,
      id: providerPaymentId,
      integration_id: 5920533,
      is_3d_secure: true,
      is_auth: authorized,
      is_capture: captured,
      is_refunded: false,
      is_standalone_payment: false,
      is_voided: false,
      order: { id: "mock-order-" + req.sellerSubscriptionId },
      owner: 0,
      pending: this.scenario === "pending",
      source_data: { pan: "0000", sub_type: "MOCK", type: "card" },
      success: captured || authorized ? true : !failed && !requiresAction,
      is_captured: captured,
      payment_key_claims: {
        extra: {
          velora_payment_attempt_id: req.paymentAttemptId,
          velora_seller_subscription_id: req.sellerSubscriptionId,
          velora_renewal_idempotency_key: req.renewalIdempotencyKey,
          velora_mock_outcome: requiresAction ? "requires_action" : this.scenario,
        },
      },
    };

    return { type: "TRANSACTION", obj, hmac: "" };
  }

  async createRenewalPayment(req: RenewalChargeRequest) {
    const providerPaymentId = "mock_payment_" + crypto.randomUUID();

    if (this.scenario === "cancelled") {
      return {
        ok: true,
        provider: "paymob",
        adapter_mode: "mock",
        outcome: "cancelled",
        paymentAttemptId: req.paymentAttemptId,
        providerPaymentId: null,
        callbackDelivered: false,
        duplicateCallbackDelivered: false,
        providerReference: providerPaymentId,
      };
    }

    if (this.scenario === "timeout") {
      if (this.timeoutMode === "transport") {
        if (!this.transportUrl) throw new Error("MOCK_TRANSPORT_URL_MISSING");

        const transportStartedAt = new Date().toISOString();
        const controller = new AbortController();
        const deadlineTimer = setTimeout(
          () => controller.abort("RT-SIM-4C-B caller deadline"),
          this.transportCallerDeadlineMs,
        );

        try {
          const transportAuth = await sha512Hmac(this.mockHmac, "RT-SIM-4C-B");
          const response = await this.fetchImpl(this.transportUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "X-Velora-Mock-Transport-HMAC": transportAuth,
            },
            body: JSON.stringify({
              delay_ms: 2000,
              payment_attempt_id: req.paymentAttemptId,
              renewal_idempotency_key: req.renewalIdempotencyKey,
            }),
            signal: controller.signal,
          });

          const responseText = await response.text();
          const transportCompletedAt = new Date().toISOString();

          return {
            ok: false,
            provider: "paymob",
            adapter_mode: "mock",
            outcome: "timeout",
            paymentAttemptId: req.paymentAttemptId,
            providerPaymentId,
            callbackDelivered: false,
            duplicateCallbackDelivered: false,
            providerReference: providerPaymentId,
            transportTimedOut: false,
            transportHttpStatus: response.status,
            transportResponseBody: responseText.slice(0, 500),
            transportStartedAt,
            transportCompletedAt,
            transportCallerDeadlineMs: this.transportCallerDeadlineMs,
          };
        } catch (error) {
          const transportAbortedAt = new Date().toISOString();
          if (controller.signal.aborted) {
            return {
              ok: false,
              provider: "paymob",
              adapter_mode: "mock",
              outcome: "timeout",
              paymentAttemptId: req.paymentAttemptId,
              providerPaymentId,
              callbackDelivered: false,
              duplicateCallbackDelivered: false,
              providerReference: providerPaymentId,
              transportTimedOut: true,
              transportAbortReason: String(controller.signal.reason ?? "caller_deadline"),
              transportStartedAt,
              transportAbortedAt,
              transportCallerDeadlineMs: this.transportCallerDeadlineMs,
              elapsedMs: Date.now() - Date.parse(transportStartedAt),
            };
          }
          throw error;
        } finally {
          clearTimeout(deadlineTimer);
        }
      }

      return {
        ok: false,
        provider: "paymob",
        adapter_mode: "mock",
        outcome: "timeout",
        paymentAttemptId: req.paymentAttemptId,
        providerPaymentId,
        callbackDelivered: false,
        duplicateCallbackDelivered: false,
        providerReference: providerPaymentId,
      };
    }

    const payload = this.buildPayload(req, providerPaymentId);
    payload.hmac = await sha512Hmac(this.mockHmac, transactionHmacMessage(payload.obj));

    const callbackUrl = req.webhookUrl + "?hmac=" + encodeURIComponent(payload.hmac);

    const callbackTimeoutMs = 30_000;
    let callbackStartedAt: string | null = null;
    let callbackAcknowledgedAt: string | null = null;
    const callbackResponses: Array<{ status: number; body: string }> = [];

    const sendCallback = async () => {
      callbackStartedAt ??= new Date().toISOString();
      const response = await this.fetchImpl(callbackUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(callbackTimeoutMs),
      });
      const responseText = await response.text();
      callbackResponses.push({ status: response.status, body: responseText });
      if (!response.ok) {
        throw new Error("MOCK_CALLBACK_FAILED:" + response.status + ":" + responseText.slice(0, 200));
      }
      callbackAcknowledgedAt ??= new Date().toISOString();
      return response.status;
    };

    let callbackDelivered = false;
    let duplicateCallbackDelivered = false;
    let callbackHttpStatus: number | null = null;
    let providerResponseCreatedAt: string;

    if (this.callbackOrder === "before_response") {
      // Deterministic race control: provider result is not created/returned
      // until the webhook has completed and acknowledged successfully.
      callbackHttpStatus = await sendCallback();
      callbackDelivered = true;
      await sleep(20);
      providerResponseCreatedAt = new Date().toISOString();
    } else {
      providerResponseCreatedAt = new Date().toISOString();
      EdgeRuntime.waitUntil((async () => {
        await sleep(100);
        try {
          await sendCallback();
        } catch (error) {
          console.error(
            "mock_after_response_callback_failed",
            error instanceof Error ? error.message : "unknown_error",
          );
        }
      })());
      callbackDelivered = true;
    }

    if (this.scenario === "duplicate") {
      if (this.callbackOrder === "before_response") {
        callbackHttpStatus = await sendCallback();
      } else {
        EdgeRuntime.waitUntil((async () => {
          await sleep(150);
          try {
            await sendCallback();
          } catch (error) {
            console.error(
              "mock_after_response_duplicate_failed",
              error instanceof Error ? error.message : "unknown_error",
            );
          }
        })());
      }
      duplicateCallbackDelivered = true;
    }

    return {
      ok: this.scenario === "success" || this.scenario === "duplicate",
      provider: "paymob",
      adapter_mode: "mock",
      outcome: this.scenario,
      paymentAttemptId: req.paymentAttemptId,
      providerPaymentId,
      callbackDelivered,
      duplicateCallbackDelivered,
      callbackHttpStatus,
      callbackOrder: this.callbackOrder,
      callbackTimeoutMs,
      callbackStartedAt,
      callbackAcknowledgedAt,
      providerResponseCreatedAt,
      callbackBeforeProviderResponse: this.callbackOrder === "before_response",
      callbackResponseCount: callbackResponses.length,
      callbackResponseStatuses: callbackResponses.map((r) => r.status),
      callbackResponseBodies: callbackResponses.map((r) => r.body),
      providerReference: providerPaymentId,
    };
  }

  async createCardTokenCallback(args: {
    providerOrderId: string;
    providerTokenId: string;
    token: string;
    webhookUrl: string;
  }) {
    const obj = {
      card_subtype: "MOCK",
      created_at: new Date().toISOString(),
      email: "mock@velora.test",
      id: args.providerTokenId,
      masked_pan: "MOCK-****-1111",
      merchant_id: "mock-merchant",
      order_id: args.providerOrderId,
      token: args.token,
      expiry_month: 12,
      expiry_year: 30,
      cardholder_name: "Velora Mock Customer",
    };

    const fields = ["card_subtype", "created_at", "email", "id", "masked_pan", "merchant_id", "order_id", "token"];
    const message = fields.map((field) => String((obj as Record<string, unknown>)[field] ?? "")).join("");
    const signature = await sha512Hmac(this.mockHmac, message);

    const response = await this.fetchImpl(
      args.webhookUrl + "?hmac=" + encodeURIComponent(signature),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "TOKEN", obj, hmac: signature }),
      },
    );

    return {
      ok: response.ok,
      providerOrderId: args.providerOrderId,
      providerTokenId: args.providerTokenId,
      responseStatus: response.status,
      responseBody: await response.text(),
    };
  }
}
