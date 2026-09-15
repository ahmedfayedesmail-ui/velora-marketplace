(()=>{'use strict';
const v57=window.VELORA_STAGE56={
 async load(){
   const c=window.supabaseClient||window.sb; const host=document.getElementById('veloraStage57'); if(!host)return;
   let data=null,error=null;
   if(c?.rpc){const r=await c.rpc('velora_get_integration_control_plane');data=r.data;error=r.error?.message||null;}
   const rows=Array.isArray(data)?data:(data?.integrations||data?.rows||[]); const paymob=rows.find(x=>String(x.integration_key||x.key||'').toLowerCase()==='payment_paymob');
   const status=String(paymob?.status||'blocked').toUpperCase(); const creds=!!paymob?.credentials_configured; const webhook=!!paymob?.webhook_signature_verified;
   host.innerHTML=`<div class="v57-wrap"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0 0 6px">💳 Stage 56 — Paymob Payment Adapter</h3><div class="v57-muted">Server-side Paymob Checkout adapter. The browser never receives STRIPE_SECRET_KEY.</div></div><span class="v57-pill ${status==='READY'?'v57-green':status==='FAILED'?'v57-red':'v57-amber'}">${status}</span></div>
   <div class="v57-grid" style="margin-top:12px"><div class="v57-card"><div class="v57-muted">Provider</div><div class="v57-big">Paymob</div></div><div class="v57-card"><div class="v57-muted">Credentials</div><div class="v57-big">${creds?'Configured':'Required'}</div></div><div class="v57-card"><div class="v57-muted">Webhook verification</div><div class="v57-big">${webhook?'Verified':'Pending'}</div></div><div class="v57-card"><div class="v57-muted">Function</div><div class="v57-big">v2</div></div></div>
   <div class="v57-card" style="margin-top:12px"><strong>Activation gates</strong><div class="v57-muted" style="margin-top:8px">1) PAYMOB_SECRET_KEY · PAYMOB_PUBLIC_KEY · PAYMOB_HMAC · Integration ID 5920533 · sandbox transaction test · production cutover approval</div></div>
   <div class="v57-actions" style="margin-top:12px"><button class="v57-btn primary" id="v57Refresh">↻ Refresh provider status</button></div>
   <div class="v57-muted" style="margin-top:10px">Control plane response: ${error?String(error).replace(/[<>]/g,''):paymob?'Paymob integration is registered in the control plane.':'Paymob record not returned in the current staff runtime.'}</div></div>`;
   document.getElementById('v57Refresh')?.addEventListener('click',()=>v57.load());
 },
 addNav(){
   const nav=document.querySelector('#adminPlatform .admin-nav,.admin-sidebar,.admin-nav'); if(!nav||nav.querySelector('[data-v57-nav]'))return;
   const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Payments</div><div class="admin-nav-item" data-v57-nav><span>💳</span><span>Paymob Adapter</span></div>';
   const item=sec.querySelector('[data-v57-nav]'); item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const t=document.getElementById('adminHeaderTitle');if(t)t.textContent='Paymob Payment Adapter';v57.install()};nav.appendChild(sec);
 },
 install(){if(document.getElementById('veloraStage57'))return;const c=document.getElementById('adminContent');if(!c)return;const h=document.createElement('div');h.id='veloraStage57';c.appendChild(h);v57.load()}
};
const boot56=()=>{v57.addNav();if(document.getElementById('adminPlatform')?.classList.contains('active'))v57.install()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot56);else boot56();
console.log('✅ Velora Stage 56 Paymob Payment Adapter loaded');})();
