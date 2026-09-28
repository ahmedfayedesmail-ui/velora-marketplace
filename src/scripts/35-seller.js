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
   const e=ent.data||{};
   const [plansR,legalR,storeR]=await Promise.all([
     client.from('subscription_plans').select('id,name,commission_rate,max_products,features').eq('is_active',true).order('monthly_price'),
     client.rpc('velora_get_required_legal_documents',{p_locale:String(window.VELORA_GLOBAL_LOCALE||localStorage.getItem('velora_language')||'en').toLowerCase(),p_audience:'seller'}),
     client.from('stores').select('country_code,currency_code').eq('id',e.store_id).eq('status','approved').maybeSingle()
   ]);
   if(plansR.error)throw plansR.error;
   if(legalR.error)throw legalR.error;
   if(storeR.error)throw storeR.error;
   const store=storeR.data||{};
   const sellerCountry=String(store.country_code||window.VELORA_MARKET_CONTEXT?.countryCode||'EG').toUpperCase();
   const basePlans=(plansR.data||[]).filter(p=>String(p.name).toLowerCase()!=='free');
   const plans=await Promise.all(basePlans.map(async p=>{
     const [monthlyR,yearlyR]=await Promise.all([
       client.rpc('velora_resolve_subscription_price',{p_plan_id:p.id,p_country_code:sellerCountry,p_billing_cycle:'monthly'}),
       client.rpc('velora_resolve_subscription_price',{p_plan_id:p.id,p_country_code:sellerCountry,p_billing_cycle:'yearly'})
     ]);
     if(monthlyR.error)throw monthlyR.error;
     if(yearlyR.error)throw yearlyR.error;
     const monthly=Array.isArray(monthlyR.data)?monthlyR.data[0]:monthlyR.data;
     const yearly=Array.isArray(yearlyR.data)?yearlyR.data[0]:yearlyR.data;
     if(!monthly?.currency_code||monthly.price==null||!yearly?.currency_code||yearly.price==null){
       throw new Error('REGIONAL_SUBSCRIPTION_PRICING_UNAVAILABLE');
     }
     return {...p,regional_monthly_price:monthly.price,regional_yearly_price:yearly.price,regional_currency_code:monthly.currency_code};
   }));
   const sellerLegalDocs=(Array.isArray(legalR.data)?legalR.data:[]).filter(d=>['seller_agreement','seller_subscription','seller_commission'].includes(d.document_type));
   const sellerLegalTypes=new Set(sellerLegalDocs.map(d=>d.document_type));
   const sellerLegalReady=['seller_agreement','seller_subscription','seller_commission'].every(type=>sellerLegalTypes.has(type));
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
         '<select id="v39Plan" class="form-input" style="margin-top:.3rem">'+plans.map(p=>'<option value="'+v39Esc(p.id)+'" data-m="'+v39Esc(p.regional_monthly_price)+'" data-y="'+v39Esc(p.regional_yearly_price)+'" data-c="'+v39Esc(p.regional_currency_code)+'">'+v39Esc(p.name)+'</option>').join('')+'</select></label>'+
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
       const country=sellerCountry;
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
async function v39LoadAnalytics(){
 const host=v39El('veloraSellerAnalytics39'); if(!host)return;
 host.innerHTML='<div class="velora-seller39-card"><div class="velora-seller39-muted">'+v39Esc(v39t('Loading performance…'))+'</div></div>';
 try{
   const r=await v39Rpc('velora_get_seller_analytics',{p_days:30});
   if(r.error)throw r.error;
   const d=r.data||{},s=d.summary||{},top=Array.isArray(d.top_products)?d.top_products.slice(0,5):[];
   const currency=String(s.currency||'EGP');
   const money=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
   host.innerHTML=
    '<div class="velora-seller39-card">'+
      '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">'+
       '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Performance'))+'</div>'+
       '<div style="font-size:1.15rem;font-weight:850;margin-top:.2rem">'+v39Esc(v39t('Last 30 days'))+'</div>'+
       '<div class="velora-seller39-muted" style="margin-top:.25rem">'+v39Esc(v39t('Canonical seller sales analytics; advertising metrics are tracked separately and are not yet included.'))+'</div></div>'+
       '<span class="velora-seller39-pill">'+v39Esc(currency)+'</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.6rem;margin-top:1rem">'+
       '<div><div class="velora-seller39-muted">'+v39Esc(v39t('GMV'))+'</div><strong>'+v39Esc(money(s.gmv))+'</strong></div>'+
       '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Net earnings'))+'</div><strong>'+v39Esc(money(s.net_earnings))+'</strong></div>'+
       '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Orders'))+'</div><strong>'+v39Esc(String(s.orders??0))+'</strong></div>'+
       '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Conversion'))+'</div><strong>'+v39Esc('—')+'</strong><div class="velora-seller39-muted" style="font-size:.75rem">'+v39Esc(v39t('Traffic events not yet modeled'))+'</div></div>'+
      '</div>'+
      (top.length?'<div style="margin-top:.9rem"><div class="velora-seller39-muted">'+v39Esc(v39t('Top products'))+'</div>'+top.map(p=>'<div style="display:flex;justify-content:space-between;gap:.7rem;margin-top:.35rem"><span>'+v39Esc(p.name||'Product')+'</span><strong>'+v39Esc(money(p.gmv))+' '+v39Esc(currency)+'</strong></div>').join('')+'</div>':'')+
    '</div>';
 }catch(err){
   host.innerHTML='<div class="velora-seller39-card"><strong>'+v39Esc(v39t('Performance unavailable'))+'</strong><div class="velora-seller39-muted" style="margin-top:.35rem">'+v39Esc(err.message||err)+'</div></div>';
 }
}

async function v39LoadAds(){
 const host=v39El('veloraSellerAds39'); if(!host)return;
 host.innerHTML='<div class="velora-seller39-card"><div class="velora-seller39-muted">'+v39Esc(v39t('Loading sponsored advertising…'))+'</div></div>';
 try{
   const r=await v39Rpc('velora_get_seller_ad_checkout_context');
   if(r.error)throw r.error;
   const d=r.data||{};
   const packages=Array.isArray(d.packages)?d.packages:[];
   const products=Array.isArray(d.products)?d.products:[];
   const campaigns=Array.isArray(d.campaigns)?d.campaigns:[];
   const legalDocs=Array.isArray(d.legal_documents)?d.legal_documents:[];
   const legalReady=d.legal_ready===true;
   const supported=d.payment_country_supported===true && String(d.currency_code||'').toUpperCase()==='EGP';
   const money=v=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
   const campaignHtml=campaigns.length
     ? campaigns.slice(0,8).map(c=>'<div style="padding:.6rem .7rem;border:1px solid var(--border);border-radius:10px;margin-top:.5rem;background:var(--bg)">'+
         '<div style="display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap"><strong>'+v39Esc(c.product_name||'Product')+'</strong><span class="velora-seller39-pill">'+v39Esc(c.status||'')+'</span></div>'+
         '<div class="velora-seller39-muted" style="margin-top:.2rem">'+v39Esc(c.package_name||'Sponsored placement')+' · '+v39Esc(money(c.price))+' '+v39Esc(c.currency_code||'EGP')+
         (c.ends_at?' · '+v39Esc(v39t('Ends'))+' '+v39Esc(new Date(c.ends_at).toLocaleString()):'')+'</div></div>').join('')
     : '<div class="velora-seller39-muted" style="margin-top:.5rem">'+v39Esc(v39t('No advertising purchases yet.'))+'</div>';
   host.innerHTML=
     '<div class="velora-seller39-card">'+
       '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap">'+
         '<div><div class="velora-seller39-muted">'+v39Esc(v39t('Seller Advertising'))+'</div>'+
         '<div style="font-size:1.25rem;font-weight:850;margin-top:.2rem">'+v39Esc(v39t('Promote an approved product'))+'</div>'+
         '<div class="velora-seller39-muted" style="margin-top:.25rem">'+v39Esc(v39t('Choose a sponsored placement, pay securely, and the campaign activates automatically after payment capture.'))+'</div></div>'+
         '<span class="velora-seller39-pill">'+v39Esc(String(d.currency_code||'EGP'))+'</span>'+
       '</div>'+
       '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.7rem;margin-top:1rem">'+
         '<label><span class="velora-seller39-muted">'+v39Esc(v39t('Advertising package'))+'</span>'+
         '<select id="v39AdPackage" class="form-input" style="margin-top:.3rem">'+
           packages.map(p=>'<option value="'+v39Esc(p.id)+'">'+v39Esc(p.name)+' — '+v39Esc(money(p.price))+' '+v39Esc(p.currency_code||'EGP')+' · '+v39Esc(p.duration_days)+' '+v39Esc(v39t('days'))+'</option>').join('')+
         '</select></label>'+
         '<label><span class="velora-seller39-muted">'+v39Esc(v39t('Approved product'))+'</span>'+
         '<select id="v39AdProduct" class="form-input" style="margin-top:.3rem">'+
           products.map(p=>'<option value="'+v39Esc(p.id)+'">'+v39Esc(p.name)+(p.brand?' — '+v39Esc(p.brand):'')+'</option>').join('')+
         '</select></label>'+
       '</div>'+
       '<div id="v39AdPackageInfo" class="velora-seller39-muted" style="margin-top:.65rem"></div>'+
       (legalReady?'<label style="display:flex;gap:.6rem;align-items:flex-start;margin-top:.75rem;cursor:pointer"><input id="v39AdLegalConsent" type="checkbox" style="margin-top:.25rem"><span>'+v39Esc(v39t('I agree to the published seller agreement and acceptable-use rules for seller advertising.'))+'</span></label>':
         '<div style="margin-top:.75rem;padding:.65rem .75rem;border-radius:10px;background:rgba(244,67,54,.08)">'+v39Esc(v39t('Advertising checkout is blocked until the required seller legal documents are published.'))+'</div>')+
       '<button class="velora-seller39-btn primary" id="v39AdBuy" style="margin-top:.7rem" '+((supported&&legalReady&&products.length&&packages.length)?'':'disabled')+'>'+v39Esc(v39t('Pay & launch sponsored placement'))+'</button>'+
       '<div class="velora-seller39-muted" id="v39AdStatus" style="margin-top:.55rem"></div>'+
     '</div>'+
     '<div class="velora-seller39-card" style="margin-top:.7rem"><div style="font-weight:850">'+v39Esc(v39t('Advertising history'))+'</div>'+campaignHtml+'</div>'+
     (supported?'':'<div class="velora-seller39-card" style="margin-top:.7rem"><strong>'+v39Esc(v39t('Advertising payment is currently available for Egypt only.'))+'</strong><div class="velora-seller39-muted" style="margin-top:.35rem">'+v39Esc(v39t('The current Paymob checkout adapter is limited to the approved Egypt store region.'))+'</div></div>');
   const packageEl=v39El('v39AdPackage'),productEl=v39El('v39AdProduct'),infoEl=v39El('v39AdPackageInfo'),button=v39El('v39AdBuy'),statusEl=v39El('v39AdStatus');
   const refresh=()=>{const p=packages.find(x=>String(x.id)===String(packageEl?.value));if(infoEl&&p)infoEl.textContent=v39t('Placement')+': '+p.placement+' · '+money(p.price)+' '+(p.currency_code||'EGP')+' · '+p.duration_days+' '+v39t('days');};
   packageEl?.addEventListener('change',refresh); refresh();
   button?.addEventListener('click',async()=>{
     if(!packageEl||!productEl)return;
     button.disabled=true;
     if(statusEl)statusEl.textContent=v39t('Starting secure advertising checkout…');
     try{
       if(!supported)throw new Error('AD_PAYMOB_EGYPT_ONLY');
       if(!legalReady)throw new Error('LEGAL_DOCUMENTS_NOT_PUBLISHED');
       if(!v39El('v39AdLegalConsent')?.checked)throw new Error('LEGAL_ACCEPTANCE_REQUIRED');
       for(const d of legalDocs){
         const accepted=await (window.supabaseClient||window.sb).rpc('velora_accept_legal_document',{
           p_document_id:d.id,p_acceptance_method:'explicit_checkbox',
           p_context:{surface:'seller_advertising',ad_package_id:packageEl.value,product_id:productEl.value}
         });
         if(accepted.error)throw accepted.error;
       }
       const key='VELORA-AD-'+packageEl.value+'-'+productEl.value+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
       const fn=(window.mahaSupabase||window.supabaseClient||window.sb)?.functions;
       if(!fn?.invoke)throw new Error('Payment session service unavailable');
       const result=await fn.invoke('velora-seller-ad-paymob-checkout-restore-test',{
         body:{ad_package_id:packageEl.value,product_id:productEl.value,country_code:String(d.country_code||'EG').toUpperCase(),idempotency_key:key,return_url:window.location.href}
       });
       if(result.error)throw result.error;
       const data=result.data||{};
       if(data.checkout_url){window.location.assign(data.checkout_url);return;}
       throw new Error(data.code||data.error||'SELLER_AD_CHECKOUT_UNAVAILABLE');
     }catch(err){
       if(statusEl)statusEl.textContent=v39t('Advertising checkout unavailable')+': '+(err.message||err);
       button.disabled=false;
     }
   });
 }catch(err){
   host.innerHTML='<div class="velora-seller39-card"><strong>'+v39Esc(v39t('Seller advertising unavailable'))+'</strong><div class="velora-seller39-muted" style="margin-top:.35rem">'+v39Esc(err.message||err)+'</div></div>';
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
 <div id="veloraSellerAnalytics39" style="margin-top:12px"></div>
 <div id="veloraSellerAds39" style="margin-top:12px"></div>
 <div id="veloraSellerSubscription39" style="margin-top:12px"></div>
 <div id="veloraSellerPayout39" style="margin-top:12px"></div>
 <div class="velora-seller39-card" style="margin-top:12px"><div class="velora-seller39-muted">Estimated seller earnings</div><div class="velora-seller39-kpi">${Number(d.estimated_earnings||0).toLocaleString()}</div><div class="velora-seller39-muted" style="margin-top:6px">Operational estimate from canonical order items; not a payout settlement.</div>
 <div class="velora-seller39-actions"><button class="velora-seller39-btn primary" id="v39Snapshot">Capture operations snapshot</button><button class="velora-seller39-btn" id="v39Refresh">Refresh</button></div></div>
 </div>`;
 v39El('v39Snapshot')?.addEventListener('click',async()=>{const x=await v39Rpc('velora_capture_seller_ops_snapshot'); if(x.error) alert(x.error.message||'Snapshot failed'); else {alert('Operations snapshot captured');v39Load()}});
 v39El('v39Refresh')?.addEventListener('click',()=>{v39Load();v39LoadAnalytics();v39LoadSubscription()});
 v39LoadAnalytics();
 v39LoadAds();
 v39LoadSubscription();
 v39LoadPayouts();
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
