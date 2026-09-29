(()=>{
'use strict';
function v39El(id){return document.getElementById(id)}
async function v39Rpc(fn,args={}){if(window.supabaseClient?.rpc)return window.supabaseClient.rpc(fn,args); if(window.sb?.rpc)return window.sb.rpc(fn,args); return {data:null,error:new Error('Supabase client unavailable')}}
function v39t(value){return typeof window.VELORA_GET_TRANSLATION==='function'?window.VELORA_GET_TRANSLATION(String(value)):String(value)}
function v39Esc(value){return typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
async function v39LoadPayouts(){
 const host=v39El('veloraSellerPayout39'); if(!host)return;
 host.innerHTML='<div class="velora-seller39-card"><div class="velora-seller39-muted">'+v39Esc(v39t('Loading payout balance…'))+'</div></div>';
 try{
   const r=await v39Rpc('velora_get_seller_financial_summary');
   if(r.error)throw r.error;
   const d=r.data||{};
   const eligible=Number(d.payout_eligible||0);
   host.innerHTML=
    '<div class="velora-seller39-card">'+
      '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">'+
        '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Payout & earnings'))+'</div>'+
        '<div style="font-size:1.25rem;font-weight:850;margin-top:.2rem">'+v39Esc(String(d.currency||'EGP'))+' '+v39Esc(Number(d.seller_net_finalized||0).toFixed(2))+'</div>'+
        '<div class="velora-seller39-muted" style="margin-top:.25rem">'+v39Esc(v39t('Finalized seller earnings'))+'</div></div>'+
        '<span class="velora-seller39-pill">'+v39Esc(v39t('Eligible'))+': '+v39Esc(String(eligible.toFixed(2)))+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem;margin-top:1rem">'+
        '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Payout eligible'))+'</div><strong>'+v39Esc(Number(d.payout_eligible||0).toFixed(2))+' '+v39Esc(d.currency||'')+'</strong></div>'+
        '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Pending payouts'))+'</div><strong>'+v39Esc(Number(d.payouts_pending_or_processing||0).toFixed(2))+' '+v39Esc(d.currency||'')+'</strong></div>'+
        '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Paid out'))+'</div><strong>'+v39Esc(Number(d.payouts_paid||0).toFixed(2))+' '+v39Esc(d.currency||'')+'</strong></div>'+
      '</div>'+
      '<button id="v39RequestPayout" class="velora-seller39-btn primary" style="margin-top:.8rem" '+(eligible>0?'':'disabled')+'>'+v39Esc(v39t('Request eligible payout'))+'</button>'+
      '<div class="velora-seller39-muted" id="v39PayoutStatus" style="margin-top:.5rem">'+v39Esc(v39t('Payout policy: delivery + 7-day return window. External execution is recorded with evidence; it is not simulated.'))+'</div>'+
    '</div>';
   v39El('v39RequestPayout')?.addEventListener('click',async()=>{
      const b=v39El('v39RequestPayout');const s=v39El('v39PayoutStatus');if(!b)return;b.disabled=true;if(s)s.textContent=v39t('Requesting payout…');
      try{
        const x=await v39Rpc('velora_request_seller_payout', {p_currency:d.currency||null});
        if(x.error)throw x.error;
        if(s)s.textContent=v39t('Payout request created.')+' '+JSON.stringify(x.data||{});
        await v39LoadPayouts();
      }catch(err){if(s)s.textContent=v39t('Payout unavailable')+': '+(err.message||err);b.disabled=false;}
   });
 }catch(err){
   host.innerHTML='<div class="velora-seller39-card"><strong>'+v39Esc(v39t('Payout summary unavailable'))+'</strong><div class="velora-seller39-muted" style="margin-top:.35rem">'+v39Esc(err.message||err)+'</div></div>';
 }
}

async function v39LoadSubscription(){
 const host=v39El('veloraSellerSubscription39'); if(!host)return;
 host.innerHTML='<div class="velora-seller39-card"><div class="velora-seller39-muted">'+v39Esc(v39t('Loading subscription…'))+'</div></div>';
 try{
   const ent=await v39Rpc('velora_get_seller_entitlement');
   if(ent.error)throw ent.error;
   const client=window.supabaseClient||window.sb;
   const [plansR,legalR]=await Promise.all([
     client.from('subscription_plans').select('id,name,monthly_price,yearly_price,currency_code,commission_rate,max_products,features').eq('is_active',true).order('monthly_price'),
     client.rpc('velora_get_required_legal_documents',{p_locale:String(window.VELORA_GLOBAL_LOCALE||localStorage.getItem('velora_language')||'en').toLowerCase(),p_audience:'seller'})
   ]);
   if(plansR.error)throw plansR.error;
   if(legalR.error)throw legalR.error;
   const plans=(plansR.data||[]).filter(p=>String(p.name).toLowerCase()!=='free');
   const sellerLegalDocs=(Array.isArray(legalR.data)?legalR.data:[]).filter(d=>['seller_agreement','seller_subscription','seller_commission'].includes(d.document_type));
   const sellerLegalTypes=new Set(sellerLegalDocs.map(d=>d.document_type));
   const sellerLegalReady=['seller_agreement','seller_subscription','seller_commission'].every(type=>sellerLegalTypes.has(type));
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
       (sellerLegalDocs.length&&!activePaid?'<label style="display:flex;gap:.6rem;align-items:flex-start;margin-top:.75rem;cursor:pointer"><input id="v39LegalConsent" type="checkbox" style="margin-top:.25rem"><span>'+v39Esc(v39t('I agree to the published seller agreement, subscription terms and commission terms applicable to this purchase.'))+'</span></label>':'')+
       '<button class="velora-seller39-btn primary" id="v39Subscribe" style="margin-top:.7rem" '+(activePaid?'disabled':'')+'>'+v39Esc(v39t(activePaid?'Paid subscription active':'Start paid subscription'))+'</button>'+
       '<div class="velora-seller39-muted" id="v39SubStatus" style="margin-top:.55rem"></div>'
       :'')+
       '<div class="velora-seller39-muted" style="margin-top:.7rem">'+v39Esc(v39t('Permissions are enforced server-side. Payment provider settlement is not assumed until verified.'))+'</div>'+
     '</div>';
   const planEl=v39El('v39Plan'),cycleEl=v39El('v39Cycle'),priceEl=v39El('v39Price'),button=v39El('v39Subscribe'),statusEl=v39El('v39SubStatus');
   if(activePaid){if(planEl)planEl.disabled=true;if(cycleEl)cycleEl.disabled=true;if(statusEl)statusEl.textContent=v39t('Upgrade / change flow will be added only with a governed replacement policy.');}
   const refreshPrice=()=>{const o=planEl?.selectedOptions?.[0];if(!o||!priceEl)return;const val=cycleEl?.value==='yearly'?o.dataset.y:o.dataset.m;priceEl.textContent=v39t('Price')+': '+val+' '+(o.dataset.c||'');};
   planEl?.addEventListener('change',refreshPrice);cycleEl?.addEventListener('change',refreshPrice);refreshPrice();
   button?.addEventListener('click',async()=>{
     if(!planEl||!cycleEl)return;
     button.disabled=true;
     if(statusEl)statusEl.textContent=v39t('Starting secure checkout…');
     try{
       const country=(window.VELORA_MARKET_CONTEXT?.countryCode||document.getElementById('veloraCountryCode')?.value||e.country_code||'EG').toUpperCase();
       if(!activePaid&&!sellerLegalReady){if(statusEl)statusEl.textContent=v39t('Seller subscription terms are not published yet.');button.disabled=false;return;}
       if(!activePaid&&!v39El('v39LegalConsent')?.checked){if(statusEl)statusEl.textContent=v39t('Legal acceptance is required before subscription checkout.');button.disabled=false;return;}
       if(!activePaid){
         for(const d of sellerLegalDocs){
           const accepted=await (window.supabaseClient||window.sb).rpc('velora_accept_legal_document',{p_document_id:d.id,p_acceptance_method:'subscription_purchase',p_context:{surface:'seller_subscription',billing_cycle:cycleEl.value,plan_id:planEl.value}});
           if(accepted.error)throw accepted.error;
         }
       }
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
function v39AdIdempotencyStorageKey(packageId,productId){
 return 'VELORA-AD-'+String(packageId||'')+'-'+String(productId||'');
}
function v39AdIdempotencyKey(packageId,productId){
 const key=v39AdIdempotencyStorageKey(packageId,productId);
 try{
  const existing=sessionStorage.getItem(key);
  if(existing) return existing;
  const created=key+'-'+
    (typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2,10));
  sessionStorage.setItem(key,created);
  return created;
 }catch(_){
  return key+'-'+Date.now();
 }
}
function v39ReconcileAdIdempotencyKeys(campaigns){
 try{
  const terminal=new Set(['active','completed','payment_failed','refunded','cancelled']);
  (Array.isArray(campaigns)?campaigns:[]).forEach(c=>{
    if(!c?.ad_package_id||!c?.product_id) return;
    if(terminal.has(String(c.status||'').toLowerCase())){
      sessionStorage.removeItem(v39AdIdempotencyStorageKey(c.ad_package_id,c.product_id));
    }
  });
 }catch(_){}
}

async function v39LoadAds(){
 const host=v39El('veloraSellerAds39'); if(!host)return;
 host.innerHTML='<div class="velora-seller39-card"><div class="velora-seller39-muted">'+v39Esc(v39t('Loading advertising…'))+'</div></div>';
 try{
  const r=await v39Rpc('velora_get_seller_ad_checkout_context');
  if(r.error)throw r.error;
  const d=r.data||{}, packages=Array.isArray(d.packages)?d.packages:[], products=Array.isArray(d.products)?d.products:[], campaigns=Array.isArray(d.campaigns)?d.campaigns:[], docs=Array.isArray(d.legal_documents)?d.legal_documents:[];
  v39ReconcileAdIdempotencyKeys(campaigns);
  const legalReady=Boolean(d.legal_ready);
  const packageOptions=packages.map(p=>'<option value="'+v39Esc(p.id)+'">'+v39Esc(p.name)+' — '+v39Esc(Number(p.price||0).toFixed(2))+' '+v39Esc(p.currency_code||d.currency_code||'EGP')+'</option>').join('');
  const productOptions=products.map(p=>'<option value="'+v39Esc(p.id)+'">'+v39Esc((p.brand?p.brand+' · ':'')+p.name)+'</option>').join('');
  const campaignRows=campaigns.length?campaigns.map(x=>'<div class="velora-seller39-card" style="padding:.75rem"><div style="display:flex;justify-content:space-between;gap:.7rem;flex-wrap:wrap"><strong>'+v39Esc(x.product_name||'Product')+'</strong><span class="velora-seller39-pill">'+v39Esc(x.status||'')+'</span></div><div class="velora-seller39-muted" style="margin-top:.35rem">'+v39Esc(x.package_name||x.package_code||'')+' · '+v39Esc(x.placement||'')+(x.ends_at?' · '+v39Esc(new Date(x.ends_at).toLocaleString()):'')+'</div></div>').join(''):'<div class="velora-seller39-muted" style="margin-top:1rem">'+v39Esc(v39t('No sponsored placements yet.'))+'</div>';
  host.innerHTML='<div class="velora-seller39-card">'+
   '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">'+
    '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Seller Advertising'))+'</div><div style="font-size:1.2rem;font-weight:850;margin-top:.2rem">'+v39Esc(v39t('Promote an approved product'))+'</div></div>'+
    '<span class="velora-seller39-pill">'+v39Esc(d.country_code||'EG')+' · '+v39Esc(d.currency_code||'EGP')+'</span>'+
   '</div>'+
   (products.length&&packages.length?'<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.7rem;margin-top:1rem">'+
     '<label><span class="velora-seller39-muted">'+v39Esc(v39t('Product'))+'</span><select id="v39AdProduct" class="form-input" style="margin-top:.3rem">'+productOptions+'</select></label>'+
     '<label><span class="velora-seller39-muted">'+v39Esc(v39t('Package'))+'</span><select id="v39AdPackage" class="form-input" style="margin-top:.3rem">'+packageOptions+'</select></label>'+
    '</div>'+
    '<label style="display:flex;gap:.6rem;align-items:flex-start;margin-top:.8rem"><input id="v39AdConsent" type="checkbox" '+(legalReady?'':'disabled')+'><span>'+v39Esc(legalReady?v39t('I agree to the published seller agreement and acceptable-use terms for advertising.'):v39t('Advertising checkout is blocked until the required seller legal documents are published.'))+'</span></label>'+
    '<button id="v39StartAd" class="velora-seller39-btn primary" style="margin-top:.8rem" '+(legalReady?'':'disabled')+'>'+v39Esc(v39t('Start secure advertising checkout'))+'</button>'+
    '<div id="v39AdStatus" class="velora-seller39-muted" style="margin-top:.55rem">'+v39Esc(legalReady?v39t('Payment and activation are handled by the canonical server flow.'):v39t('Legal readiness required.'))+'</div>'
    :'<div class="velora-seller39-muted" style="margin-top:1rem">'+v39Esc(v39t('No approved product or active advertising package is available.'))+'</div>')+
   campaignRows+
  '</div>';

  v39El('v39StartAd')?.addEventListener('click',async()=>{
   const b=v39El('v39StartAd'),s=v39El('v39AdStatus'),productEl=v39El('v39AdProduct'),packageEl=v39El('v39AdPackage'),consent=v39El('v39AdConsent'),client=window.supabaseClient||window.sb;
   if(!b||!productEl||!packageEl||!legalReady)return;
   if(!consent?.checked){if(s)s.textContent=v39t('Legal acceptance is required before advertising checkout.');return;}
   b.disabled=true;if(s)s.textContent=v39t('Preparing secure advertising checkout…');
   try{
    for(const doc of docs){
     const a=await client.rpc('velora_accept_legal_document',{p_document_id:doc.id,p_acceptance_method:'explicit_checkbox',p_context:{surface:'seller_advertising',product_id:productEl.value,ad_package_id:packageEl.value}});
     if(a.error)throw a.error;
    }
    const fn=(window.mahaSupabase||client)?.functions;
    if(!fn?.invoke)throw new Error('Payment session service unavailable');
    const x=await fn.invoke('velora-seller-ad-paymob-checkout-restore-test',{body:{ad_package_id:packageEl.value,product_id:productEl.value,country_code:String(d.country_code||'EG').toUpperCase(),idempotency_key:v39AdIdempotencyKey(packageEl.value,productEl.value),return_url:window.location.href}});
    if(x.error)throw x.error;
    const data=x.data||{};
    if(data.checkout_url){window.location.assign(data.checkout_url);return;}
    if(String(data.status||'').toUpperCase()==='ALREADY_ACTIVE'){if(s)s.textContent=v39t('This placement is already active.');b.disabled=false;return;}
    throw new Error(data.code||data.error||'SELLER_AD_CHECKOUT_UNAVAILABLE');
   }catch(e){if(s)s.textContent=v39t('Advertising checkout unavailable')+': '+(e.message||e);b.disabled=false;}
  });
 }catch(e){
  host.innerHTML='<div class="velora-seller39-card"><strong>'+v39Esc(v39t('Seller advertising unavailable'))+'</strong><div class="velora-seller39-muted" style="margin-top:.35rem">'+v39Esc(e.message||e)+'</div></div>';
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
 <div id="veloraSellerPayout39" style="margin-top:12px"></div>
 <div id="veloraSellerAds39" style="margin-top:12px"></div>
 <div class="velora-seller39-card" style="margin-top:12px"><div class="velora-seller39-muted">Estimated seller earnings</div><div class="velora-seller39-kpi">${Number(d.estimated_earnings||0).toLocaleString()}</div><div class="velora-seller39-muted" style="margin-top:6px">Operational estimate from canonical order items; not a payout settlement.</div>
 <div class="velora-seller39-actions"><button class="velora-seller39-btn primary" id="v39Snapshot">Capture operations snapshot</button><button class="velora-seller39-btn" id="v39Refresh">Refresh</button></div></div>
 </div>`;
 v39El('v39Snapshot')?.addEventListener('click',async()=>{const x=await v39Rpc('velora_capture_seller_ops_snapshot'); if(x.error) alert(x.error.message||'Snapshot failed'); else {alert('Operations snapshot captured');v39Load()}});
 v39El('v39Refresh')?.addEventListener('click',()=>{v39Load();v39LoadSubscription();v39LoadAds()});
 v39LoadSubscription();
 v39LoadPayouts();
 v39LoadAds();
}
function v39Install(){
 let admin=document.querySelector('[data-page="seller-operations"],#page-seller-operations,#page-seller');
 if(!admin || (admin.classList.contains('page') && !admin.classList.contains('active')))return;
 if(document.getElementById('veloraSellerOps39'))return;
 const wrap=document.createElement('div');wrap.id='veloraSellerOps39';
 const title=document.createElement('div');title.innerHTML='<h2 style="margin:0 0 8px">🏪 Seller Command Center</h2><div class="velora-seller39-muted">Seller-scoped operations, catalog health, order flow and earnings signals.</div>';
 wrap.appendChild(title);wrap.insertAdjacentHTML('beforeend','');
 admin.appendChild(wrap);setTimeout(()=>{v39Load();v39LoadSubscription();v39LoadPayouts()},50);
}
const oldLoad=window.loadPageContent;
window.loadPageContent=function(page){const r=typeof oldLoad==='function'?oldLoad.apply(this,arguments):undefined; if(String(page).toLowerCase().includes('seller'))setTimeout(v39Install,150);return r};
setTimeout(v39Install,1800);
console.log('✅ Velora Stage 39 Seller UX & Operations loaded');
})();
