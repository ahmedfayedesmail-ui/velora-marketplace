(()=>{
'use strict';
function v39El(id){return document.getElementById(id)}
async function v39Rpc(fn,args={}){if(window.supabaseClient?.rpc)return window.supabaseClient.rpc(fn,args); if(window.sb?.rpc)return window.sb.rpc(fn,args); return {data:null,error:new Error('Supabase client unavailable')}}
function v39t(value){return typeof window.VELORA_GET_TRANSLATION==='function'?window.VELORA_GET_TRANSLATION(String(value)):String(value)}
function v39Esc(value){return typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
async function v39LoadSubscription(){
 const host=v39El('veloraSellerSubscription39'); if(!host)return;
 host.innerHTML='<div class="velora-seller39-card"><div class="velora-seller39-muted">'+v39Esc(v39t('Loading subscription…'))+'</div></div>';
 try{
   const ent=await v39Rpc('velora_get_seller_entitlement');
   if(ent.error)throw ent.error;
   const plansR=await (window.supabaseClient||window.sb).from('subscription_plans').select('id,name,monthly_price,yearly_price,currency_code,commission_rate,max_products,features').eq('is_active',true).order('monthly_price');
   if(plansR.error)throw plansR.error;
   const plans=(plansR.data||[]).filter(p=>String(p.name).toLowerCase()!=='free');
   const e=ent.data||{};
   const activePaid=Boolean(e.is_paid&&e.subscription_id);
   const expires=e.expires_at?new Date(e.expires_at).toLocaleString():v39t('Not active');
   const currentPlan=e.plan_name||'Free';
   host.innerHTML=
     '<div class="velora-seller39-card">'+
       '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">'+
         '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Subscription'))+'</div>'+
         '<div style="font-size:1.25rem;font-weight:850;margin-top:.2rem">'+v39Esc(currentPlan)+'</div>'+
         '<div class="velora-seller39-muted" style="margin-top:.25rem">'+
           (activePaid?v39Esc(v39t('Active until'))+' '+v39Esc(expires):v39Esc(v39t('Free entitlement')))+'</div></div>'+
         '<span class="velora-seller39-pill">'+v39Esc(activePaid?v39t('Active'):v39t('Free'))+'</span>'+
       '</div>'+
       (plans.length?
       '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.7rem;margin-top:1rem">'+
         '<label><span class="velora-seller39-muted">'+v39Esc(v39t('Plan'))+'</span>'+
         '<select id="v39Plan" class="form-input" style="margin-top:.3rem">'+plans.map(p=>'<option value="'+v39Esc(p.id)+'" data-m="'+v39Esc(p.monthly_price)+'" data-y="'+v39Esc(p.yearly_price)+'" data-c="'+v39Esc(p.currency_code)+'">'+v39Esc(p.name)+'</option>').join('')+'</select></label>'+
         '<label><span class="velora-seller39-muted">'+v39Esc(v39t('Billing cycle'))+'</span>'+
         '<select id="v39Cycle" class="form-input" style="margin-top:.3rem"><option value="monthly">'+v39Esc(v39t('Monthly (30 days)'))+'</option><option value="yearly">'+v39Esc(v39t('Yearly'))+'</option></select></label>'+
       '</div>'+
       '<div class="velora-seller39-muted" id="v39Price" style="margin-top:.65rem"></div>'+
       '<button class="velora-seller39-btn primary" id="v39Subscribe" style="margin-top:.7rem">'+v39Esc(v39t(activePaid?'Change subscription':'Start paid subscription'))+'</button>'+
       '<div class="velora-seller39-muted" id="v39SubStatus" style="margin-top:.55rem"></div>'
       :'')+
       '<div class="velora-seller39-muted" style="margin-top:.7rem">'+v39Esc(v39t('Permissions are enforced server-side. Payment provider settlement is not assumed until verified.'))+'</div>'+
     '</div>';
   const planEl=v39El('v39Plan'),cycleEl=v39El('v39Cycle'),priceEl=v39El('v39Price'),button=v39El('v39Subscribe'),statusEl=v39El('v39SubStatus');
   const refreshPrice=()=>{const o=planEl?.selectedOptions?.[0];if(!o||!priceEl)return;const val=cycleEl?.value==='yearly'?o.dataset.y:o.dataset.m;priceEl.textContent=v39t('Price')+': '+val+' '+(o.dataset.c||'');};
   planEl?.addEventListener('change',refreshPrice);cycleEl?.addEventListener('change',refreshPrice);refreshPrice();
   button?.addEventListener('click',async()=>{
     if(!planEl||!cycleEl)return;
     button.disabled=true;
     if(statusEl)statusEl.textContent=v39t('Starting secure checkout…');
     try{
       const country=(window.VELORA_MARKET_CONTEXT?.countryCode||document.getElementById('veloraCountryCode')?.value||e.country_code||'EG').toUpperCase();
       const key='VELORA-SUB-'+planEl.value+'-'+cycleEl.value+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
       const fn=(window.mahaSupabase||window.supabaseClient||window.sb)?.functions;
       if(!fn?.invoke)throw new Error('Payment session service unavailable');
       const result=await fn.invoke('velora-subscription-paymob-checkout-restore-test',{body:{plan_id:planEl.value,country_code:country,billing_cycle:cycleEl.value,idempotency_key:key,return_url:window.location.href}});
       if(result.error)throw result.error;
       const data=result.data||{};
       if(data.checkout_url){window.location.assign(data.checkout_url);return;}
       throw new Error(data.code||data.error||'SUBSCRIPTION_CHECKOUT_UNAVAILABLE');
     }catch(err){
       if(statusEl)statusEl.textContent=v39t('Checkout unavailable')+': '+(err.message||err);
       button.disabled=false;
     }
   });
 }catch(err){
   host.innerHTML='<div class="velora-seller39-card"><strong>'+v39Esc(v39t('Subscription unavailable'))+'</strong><div class="velora-seller39-muted" style="margin-top:.35rem">'+v39Esc(err.message||err)+'</div></div>';
 }
}
async function v39Load(){
 const host=v39El('veloraSellerOps39'); if(!host)return;
 host.innerHTML='<div class="velora-seller39"><div class="velora-seller39-card">Loading seller operations…</div></div>';
 const r=await v39Rpc('velora_get_seller_ops_dashboard');
 if(r.error){host.innerHTML='<div class="velora-seller39"><div class="velora-seller39-card"><strong>Seller Operations</strong><div class="velora-seller39-muted" style="margin-top:6px">'+(r.error.message||'Access unavailable')+'</div></div></div>';return}
 const d=r.data||{};
 host.innerHTML=`<div class="velora-seller39">
 <div class="velora-seller39-grid">
  <div class="velora-seller39-card"><div class="velora-seller39-muted">Active products</div><div class="velora-seller39-kpi">${d.active_products??0}</div></div>
  <div class="velora-seller39-card"><div class="velora-seller39-muted">Pending approval</div><div class="velora-seller39-kpi">${d.pending_products??0}</div></div>
  <div class="velora-seller39-card"><div class="velora-seller39-muted">Open orders</div><div class="velora-seller39-kpi">${d.open_orders??0}</div></div>
  <div class="velora-seller39-card"><div class="velora-seller39-muted">Processing</div><div class="velora-seller39-kpi">${d.processing_orders??0}</div></div>
  <div class="velora-seller39-card"><div class="velora-seller39-muted">Shipped</div><div class="velora-seller39-kpi">${d.shipped_orders??0}</div></div>
  <div class="velora-seller39-card"><div class="velora-seller39-muted">Low stock</div><div class="velora-seller39-kpi">${d.low_stock_products??0}</div></div>
 </div>
 <div id="veloraSellerSubscription39" style="margin-top:12px"></div>
 <div class="velora-seller39-card" style="margin-top:12px"><div class="velora-seller39-muted">Estimated seller earnings</div><div class="velora-seller39-kpi">${Number(d.estimated_earnings||0).toLocaleString()}</div><div class="velora-seller39-muted" style="margin-top:6px">Operational estimate from canonical order items; not a payout settlement.</div>
 <div class="velora-seller39-actions"><button class="velora-seller39-btn primary" id="v39Snapshot">Capture operations snapshot</button><button class="velora-seller39-btn" id="v39Refresh">Refresh</button></div></div>
 </div>`;
 v39El('v39Snapshot')?.addEventListener('click',async()=>{const x=await v39Rpc('velora_capture_seller_ops_snapshot'); if(x.error) alert(x.error.message||'Snapshot failed'); else {alert('Operations snapshot captured');v39Load()}});
 v39El('v39Refresh')?.addEventListener('click',()=>{v39Load();v39LoadSubscription()});
 v39LoadSubscription();
}
function v39Install(){
 let admin=document.querySelector('[data-page="seller-operations"],#page-seller-operations,#page-seller');
 if(!admin || (admin.classList.contains('page') && !admin.classList.contains('active')))return;
 if(document.getElementById('veloraSellerOps39'))return;
 const wrap=document.createElement('div');wrap.id='veloraSellerOps39';
 const title=document.createElement('div');title.innerHTML='<h2 style="margin:0 0 8px">🏪 Seller Command Center</h2><div class="velora-seller39-muted">Seller-scoped operations, catalog health, order flow and earnings signals.</div>';
 wrap.appendChild(title);wrap.insertAdjacentHTML('beforeend','');
 admin.appendChild(wrap);setTimeout(()=>{v39Load();v39LoadSubscription()},50);
}
const oldLoad=window.loadPageContent;
window.loadPageContent=function(page){const r=typeof oldLoad==='function'?oldLoad.apply(this,arguments):undefined; if(String(page).toLowerCase().includes('seller'))setTimeout(v39Install,150);return r};
setTimeout(v39Install,1800);
console.log('✅ Velora Stage 39 Seller UX & Operations loaded');
})();
