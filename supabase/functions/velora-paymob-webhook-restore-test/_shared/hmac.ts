
import { createClient } from "npm:@supabase/supabase-js@2";
export type ProviderMode = "mock" | "paymob";
export function getProviderMode(): ProviderMode {
  const raw=(Deno.env.get("VELORA_PAYMENT_PROVIDER")??"").trim().toLowerCase();
  if(raw==="mock"||raw==="paymob") return raw;
  throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
}
export function constantTimeEqualHex(a:string,b:string):boolean{
  const aa=a.trim().toLowerCase(),bb=b.trim().toLowerCase(); if(!aa||aa.length!==bb.length)return false;
  let diff=0; for(let i=0;i<aa.length;i++)diff|=aa.charCodeAt(i)^bb.charCodeAt(i); return diff===0;
}
export async function hmacSha512Hex(secret:string,message:string):Promise<string>{
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-512"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function resolvePaymobHmacSecret(mode:ProviderMode,supabase:ReturnType<typeof createClient>):Promise<string>{
  if(mode==="paymob"){const s=Deno.env.get("PAYMOB_HMAC")??"";if(!s)throw new Error("PAYMOB_HMAC_MISSING");return s;}
  const r=await supabase.rpc("velora_get_mock_paymob_hmac_internal");if(r.error)throw new Error("MOCK_PAYMOB_HMAC_LOOKUP_FAILED:"+r.error.message);
  const s=String(r.data??"");if(!s)throw new Error("MOCK_PAYMOB_HMAC_MISSING");return s;
}
