/* ============================================================
   VELORA STAGE 9 — PAYMENTS + WEBHOOKS + REFUNDS
   Real orchestration layer; never claims provider settlement without
   provider credentials and verified webhooks.
   ============================================================ */
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>escapeHtml(String(v??''));
const tr=v=>typeof window.VELORA_GET_TRANSLATION==='function'?window.VELORA_GET_TRANSLATION(String(v)):String(v);
const money=(n,c)=>{try{return new Intl.NumberFormat(undefined,{style:'currency',currency:c||'USD'}).format(Number(n||0))}catch(_){return `${Number(n||0).toFixed(2)} ${c||''}`}};
const cls=s=>String(s||'').toLowerCase().replace(/[^a-z0-9_-]/g,'');
async function user(){const {data,error}=await db.auth.getUser();if(error)throw error;if(!data?.user)throw new Error('Please login first');return data.user}
async function paymentMethods(){const country=String(document.getElementById('veloraCountryCode')?.value||window.VELORA_MARKET_CONTEXT?.countryCode||'EG').toUpperCase();const currency=String(document.getElementById('currencySelect')?.value||window.VELORA_MARKET_CONTEXT?.currencyCode||'EGP').toUpperCase();const {data,error}=await db.rpc('velora_get_operational_payment_methods',{p_country_code:country,p_currency_code:currency});if(error)throw error;return data||[]}
async function providers(){const {data,error}=await db.from('payment_providers').select('id,code,name,provider_type,priority,is_active,environment,webhook_enabled,config_version').order('priority');if(error)throw error;return data||[]}
async function attempts(limit=100){const {data,error}=await db.from('payment_attempts').select('id,order_id,user_id,provider_id,method_id,amount,currency_code,status,payment_reference,provider_session_id,failure_code,failure_reason,created_at,completed_at').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return data||[]}
async function webhooks(limit=100){const {data,error}=await db.from('provider_webhook_events').select('id,provider_code,event_id,event_type,signature_verified,status,received_at,processed_at,retry_count,failure_reason').order('received_at',{ascending:false}).limit(limit);if(error)throw error;return data||[]}
async function currentOrders(){const {data,error}=await db.from('orders').select('id,order_number,total,currency,payment_status,status,customer_name,created_at').order('created_at',{ascending:false}).limit(100);if(error)throw error;return data||[]}
function adminNav(){const nav=document.querySelector('#adminPlatform .admin-nav, #adminPlatform .admin-sidebar nav, #adminPlatform .admin-menu');if(!nav)return; if(nav.querySelector('[data-velora-payment-nav]'))return; const item=document.createElement('div');item.className='admin-nav-item';item.dataset.veloraPaymentNav='1';item.innerHTML='<span>💳</span><span>Payments</span>';item.onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('payments');nav.appendChild(item)}
async function renderPayments(){const c=document.getElementById('adminContent');if(!c)return;c.innerHTML='<div class="velora-pay-note">⏳ Loading payment control plane…</div>';try{
 const [ps,ms,ats,wh,os]=await Promise.all([providers(),paymentMethods(),attempts(),webhooks(),currentOrders()]);
 const paid=os.filter(o=>o.payment_status==='paid').length, failed=ats.filter(a=>a.status==='failed').length, pending=ats.filter(a=>a.status==='pending').length, verified=wh.filter(w=>w.signature_verified).length;
 c.innerHTML=`<div class="velora-pay-note"><b>Stage 9 — Payment Control Plane.</b> Provider credentials and signature verification remain external prerequisites. Velora records payment attempts idempotently and never marks a provider payment as successful from the browser.</div>
 <div class="velora-pay-grid"><div class="velora-pay-card"><div class="kpi-value">${ps.filter(p=>p.is_active).length}</div><div class="kpi-label">Active Providers</div></div><div class="velora-pay-card"><div class="kpi-value">${ms.length}</div><div class="kpi-label">Enabled Methods</div></div><div class="velora-pay-card"><div class="kpi-value">${pending}</div><div class="kpi-label">Pending Attempts</div></div><div class="velora-pay-card"><div class="kpi-value">${failed}</div><div class="kpi-label">Failed Attempts</div></div><div class="velora-pay-card"><div class="kpi-value">${verified}</div><div class="kpi-label">Verified Webhooks</div></div><div class="velora-pay-card"><div class="kpi-value">${paid}</div><div class="kpi-label">Paid Orders</div></div></div>
 <div class="admin-section-card"><h3>🏦 Providers</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Provider</th><th>Environment</th><th>Webhook</th><th>Status</th><th>Config</th></tr></thead><tbody>${ps.map(p=>`<tr><td><strong>${esc(p.name)}</strong><div class="velora-op-muted">${esc(p.code)}</div></td><td>${esc(p.environment||'sandbox')}</td><td>${p.webhook_enabled?'✅ enabled':'⚠️ disabled'}</td><td><span class="velora-pay-badge ${p.is_active?'ready':'off'}">${p.is_active?'active':'inactive'}</span></td><td>${esc(p.config_version||'—')}</td></tr>`).join('')||'<tr><td colspan="5">No providers configured.</td></tr>'}</tbody></table></div></div>
 <div class="admin-section-card"><h3>🧪 Recent Payment Attempts</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Created</th><th>Order</th><th>Amount</th><th>Status</th><th>Provider Ref</th><th>Error</th></tr></thead><tbody>${ats.map(a=>`<tr><td>${new Date(a.created_at).toLocaleString()}</td><td><code>${esc(a.order_id)}</code></td><td>${money(a.amount,a.currency_code)}</td><td><span class="velora-op-status ${cls(a.status)}">${esc(a.status)}</span></td><td>${esc(a.payment_reference||a.provider_session_id||'—')}</td><td>${esc(a.failure_reason||a.failure_code||'')}</td></tr>`).join('')||'<tr><td colspan="6">No payment attempts.</td></tr>'}</tbody></table></div></div>
 <div class="admin-section-card"><h3>🔔 Provider Webhooks</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Received</th><th>Provider</th><th>Event</th><th>Signature</th><th>Status</th><th>Retries</th></tr></thead><tbody>${wh.map(w=>`<tr><td>${new Date(w.received_at).toLocaleString()}</td><td>${esc(w.provider_code||'')}</td><td>${esc(w.event_type||w.event_id)}</td><td><span class="velora-pay-badge ${w.signature_verified?'ready':'pending'}">${w.signature_verified?'verified':'unverified'}</span></td><td>${esc(w.status||'received')}</td><td>${Number(w.retry_count||0)}</td></tr>`).join('')||'<tr><td colspan="6">No webhook events.</td></tr>'}</tbody></table></div></div>`;
 }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ ${esc(e.message||e)}</div>`}}
async function startPayment(orderId,methodId,country){const currency=String(document.getElementById('currencySelect')?.value||window.VELORA_MARKET_CONTEXT?.currencyCode||'EGP').toUpperCase();const {data:ops,error:opError}=await db.rpc('velora_get_operational_payment_methods',{p_country_code:String(country||'EG').toUpperCase(),p_currency_code:currency});if(opError)throw opError;if(!Array.isArray(ops)||!ops.some(m=>m.id===methodId))throw new Error('PAYMENT_METHOD_NOT_OPERATIONAL');const idempotency=`VELORA-PAY-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;const sess=db.functions?.invoke?db.functions.invoke.bind(db.functions):null;if(!sess)throw new Error('Payment session service unavailable');const eg=String(country||'').toUpperCase()==='EG';const currency=String(document.getElementById('currencySelect')?.value||window.VELORA_MARKET_CONTEXT?.currencyCode||'USD').toUpperCase();const functionName=eg&&currency==='EGP'?'velora-paymob-checkout':'velora-payment-session';const body={order_id:orderId,payment_method_id:methodId||null,country_code:String(country||'EG').toUpperCase(),idempotency_key:idempotency};if(functionName==='velora-paymob-checkout')body.return_url=window.location.href;const {data,error}=await sess(functionName,{body});if(error)throw error;return data}
window.VELORA_START_PAYMENT=startPayment;window.VELORA_RENDER_PAYMENTS=renderPayments;
const prev=window.VELORA_CANONICAL_ADMIN_SECTION;
window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='payments')return renderPayments();return prev?prev(section,btn):undefined};
const oldOpen=window.VELORA_OPEN_ADMIN;
window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(adminNav,100);return r};
if(window.VELORA_CANONICAL_ADMIN_SECTION)setTimeout(adminNav,250);
/* Upgrade checkout payment choices when the canonical checkout renders. */
const decorate=async()=>{const box=document.querySelector('.payment-methods');try{if(box&&!box.dataset.veloraStage9){box.dataset.veloraStage9='1';const ms=await paymentMethods();box.innerHTML=ms.map(m=>`<div class="payment-method" data-payment-code="${esc(m.code)}" data-payment-id="${esc(m.id)}" onclick="window.VELORA_SELECT_PAYMENT_METHOD('${esc(m.code)}','${esc(m.id)}',this)"><div class="payment-radio"></div><div class="payment-icon">💳</div><div class="payment-info"><div class="payment-name">${esc(m.name)}</div><div class="payment-desc">${esc(m.method_type||'Provider routed')}</div></div></div>`).join('')||box.innerHTML;}}catch(e){console.warn('Stage9 payment methods',e)}decorateGiftCard();};
let giftCardObserverStarted=false;
async function applyGiftCardCode(){
  const input=document.getElementById('veloraGiftCardInput');
  const status=document.getElementById('veloraGiftCardStatus');
  const code=String(input?.value||'').trim().toUpperCase();
  const client=db;
  if(!code){if(status)status.textContent=tr('Please enter a gift card code.');return;}
  try{
    const currency=String(document.getElementById('currencySelect')?.value||window.VELORA_MARKET_CONTEXT?.currencyCode||'EGP').toUpperCase();
    const base=Math.max(0,Number(typeof getCartTotal==='function'?getCartTotal():0)-Number(typeof calculateDiscount==='function'?calculateDiscount():0));
    const result=await client.rpc('velora_quote_gift_card',{p_code:code,p_currency:currency,p_order_amount:base});
    if(result.error)throw result.error;
    const q=result.data;
    if(!q?.ok)throw new Error('GIFT_CARD_NOT_AVAILABLE');
    window.VELORA_GIFT_CARD_CODE=q.code;
    window.VELORA_GIFT_CARD_QUOTE={...q,base_amount:base};
    if(status)status.textContent=tr('Gift card applied:')+' '+Number(q.apply_amount||0).toFixed(2)+' '+q.currency_code+' · '+tr('Remaining:')+' '+Number(q.remaining_order_amount||0).toFixed(2)+' '+q.currency_code;
    if(typeof renderCheckoutSummary==='function')renderCheckoutSummary();
    setTimeout(decorateGiftCard,0);
  }catch(e){
    window.VELORA_GIFT_CARD_CODE=null;
    window.VELORA_GIFT_CARD_QUOTE=null;
    if(status)status.textContent=(e?.message||tr('Gift card could not be applied.'));
  }
}
function removeGiftCardCode(){
  window.VELORA_GIFT_CARD_CODE=null;
  window.VELORA_GIFT_CARD_QUOTE=null;
  const input=document.getElementById('veloraGiftCardInput');if(input)input.value='';
  const status=document.getElementById('veloraGiftCardStatus');if(status)status.textContent=tr('Gift card removed.');
  if(typeof renderCheckoutSummary==='function')renderCheckoutSummary();
  setTimeout(decorateGiftCard,0);
}
let legalConsentObserverStarted=false;
async function ensureCheckoutLegalAcceptance(){
  const client=db;
  const locale=String(window.VELORA_GLOBAL_LOCALE||localStorage.getItem('velora_language')||'en').toLowerCase();
  const docsR=await client.rpc('velora_get_required_legal_documents',{p_locale:locale,p_audience:'customer'});
  if(docsR.error)throw docsR.error;
  const docs=Array.isArray(docsR.data)?docsR.data:[];
  const required=docs.filter(d=>['terms_of_service','privacy_policy'].includes(d.document_type));
  const requiredTypes=new Set(['terms_of_service','privacy_policy']);
  if(!required.length || !requiredTypes.isSubsetOf(new Set(required.map(d=>d.document_type)))) throw new Error('LEGAL_DOCUMENTS_NOT_PUBLISHED');
  const box=document.getElementById('veloraLegalConsent');
  if(!box?.checked)throw new Error('LEGAL_ACCEPTANCE_REQUIRED');

  const context={
    surface:'checkout',
    checkout_reference:'pre-order',
    has_coupon:Boolean(window.VELORA_ACTIVE_COUPON_CODE),
    has_gift_card:Boolean(window.VELORA_GIFT_CARD_CODE)
  };
  let accepted=0;
  for(const d of required){
    const x=await client.rpc('velora_accept_legal_document',{
      p_document_id:d.id,
      p_acceptance_method:'checkout',
      p_context:context
    });
    if(x.error)throw x.error;
    accepted++;
  }
  const relevantTypes=[];
  if(window.VELORA_ACTIVE_COUPON_CODE)relevantTypes.push('promotion_terms');
  if(window.VELORA_GIFT_CARD_CODE)relevantTypes.push('gift_card_terms');
  for(const d of docs.filter(x=>relevantTypes.includes(x.document_type))){
    const x=await client.rpc('velora_accept_legal_document',{
      p_document_id:d.id,
      p_acceptance_method:'checkout',
      p_context:{...context,document_type:d.document_type}
    });
    if(x.error)throw x.error;
    accepted++;
  }
  return {accepted,required:required.length};
}
function decorateLegalConsent(){
  const host=document.getElementById('checkoutSummary');
  if(!host||document.getElementById('veloraLegalConsentWrap'))return;
  const docsHint=document.createElement('div');
  docsHint.id='veloraLegalConsentWrap';
  docsHint.className='velora-op-note';
  docsHint.style.marginTop='1rem';
  docsHint.innerHTML='<label style="display:flex;gap:.6rem;align-items:flex-start;cursor:pointer"><input id="veloraLegalConsent" type="checkbox" style="margin-top:.25rem"><span data-velora-i18n="I agree to the published Terms of Service and Privacy Policy, and any applicable promotion or gift card terms.">I agree to the published Terms of Service and Privacy Policy, and any applicable promotion or gift card terms.</span></label><div style="margin-top:.4rem;font-size:.78rem"><a href="#" onclick="openLegalDocument(\'terms_of_service\');return false" data-velora-i18n="Terms of Service">Terms of Service</a> · <a href="#" onclick="openLegalDocument(\'privacy_policy\');return false" data-velora-i18n="Privacy Policy">Privacy Policy</a></div>';
  host.appendChild(docsHint);
  if(!legalConsentObserverStarted&&typeof MutationObserver==='function'){
    legalConsentObserverStarted=true;
    const observer=new MutationObserver(()=>{if(document.getElementById('checkoutSummary')&&!document.getElementById('veloraLegalConsentWrap'))decorateLegalConsent();});
    observer.observe(host,{childList:true});
  }
  if(typeof window.VELORA_TRANSLATE_ALL==='function')window.VELORA_TRANSLATE_ALL();
}

function decorateGiftCard(){
  const host=document.getElementById('checkoutSummary');
  if(!host||document.getElementById('veloraGiftCardBox'))return;
  const box=document.createElement('div');
  box.id='veloraGiftCardBox';
  box.className='coupon-box';
  box.style.marginTop='1rem';
  box.innerHTML='<div style="font-weight:700;margin-bottom:.4rem">🎁 '+esc(tr('Gift card'))+'</div><div style="display:flex;gap:.5rem;flex-wrap:wrap"><input id="veloraGiftCardInput" class="coupon-input" placeholder="'+esc(tr('Gift card code'))+'" type="text"><button id="veloraGiftCardApply" class="coupon-btn" type="button">'+esc(tr('Apply'))+'</button><button id="veloraGiftCardRemove" class="coupon-btn" type="button" style="display:none">'+esc(tr('Remove'))+'</button></div><div id="veloraGiftCardStatus" class="velora-op-muted" style="margin-top:.4rem"></div>';
  host.appendChild(box);
  const input=document.getElementById('veloraGiftCardInput'),apply=document.getElementById('veloraGiftCardApply'),remove=document.getElementById('veloraGiftCardRemove'),status=document.getElementById('veloraGiftCardStatus');
  if(window.VELORA_GIFT_CARD_CODE){if(input)input.value=window.VELORA_GIFT_CARD_CODE;if(apply)apply.style.display='none';if(remove)remove.style.display='inline-flex';if(status&&window.VELORA_GIFT_CARD_QUOTE)status.textContent=tr('Gift card applied:')+' '+Number(window.VELORA_GIFT_CARD_QUOTE.apply_amount||0).toFixed(2)+' '+window.VELORA_GIFT_CARD_QUOTE.currency_code+' · '+tr('Remaining:')+' '+Number(window.VELORA_GIFT_CARD_QUOTE.remaining_order_amount||0).toFixed(2)+' '+window.VELORA_GIFT_CARD_QUOTE.currency_code;}
  apply?.addEventListener('click',async()=>{await applyGiftCardCode();setTimeout(decorateGiftCard,0);});
  input?.addEventListener('keypress',async e=>{if(e.key==='Enter'){e.preventDefault();await applyGiftCardCode();setTimeout(decorateGiftCard,0);}});
  remove?.addEventListener('click',removeGiftCardCode);
  if(!giftCardObserverStarted&&typeof MutationObserver==='function'){
    giftCardObserverStarted=true;
    const observer=new MutationObserver(()=>{if(document.getElementById('checkoutSummary')&&!document.getElementById('veloraGiftCardBox'))decorateGiftCard();});
    const summary=document.getElementById('checkoutSummary');if(summary)observer.observe(summary,{childList:true});
  }
}
let veloraShippingQuotePromise=null;
async function refreshVeloraShippingQuote(){
  const original=window.STATE?.cart||[];
  const items=original.map(i=>({product_id:i.canonicalId||i.productId||i.id,quantity:Number(i.quantity||1)})).filter(i=>/^[0-9a-f-]{36}$/i.test(String(i.product_id))&&i.quantity>0);
  if(!items.length){window.VELORA_SHIPPING_QUOTE=null;return null}
  const country=String(document.getElementById('veloraCountryCode')?.value||window.VELORA_MARKET_CONTEXT?.countryCode||'EG').toUpperCase();
  const currency=String(document.getElementById('currencySelect')?.value||window.VELORA_MARKET_CONTEXT?.currencyCode||'EGP').toUpperCase();
  if(veloraShippingQuotePromise)return veloraShippingQuotePromise;
  veloraShippingQuotePromise=db.rpc('velora_quote_cart_shipping',{p_items:items,p_country_code:country,p_currency_code:currency})
    .then(({data,error})=>{if(error)throw error;window.VELORA_SHIPPING_QUOTE=data||null;return window.VELORA_SHIPPING_QUOTE})
    .finally(()=>{veloraShippingQuotePromise=null});
  return veloraShippingQuotePromise;
}
function shippingQuoteStatus(q){
  if(!q)return '';
  if(q.ok)return tr('Shipping quote ready.')+' '+Number(q.total_shipping||0).toFixed(2)+' '+String(q.currency_code||'');
  return tr('Shipping configuration required for one or more sellers.');
}
window.VELORA_SELECT_PAYMENT_METHOD=(code,id,el)=>{window.VELORA_PAYMENT_SELECTION={code,id};document.querySelectorAll('.payment-method').forEach(x=>x.classList.remove('selected'));el.classList.add('selected')};
const oldRender=window.renderCheckoutPage;if(typeof oldRender==='function')window.renderCheckoutPage=function(){const r=oldRender.apply(this,arguments);setTimeout(async()=>{decorate();decorateGiftCard();decorateLegalConsent();try{const q=await refreshVeloraShippingQuote();if(typeof renderCheckoutSummary==='function')renderCheckoutSummary();const s=document.getElementById('veloraShippingQuoteStatus');if(s)s.textContent=shippingQuoteStatus(q)}catch(e){const s=document.getElementById('veloraShippingQuoteStatus');if(s)s.textContent=tr('Shipping quote unavailable.') }},100);return r};
function decorateShippingStatus(){
  const host=document.getElementById('checkoutSummary');
  if(!host||document.getElementById('veloraShippingQuoteStatus'))return;
  const box=document.createElement('div');
  box.id='veloraShippingQuoteStatus';
  box.className='velora-op-note';
  box.style.marginTop='1rem';
  box.textContent=shippingQuoteStatus(window.VELORA_SHIPPING_QUOTE)||tr('Shipping quote will be calculated from configured seller rates.');
  host.appendChild(box);
  if(typeof window.VELORA_TRANSLATE_ALL==='function')window.VELORA_TRANSLATE_ALL();
}
const oldRenderSummary=window.renderCheckoutSummary;if(typeof oldRenderSummary==='function')window.renderCheckoutSummary=function(){const r=oldRenderSummary.apply(this,arguments);setTimeout(()=>{decorateGiftCard();decorateLegalConsent();decorateShippingStatus()},80);return r};
/* Canonical placeOrder wrapper: create order first, then create provider attempt for non-COD methods. */
const oldPlace=window.placeOrder;window.placeOrder=async function(event){const selected=window.VELORA_PAYMENT_SELECTION;const fullGiftCard=Boolean(window.VELORA_GIFT_CARD_QUOTE&&Number(window.VELORA_GIFT_CARD_QUOTE.remaining_order_amount||0)<=0&&window.VELORA_GIFT_CARD_CODE);if(!selected?.id&&!fullGiftCard)return oldPlace?oldPlace(event):undefined;event.preventDefault();try{const original=window.STATE?.cart||[];const canonical=original.map(i=>({product_id:i.canonicalId||i.productId||i.id,quantity:Number(i.quantity||1)})).filter(i=>/^[0-9a-f-]{36}$/i.test(String(i.product_id)));const country=document.getElementById('veloraCountryCode')?.value||window.VELORA_MARKET_CONTEXT?.countryCode||'EG';const currency=document.getElementById('currencySelect')?.value||window.VELORA_MARKET_CONTEXT?.currencyCode||'USD';const name=document.getElementById('custName')?.value?.trim()||'',phone=document.getElementById('custPhone')?.value?.trim()||'',email=document.getElementById('custEmail')?.value?.trim()||'',city=document.getElementById('custCity')?.value?.trim()||'',address=document.getElementById('custAddress')?.value?.trim()||'',notes=document.getElementById('custNotes')?.value?.trim()||'';if(!name||!phone||!city||!address){showToast('⚠️ Please complete your shipping information','warning');return}const selectedLegal=await ensureCheckoutLegalAcceptance();if(selectedLegal.required===0){}const shippingQuote=await refreshVeloraShippingQuote();if(!shippingQuote?.ok)throw new Error('SHIPPING_CONFIGURATION_REQUIRED');const shippingAmount=Math.max(0,Number(shippingQuote.total_shipping||0));const couponCode=String(window.VELORA_ACTIVE_COUPON_CODE||'').trim().toUpperCase()||null;const giftCardCode=String(window.VELORA_GIFT_CARD_CODE||'').trim().toUpperCase()||null;const {data,error}=await db.rpc('velora_create_order_with_commercials',{p_items:canonical,p_currency:currency,p_shipping:shippingAmount,p_customer_name:name,p_customer_phone:phone,p_customer_email:email,p_customer_city:city,p_customer_address:address,p_customer_notes:JSON.stringify({notes,country_code:country,payment_method:selected?.code||'gift_card'}),p_checkout_reference:'VELORA-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),p_coupon_code:couponCode,p_gift_card_code:giftCardCode});if(error)throw error;if(!data?.ok)throw new Error('Order creation failed');if(Number(data.total||0)<=0&&String(data.payment_status||'').toLowerCase()==='paid'){STATE.cart=[];saveToStorage(KEYS.CART,STATE.cart);updateCartBadge();window.VELORA_GIFT_CARD_CODE=null;window.VELORA_GIFT_CARD_QUOTE=null;showToast(`✅ Order #${data.order_number} created — paid by gift card`,'success');setTimeout(()=>navigateTo('orders'),900);return}if(!selected?.id)throw new Error('PAYMENT_METHOD_REQUIRED');const attempt=await startPayment(data.order_id,selected.id,country);if(attempt?.checkout_url){window.location.assign(attempt.checkout_url);return}STATE.cart=[];saveToStorage(KEYS.CART,STATE.cart);updateCartBadge();showToast(`✅ Order #${data.order_number} created — payment started`,'success');setTimeout(()=>navigateTo('orders'),900)}catch(e){console.error(e);showToast('❌ '+(e.message||'Payment could not be started'),'error')}};
})();
