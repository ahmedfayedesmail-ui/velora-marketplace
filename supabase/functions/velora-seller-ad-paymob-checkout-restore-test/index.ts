import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers:{...cors,"content-type":"application/json"}});
const BASE="https://accept.paymob.com";
const cents=(n:number)=>Math.round(n*100);
function billing(profile:Record<string,unknown>,seller:Record<string,unknown>){
  const name=String(profile.full_name||seller.store_name||"Velora Seller").trim()||"Velora Seller";
  const parts=name.split(/\s+/); const first=parts.shift()||"Velora"; const last=parts.join(" ")||"Seller";
  return {apartment:"NA",building:"NA",floor:"NA",street:"NA",city:"Cairo",state:"Cairo",country:"EG",postal_code:"NA",
    first_name:first.slice(0,50),last_name:last.slice(0,50),email:(String(profile.email||"").trim()||String(Deno.env.get("VELORA_FALLBACK_SELLER_EMAIL")||"seller@velora.local").trim()),
    phone_number:String(seller.phone||"+200000000000").trim()||"+200000000000"};
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({ok:false,error:"method_not_allowed"},405);
  try{
    const authHeader=req.headers.get("Authorization")??"";
    const supabase=createClient(Deno.env.get("SUPABASE_URL")??"",Deno.env.get("SUPABASE_PUBLISHABLE_KEY")??"",{global:{headers:{Authorization:authHeader}}});
    const getServiceKey=()=>{
      const raw=Deno.env.get("SUPABASE_SECRET_KEYS");
      if(raw){try{const parsed=JSON.parse(raw);if(parsed?.default)return String(parsed.default);}catch{}}
      return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
    };
    const recoverProviderSession=async(paymentAttemptId:string,providerSessionId:string,providerOrderId:string)=>{
      const serviceKey=getServiceKey();
      if(!serviceKey) throw new Error("SUPABASE_SERVER_CREDENTIALS_MISSING");
      const admin=createClient(Deno.env.get("SUPABASE_URL")??"",serviceKey);
      const {data,error}=await admin.rpc("velora_recover_paymob_provider_session",{
        p_payment_attempt_id:paymentAttemptId,
        p_provider_session_id:providerSessionId,
        p_provider_order_id:providerOrderId,
      });
      if(error) throw error;
      return data;
    };
    const {data:authData,error:authError}=await supabase.auth.getUser();
    if(authError||!authData?.user) return json({ok:false,code:"AUTH_REQUIRED"},401);
    const body=await req.json().catch(()=>({}));
    const packageId=body?.ad_package_id, productId=body?.product_id, countryCode=String(body?.country_code||"EG").toUpperCase();
    const idempotencyKey=String(body?.idempotency_key||"").trim();
    const returnUrl=typeof body?.return_url==="string"&&/^https?:\/\//i.test(body.return_url)?body.return_url:undefined;
    if(!packageId||!productId||!idempotencyKey) return json({ok:false,code:"MISSING_REQUIRED_FIELDS"},400);
    if(countryCode!=="EG") return json({ok:false,code:"PAYMOB_EGYPT_ONLY"},400);

    const {data:startRows,error:startError}=await supabase.rpc("velora_start_seller_ad_purchase",{
      p_ad_package_id:packageId,p_product_id:productId,p_country_code:countryCode,p_idempotency_key:idempotencyKey});
    if(startError) throw startError;
    const start=Array.isArray(startRows)?startRows[0]:startRows;
    if(!start?.campaign_id||!start?.payment_attempt_id) throw new Error("seller_ad_purchase_not_created");
    if(String(start.campaign_status).toLowerCase()==="active") return json({ok:true,status:"ALREADY_ACTIVE",campaign_id:start.campaign_id});

    const markInitializationFailed=async(code:string,reason:string)=>{
      const r=await supabase.rpc("velora_mark_seller_ad_payment_initialization_failed",{
        p_payment_attempt_id:start.payment_attempt_id,p_failure_code:code,p_failure_reason:reason
      });
      if(r.error) throw new Error("AD_PAYMENT_FAILURE_FINALIZATION_FAILED:"+r.error.message);
      return r.data;
    };
    if(String(start.provider_code||"").toLowerCase()!=="paymob"){
      await markInitializationFailed("PAYMOB_ROUTE_NOT_SELECTED","No Paymob payment route was selected for the seller advertising purchase.");
      return json({ok:false,status:"FAILED",code:"PAYMOB_ROUTE_NOT_SELECTED",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id},409);
    }
    const secretKey=Deno.env.get("PAYMOB_SECRET_KEY"), publicKey=Deno.env.get("PAYMOB_PUBLIC_KEY");
    const integrationId=Number(Deno.env.get("PAYMOB_INTEGRATION_ID")||"5920533");
    if(!secretKey||!publicKey){
      await markInitializationFailed("PAYMOB_CREDENTIALS_MISSING","Paymob checkout credentials are not configured.");
      return json({ok:false,status:"FAILED",code:"PAYMOB_CREDENTIALS_MISSING",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id},503);
    }

    const [pr,sr,pdr,pkr]=await Promise.all([
      supabase.from("profiles").select("full_name,email").eq("id",authData.user.id).maybeSingle(),
      supabase.from("sellers").select("store_name,phone").eq("user_id",authData.user.id).maybeSingle(),
      supabase.from("products").select("name,brand").eq("id",productId).maybeSingle(),
      supabase.from("seller_ad_packages").select("name").eq("id",packageId).maybeSingle()
    ]);
    if(pr.error) throw pr.error; if(sr.error) throw sr.error; if(pdr.error) throw pdr.error; if(pkr.error) throw pkr.error;
    if(!pr.data||!sr.data||!pdr.data) throw new Error("AD_CHECKOUT_DATA_NOT_FOUND");

    const amount=Number(start.price), currency=String(start.currency_code||"").toUpperCase();
    if(currency!=="EGP"||!Number.isFinite(amount)||amount<=0){
      await markInitializationFailed("PAYMOB_UNSUPPORTED_SELLER_AD","Seller advertising payment amount or currency is not supported by the current Paymob route.");
      return json({ok:false,status:"FAILED",code:"PAYMOB_UNSUPPORTED_SELLER_AD",currency,amount,campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id},400);
    }

    const notificationUrl=(Deno.env.get("SUPABASE_URL")??"")+"/functions/v1/velora-paymob-webhook-restore-test";
    let providerIntentCreated=false;
    let intentionId:string|null=null;
    let intentionOrderId:string|null=null;
    const paymobResponse=await fetch(BASE+"/v1/intention/",{
      method:"POST",headers:{Authorization:"Token "+secretKey,"Content-Type":"application/json"},
      body:JSON.stringify({
        amount:cents(amount),currency:"EGP",payment_methods:[integrationId],
        items:[{name:"Velora Sponsored — "+String(pdr.data.name||pkr.data?.name||"Seller Ad"),amount:cents(amount),
          description:"Velora seller advertising — "+String(pkr.data?.name||"Sponsored placement"),quantity:1}],
        billing_data:billing(pr.data as Record<string,unknown>,sr.data as Record<string,unknown>),
        extras:{velora_seller_ad_campaign_id:String(start.campaign_id),velora_payment_attempt_id:String(start.payment_attempt_id),velora_payment_flow:"seller_ad_purchase"},
        special_reference:"velora-ad-"+start.campaign_id,expiration:1800,notification_url:notificationUrl,redirection_url:returnUrl
      })
    });
    const paymobJson=await paymobResponse.json();
    if(!paymobResponse.ok){
      const providerError=String(paymobJson?.detail||paymobJson?.message||"paymob_error");
      await markInitializationFailed("PAYMOB_INTENTION_CREATE_FAILED",providerError);
      return json({ok:false,status:"FAILED",code:"PAYMOB_INTENTION_CREATE_FAILED",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
        provider_error:providerError},502);
    }
    providerIntentCreated=true;
    intentionId=paymobJson?.id?String(paymobJson.id):null;
    intentionOrderId=(paymobJson?.intention_order_id??paymobJson?.order_id)?String(paymobJson.intention_order_id??paymobJson.order_id):null;
    const clientSecret=paymobJson?.client_secret;
    if(!intentionId||!intentionOrderId){
      await markInitializationFailed("PAYMOB_MISSING_INTENTION_FIELDS","Paymob intention response did not contain the required checkout correlation fields.");
      return json({ok:false,status:"FAILED",code:"PAYMOB_MISSING_INTENTION_FIELDS",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id},502);
    }
    if(!clientSecret){
      try{
        const recovery=await recoverProviderSession(String(start.payment_attempt_id),intentionId,intentionOrderId);
        return json({ok:false,status:"FAILED",code:"PAYMOB_CLIENT_SECRET_MISSING",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
          provider_session_recovered:Boolean(recovery?.ok),local_payment_attempt_status:"pending",recovery:"retry_seller_ad_checkout"},502);
      }catch(recoveryError){
        console.error("seller_ad_provider_session_recovery_failed",recoveryError instanceof Error?recoveryError.message:"unknown_error");
        return json({ok:false,status:"FAILED",code:"PAYMOB_PROVIDER_SESSION_RECOVERY_FAILED",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
          local_payment_attempt_status:"pending",recovery:"manual_reconciliation_required"},502);
      }
    }
    let attachError:Error|null=null;
    let attach:unknown=null;
    for(let bindAttempt=0;bindAttempt<2;bindAttempt+=1){
      const {data:attachData,error}=await supabase.rpc("velora_attach_seller_ad_payment_provider_session",{
        p_payment_attempt_id:start.payment_attempt_id,p_provider_code:"paymob",p_provider_session_id:intentionId,p_provider_order_id:intentionOrderId});
      if(!error){attach=attachData;attachError=null;break;}
      attachError=error;
      if(bindAttempt===0) await new Promise((resolve)=>setTimeout(resolve,200));
    }
    if(attachError){
      try{
        const recovery=await recoverProviderSession(String(start.payment_attempt_id),intentionId,intentionOrderId);
        return json({ok:false,status:"FAILED",code:"PAYMOB_PROVIDER_SESSION_BIND_RECOVERED",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
          provider_session_recovered:Boolean(recovery?.ok),local_payment_attempt_status:"pending",recovery:"retry_seller_ad_checkout"},502);
      }catch(recoveryError){
        console.error("seller_ad_provider_session_recovery_failed",recoveryError instanceof Error?recoveryError.message:"unknown_error");
        return json({ok:false,status:"FAILED",code:"PAYMOB_PROVIDER_SESSION_BIND_FAILED",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
          local_payment_attempt_status:"pending",recovery:"manual_reconciliation_required"},502);
      }
    }
    return json({ok:true,status:"READY",provider:"paymob",environment:"test",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
      intention_id:String(intentionId),provider_order_id:String(intentionOrderId),provider_session_attached:Boolean(attach?.ok),
      checkout_url:BASE+"/unifiedcheckout/?publicKey="+encodeURIComponent(publicKey)+"&clientSecret="+encodeURIComponent(clientSecret)});
  }catch(error){
    if(providerIntentCreated){
      console.error("seller_ad_provider_intent_unexpected_failure",error instanceof Error?error.message:"unknown_error");
    }
    return json({ok:false,status:"FAILED",error:error instanceof Error?error.message:"seller_ad_paymob_checkout_failed",
      payment_attempt_id:providerIntentCreated?String(start?.payment_attempt_id??""):null,
      local_payment_attempt_status:providerIntentCreated?"pending":null,
      recovery:providerIntentCreated?"retry_seller_ad_checkout_or_reconcile_provider_intention":null},400);
  }
});