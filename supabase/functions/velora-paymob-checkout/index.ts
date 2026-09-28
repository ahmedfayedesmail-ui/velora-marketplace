import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { ...cors, "content-type": "application/json" } });
const BASE = "https://accept.paymob.com";
const toCents = (n:number) => Math.round(n * 100);
function billing(o: Record<string, unknown>) {
  const name = String(o.customer_name || "Velora Customer").trim() || "Velora Customer";
  const parts = name.split(/\s+/); const first = parts.shift() || "Velora"; const last = parts.join(" ") || "Customer";
  return { apartment:"NA",building:"NA",floor:"NA",street:String(o.customer_address||"NA").trim()||"NA",city:String(o.customer_city||"Cairo").trim()||"Cairo",state:String(o.customer_city||"Cairo").trim()||"Cairo",country:"EG",postal_code:"NA",first_name:first.slice(0,50),last_name:last.slice(0,50),email:String(o.customer_email||"").trim(),phone_number:String(o.customer_phone||"+200000000000").trim()||"+200000000000" };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  if (req.method !== "POST") return json({ok:false,error:"method_not_allowed"},405);
  try {
    const body=await req.json();
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    let supabasePublishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!supabasePublishableKey) {
      const rawPublishableKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "";
      if (rawPublishableKeys) {
        try {
          const publishableKeys = JSON.parse(rawPublishableKeys);
          supabasePublishableKey = String(publishableKeys.default ?? "");
        } catch { supabasePublishableKey = ""; }
      }
    }
    if (!supabasePublishableKey) throw new Error("SUPABASE_PUBLISHABLE_KEY_NOT_CONFIGURED");
    const supabase = createClient(supabaseUrl, supabasePublishableKey, {global:{headers:{Authorization:authHeader}}});

    const {order_id,country_code="EG",idempotency_key,return_url} = body ?? {};
    if (!order_id || !idempotency_key) return json({ok:false,error:"missing_required_fields"},400);
    if (String(country_code).toUpperCase() !== "EG") return json({ok:false,error:"paymob_egypt_only"},400);
    const secretKey=Deno.env.get("PAYMOB_SECRET_KEY"); const publicKey=Deno.env.get("PAYMOB_PUBLIC_KEY"); const integrationId=Deno.env.get("PAYMOB_INTEGRATION_ID")||"5920533";
    if(!secretKey||!publicKey) return json({ok:false,status:"BLOCKED",code:"PAYMOB_CREDENTIALS_MISSING"},503);

    const {data: cardMethod,error:methodError}=await supabase.from("payment_methods").select("id").eq("code","card").eq("is_active",true).maybeSingle();
    if(methodError) throw methodError; if(!cardMethod?.id) return json({ok:false,status:"BLOCKED",code:"CARD_METHOD_NOT_CONFIGURED"},409);
    const {data:attemptRows,error:attemptError}=await supabase.rpc("velora_create_payment_attempt",{p_order_id:order_id,p_method_id:cardMethod.id,p_country_code:"EG",p_idempotency_key:idempotency_key,p_purpose:"marketplace_order"});
    if(attemptError) throw attemptError;
    const attempt=Array.isArray(attemptRows)?attemptRows[0]:attemptRows;
    if(!attempt?.attempt_id) throw new Error("payment_attempt_not_created");
    if(String(attempt.provider_code).toLowerCase()!=="paymob") return json({ok:false,status:"BLOCKED",code:"PAYMOB_ROUTE_NOT_SELECTED",provider:attempt.provider_code},409);

    const {data:order,error:orderError}=await supabase.from("orders").select("id,order_number,total,currency,customer_name,customer_phone,customer_email,customer_city,customer_address").eq("id",order_id).maybeSingle();
    if(orderError) throw orderError; if(!order) throw new Error("order_not_found");
    const currency=String(order.currency||"").toUpperCase(); const total=Number(order.total);
    if(currency!=="EGP"||!Number.isFinite(total)||total<=0) return json({ok:false,status:"BLOCKED",code:"PAYMOB_UNSUPPORTED_ORDER",currency,total},400);

    const notification_url=`${supabaseUrl}/functions/v1/velora-paymob-webhook-restore-test`;
    // Restore-Test must never route payment callbacks into Production.
    const payload={amount:toCents(total),currency:"EGP",payment_methods:[Number(integrationId)],items:[{name:`Velora Order ${order.order_number||order.id}`,amount:toCents(total),description:"Velora marketplace order",quantity:1}],billing_data:billing(order),extras:{velora_order_id:String(order.id),velora_payment_attempt_id:String(attempt.attempt_id)},special_reference:String(idempotency_key),expiration:3600,notification_url,redirection_url: typeof return_url === "string" && /^https?:\/\//i.test(return_url) ? return_url : undefined};
    const r=await fetch(`${BASE}/v1/intention/`,{method:"POST",headers:{Authorization:`Token ${secretKey}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const j=await r.json();
    if(!r.ok) {
      const safeProviderError: Record<string, unknown> = {};
      if (j && typeof j === "object") {
        for (const key of ["detail","message","error","errors","type","code","status"]) {
          if (Object.prototype.hasOwnProperty.call(j, key)) safeProviderError[key] = j[key];
        }
      }
      return json({
        ok:false,
        status:"FAILED",
        code:"PAYMOB_INTENTION_CREATE_FAILED",
        payment_attempt_id:attempt.attempt_id,
        provider_http_status:r.status,
        provider_error:
          Object.keys(safeProviderError).length > 0
            ? safeProviderError
            : {
                provider_http_status: r.status,
                merchant_order_id: j && typeof j === "object" ? (j as Record<string, unknown>).merchant_order_id ?? null : null,
                response_type: typeof j,
                response_keys: j && typeof j === "object" ? Object.keys(j) : [],
              },
        provider_error_keys:j && typeof j==="object" ? Object.keys(j) : [],
        provider_error_fields:safeProviderError,
      },502);
    }
    const intentionId=j?.id, intentionOrderId=j?.intention_order_id ?? j?.order_id, clientSecret=j?.client_secret; if(!intentionId||!clientSecret) throw new Error("paymob_missing_client_secret"); if(!intentionOrderId) throw new Error("paymob_missing_order_id");
    const {error:attachError}=await supabase.rpc("velora_attach_payment_provider_session",{p_payment_attempt_id:attempt.attempt_id,p_provider_code:"paymob",p_provider_session_id:String(intentionId),p_provider_order_id:String(intentionOrderId)}); if(attachError) throw attachError;
    const checkoutUrl=`${BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`;
    const paymob_payment_methods = Array.isArray(j?.payment_methods)
      ? j.payment_methods.map((m: Record<string, unknown>) => ({
          integration_id: m?.integration_id ?? null,
          name: m?.name ?? null,
          method_type: m?.method_type ?? null,
          currency: m?.currency ?? null,
          live: m?.live ?? null,
        }))
      : [];
    return json({ok:true,status:"READY",provider:"paymob",environment:"test",payment_attempt_id:attempt.attempt_id,intention_id:intentionId,checkout_url:checkoutUrl,paymob_intention_status:j?.status ?? null,paymob_payment_methods});
  } catch(error) { return json({ok:false,status:"FAILED",error:error instanceof Error?error.message:"paymob_checkout_failed"},400); }
});
