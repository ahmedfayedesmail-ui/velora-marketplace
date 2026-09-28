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
    first_name:first.slice(0,50),last_name:last.slice(0,50),email:String(profile.email||"").trim(),
    phone_number:String(seller.phone||"+200000000000").trim()||"+200000000000"};
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({ok:false,error:"method_not_allowed"},405);
  try{
    const authHeader=req.headers.get("Authorization")??"";
    const supabase=createClient(Deno.env.get("SUPABASE_URL")??"",Deno.env.get("SUPABASE_PUBLISHABLE_KEY")??"",{global:{headers:{Authorization:authHeader}}});
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

    if(String(start.provider_code||"").toLowerCase()!=="paymob") return json({ok:true,status:"BLOCKED",code:"PAYMOB_ROUTE_NOT_SELECTED",data:start},409);
    const secretKey=Deno.env.get("PAYMOB_SECRET_KEY"), publicKey=Deno.env.get("PAYMOB_PUBLIC_KEY");
    const integrationId=Number(Deno.env.get("PAYMOB_INTEGRATION_ID")||"5920533");
    if(!secretKey||!publicKey) return json({ok:false,status:"BLOCKED",code:"PAYMOB_CREDENTIALS_MISSING",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id},503);

    const [pr,sr,pdr,pkr]=await Promise.all([
      supabase.from("profiles").select("full_name,email").eq("id",authData.user.id).maybeSingle(),
      supabase.from("sellers").select("store_name,phone").eq("user_id",authData.user.id).maybeSingle(),
      supabase.from("products").select("name,brand").eq("id",productId).maybeSingle(),
      supabase.from("seller_ad_packages").select("name").eq("id",packageId).maybeSingle()
    ]);
    if(pr.error) throw pr.error; if(sr.error) throw sr.error; if(pdr.error) throw pdr.error; if(pkr.error) throw pkr.error;
    if(!pr.data||!sr.data||!pdr.data) throw new Error("AD_CHECKOUT_DATA_NOT_FOUND");

    const amount=Number(start.price), currency=String(start.currency_code||"").toUpperCase();
    if(currency!=="EGP"||!Number.isFinite(amount)||amount<=0) return json({ok:false,status:"BLOCKED",code:"PAYMOB_UNSUPPORTED_SELLER_AD",currency,amount},400);

    const notificationUrl=(Deno.env.get("SUPABASE_URL")??"")+"/functions/v1/velora-paymob-webhook-restore-test";
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
    if(!paymobResponse.ok) return json({ok:false,status:"FAILED",code:"PAYMOB_INTENTION_CREATE_FAILED",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
      provider_error:paymobJson?.detail||paymobJson?.message||"paymob_error"},502);
    const intentionId=paymobJson?.id, intentionOrderId=paymobJson?.intention_order_id??paymobJson?.order_id, clientSecret=paymobJson?.client_secret;
    if(!intentionId||!clientSecret||!intentionOrderId) throw new Error("PAYMOB_MISSING_INTENTION_FIELDS");
    const {data:attach,error:attachError}=await supabase.rpc("velora_attach_seller_ad_payment_provider_session",{
      p_payment_attempt_id:start.payment_attempt_id,p_provider_code:"paymob",p_provider_session_id:String(intentionId),p_provider_order_id:String(intentionOrderId)});
    if(attachError) throw attachError;
    return json({ok:true,status:"READY",provider:"paymob",environment:"test",campaign_id:start.campaign_id,payment_attempt_id:start.payment_attempt_id,
      intention_id:String(intentionId),provider_order_id:String(intentionOrderId),provider_session_attached:Boolean(attach?.ok),
      checkout_url:BASE+"/unifiedcheckout/?publicKey="+encodeURIComponent(publicKey)+"&clientSecret="+encodeURIComponent(clientSecret)});
  }catch(error){ return json({ok:false,status:"FAILED",error:error instanceof Error?error.message:"seller_ad_paymob_checkout_failed"},400); }
});