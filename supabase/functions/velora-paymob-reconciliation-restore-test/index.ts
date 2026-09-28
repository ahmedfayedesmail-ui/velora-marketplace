import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PAYMOB_BASE="https://accept.paymob.com";
const json=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers:{"content-type":"application/json"}});
const serviceKey=()=>{const raw=Deno.env.get("SUPABASE_SECRET_KEYS");if(raw){try{const p=JSON.parse(raw);if(p?.default)return String(p.default)}catch{}}return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""};
const normalize=(i:Record<string,unknown>):string|null=>{
  if(i.is_refunded===true)return"refunded";
  if(i.is_voided===true)return"failed";
  if(i.pending===true)return"pending";
  if(i.success===true&&(i.is_captured===true||i.is_capture===true))return"captured";
  if(i.success===true&&i.is_auth===true&&i.is_capture!==true)return"authorized";
  if(i.success===false)return"failed";
  return null;
};
async function getPaymobToken(apiKey:string){
  const r=await fetch(PAYMOB_BASE+"/api/auth/tokens",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({api_key:apiKey})});
  let b:Record<string,unknown>={};try{b=await r.json()}catch{}
  return{response:r,token:typeof b.token==="string"?b.token.trim():""};
}
Deno.serve(async(req)=>{
  if(req.method!=="POST")return json({ok:false,code:"METHOD_NOT_ALLOWED"},405);
  const suppliedSecret=(req.headers.get("x-velora-reconciliation-secret")||"").trim();
  const url=Deno.env.get("SUPABASE_URL")||"",key=serviceKey();
  if(!url||!key||!suppliedSecret)return json({ok:false,code:"SERVER_CONFIGURATION_ERROR"},503);
  try{
    const sb=createClient(url,key);
    const secretCheck=await sb.rpc("velora_validate_paymob_reconciliation_secret",{p_secret:suppliedSecret});
    if(secretCheck.error)throw secretCheck.error;
    if(secretCheck.data!==true)return json({ok:false,code:"UNAUTHORIZED"},401);

    let input:Record<string,unknown>={};try{input=await req.json()}catch{}
    const requested=Number(input.limit??5);
    const limit=Number.isFinite(requested)?Math.max(1,Math.min(5,Math.floor(requested))):5;
    const claims=await sb.rpc("velora_claim_paymob_reconciliation",{p_limit:limit,p_stale_minutes:70,p_lease_minutes:10});
    if(claims.error)throw claims.error;
    const rows=Array.isArray(claims.data)?claims.data:[];
    if(rows.length===0)return json({ok:true,claimed:0,processed:0,results:[]});

    const apiKey=String(Deno.env.get("PAYMOB_API_KEY")||"").trim();
    if(!apiKey){
      for(const row of rows){
        const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{p_payment_attempt_id:row.payment_attempt_id,p_outcome:"error",p_error:"PAYMOB_API_KEY_MISSING"});
        if(rr.error)throw rr.error;
      }
      return json({ok:false,code:"PAYMOB_API_KEY_MISSING",claimed:rows.length},503);
    }

    const auth=await getPaymobToken(apiKey);
    if(!auth.response.ok||!auth.token){
      for(const row of rows){
        const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{p_payment_attempt_id:row.payment_attempt_id,p_outcome:"error",p_http_status:auth.response.status,p_error:"PAYMOB_AUTH_FAILED"});
        if(rr.error)throw rr.error;
      }
      return json({ok:false,code:"PAYMOB_AUTH_FAILED",auth_http_status:auth.response.status,claimed:rows.length},502);
    }

    const results:Record<string,unknown>[]=[];
    for(const row of rows){
      try{
        const r=await fetch(PAYMOB_BASE+"/api/ecommerce/orders/transaction_inquiry",{
          method:"POST",
          headers:{"content-type":"application/json",Authorization:"Bearer "+auth.token},
          body:JSON.stringify({auth_token:auth.token,order_id:row.paymob_order_id})
        });
        let i:Record<string,unknown>={};try{i=await r.json()}catch{}
        const tx=typeof i.id==="string"||typeof i.id==="number"?String(i.id):null;

        if(!r.ok){
          const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{p_payment_attempt_id:row.payment_attempt_id,p_outcome:"error",p_http_status:r.status,p_error:"PAYMOB_INQUIRY_HTTP_ERROR"});
          if(rr.error)throw rr.error;
          results.push({payment_attempt_id:row.payment_attempt_id,outcome:"error",inquiry_http_status:r.status});
          continue;
        }

        const responseOrderId=i.order&&typeof i.order==="object"?String((i.order as Record<string,unknown>).id??"").trim():"";
        if(!responseOrderId||responseOrderId!==String(row.paymob_order_id)){
          const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{p_payment_attempt_id:row.payment_attempt_id,p_outcome:"ambiguous",p_provider_transaction_id:tx,p_http_status:r.status,p_error:"PAYMOB_ORDER_CORRELATION_MISMATCH"});
          if(rr.error)throw rr.error;
          results.push({payment_attempt_id:row.payment_attempt_id,outcome:"ambiguous"});
          continue;
        }

        const state=normalize(i);
        if(!state){
          const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{p_payment_attempt_id:row.payment_attempt_id,p_outcome:"ambiguous",p_provider_transaction_id:tx,p_http_status:r.status,p_error:"PAYMOB_INQUIRY_UNRECOGNIZED_STATE"});
          if(rr.error)throw rr.error;
          results.push({payment_attempt_id:row.payment_attempt_id,outcome:"ambiguous"});
          continue;
        }

        if(["authorized","captured","failed","refunded"].includes(state)&&!tx){
          const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{p_payment_attempt_id:row.payment_attempt_id,p_outcome:"ambiguous",p_http_status:r.status,p_error:"PAYMOB_TRANSACTION_ID_MISSING"});
          if(rr.error)throw rr.error;
          results.push({payment_attempt_id:row.payment_attempt_id,outcome:"ambiguous"});
          continue;
        }

        if(["authorized","captured","failed","refunded"].includes(state)){
          const applied=await sb.rpc("velora_apply_paymob_marketplace_transaction",{
            p_payment_attempt_id:row.payment_attempt_id,
            p_provider_transaction_id:tx,
            p_incoming_status:state,
            p_source:"inquiry"
          });
          if(applied.error)throw applied.error;
        }

        const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{
          p_payment_attempt_id:row.payment_attempt_id,
          p_outcome:state,
          p_provider_transaction_id:tx,
          p_http_status:r.status
        });
        if(rr.error)throw rr.error;
        results.push({payment_attempt_id:row.payment_attempt_id,outcome:state,state:rr.data?.status??null});
      }catch(e){
        const message=e instanceof Error?e.message:"PAYMOB_INQUIRY_PROCESSING_FAILED";
        const rr=await sb.rpc("velora_record_paymob_reconciliation_result",{p_payment_attempt_id:row.payment_attempt_id,p_outcome:"error",p_error:message.slice(0,500)});
        if(rr.error)throw rr.error;
        results.push({payment_attempt_id:row.payment_attempt_id,outcome:"error"});
      }
    }
    return json({ok:true,claimed:rows.length,processed:results.length,results});
  }catch(e){
    return json({ok:false,code:"PAYMOB_RECONCILIATION_FAILED",error_class:e instanceof Error?e.name:"Error"},500);
  }
});