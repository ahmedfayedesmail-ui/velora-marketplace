import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers:{...cors,"content-type":"application/json"}});
const BASE="https://accept.paymob.com";
const cents=(n:number)=>Math.round(n*100);
function billing(order:Record<string,unknown>){const name=String(order.customer_name||"Velora Customer").trim()||"Velora Customer";const parts=name.split(/\s+/);const first=parts.shift()||"Velora";const last=parts.join(" ")||"Customer";return{apartment:"NA",building:"NA",floor:"NA",street:String(order.customer_address||"NA").trim()||"NA",city:String(order.customer_city||"Cairo").trim()||"Cairo",state:String(order.customer_city||"Cairo").trim()||"Cairo",country:"EG",postal_code:"NA",first_name:first.slice(0,50),last_name:last.slice(0,50),email:String(order.customer_email||"").trim(),phone_number:String(order.customer_phone||"+200000000000").trim()||"+200000000000"};}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors}); if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 const authHeader=req.headers.get("Authorization")??"";const supabase=createClient(Deno.env.get("SUPABASE_URL")??"",Deno.env.get("SUPABASE_PUBLISHABLE_KEY")??"",{global:{headers:{Authorization:authHeader}}});
 try{
  const body=await req.json();const{order_id,payment_method_id,country_code,idempotency_key}=body??{};if(!order_id||!payment_method_id||!country_code||!idempotency_key)throw new Error("missing_required_fields");
  const{data,error}=await supabase.rpc("velora_create_payment_attempt",{p_order_id:order_id,p_method_id:payment_method_id,p_country_code:country_code,p_idempotency_key:idempotency_key,p_purpose:"marketplace_order"});if(error)throw error;const attempt=Array.isArray(data)?data[0]:data;if(!attempt?.attempt_id)throw new Error("payment_attempt_not_created");
  if(String(attempt.provider_code).toLowerCase()!=="paymob")return json({ok:true,data:attempt,provider_session_created:false,integration_status:"provider_credentials_required"});
  const secretKey=Deno.env.get("PAYMOB_SECRET_KEY"),publicKey=Deno.env.get("PAYMOB_PUBLIC_KEY");const integrationId=Number(Deno.env.get("PAYMOB_INTEGRATION_ID")||"5920533");if(!secretKey||!publicKey) return json({ok:false,status:"BLOCKED",code:"PAYMOB_CREDENTIALS_MISSING"},503);
  const{data:order,error:orderError}=await supabase.from("orders").select("id,order_number,total,currency,customer_name,customer_phone,customer_email,customer_city,customer_address").eq("id",order_id).maybeSingle();if(orderError)throw orderError;if(!order)throw new Error("order_not_found");
  const currency=String(order.currency||"").toUpperCase(),total=Number(order.total);if(currency!=="EGP"||!Number.isFinite(total)||total<=0)return json({ok:false,status:"BLOCKED",code:"PAYMOB_UNSUPPORTED_ORDER",currency,total},400);
  const webhookUrl=`${Deno.env.get("SUPABASE_URL")??""}/functions/v1/velora-paymob-webhook`;
  const intention={amount:cents(total),currency:"EGP",payment_methods:[integrationId],items:[{name:`Velora Order ${order.order_number||order.id}`,amount:cents(total),description:"Velora marketplace order",quantity:1}],billing_data:billing(order),extras:{velora_order_id:String(order.id),velora_payment_attempt_id:String(attempt.attempt_id)},special_reference:`velora-${order.order_number||order.id}-${attempt.attempt_id}`,expiration:3600,notification_url:webhookUrl};
  const paymobRes=await fetch(`${BASE}/v1/intention/`,{method:"POST",headers:{Authorization:`Token ${secretKey}`,"Content-Type":"application/json"},body:JSON.stringify(intention)});const paymobJson=await paymobRes.json();if(!paymobRes.ok)return json({ok:false,status:"FAILED",code:"PAYMOB_INTENTION_CREATE_FAILED",payment_attempt_id:attempt.attempt_id,provider_error:paymobJson?.detail||paymobJson?.message||"paymob_error"},502);
  const intentionId=paymobJson?.id,clientSecret=paymobJson?.client_secret;if(!intentionId||!clientSecret)throw new Error("paymob_missing_client_secret");
  const{error:attachError}=await supabase.rpc("velora_attach_payment_provider_session",{p_payment_attempt_id:attempt.attempt_id,p_provider_code:"paymob",p_provider_session_id:String(intentionId)});if(attachError)throw attachError;
  return json({ok:true,status:"READY",provider:"paymob",environment:"test",data:attempt,provider_session_created:true,payment_attempt_id:attempt.attempt_id,intention_id:intentionId,checkout_url:`${BASE}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(clientSecret)}`});
 }catch(e){return json({ok:false,error:e instanceof Error?e.message:"payment_session_failed"},400);}
});
