(()=>{
'use strict';
if(window.__VELORA_STAGE38_LOADED)return;window.__VELORA_STAGE38_LOADED=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
function products(){
  const src=window.MAHA_DATA?.PRODUCTS || (typeof getAllProducts==='function'?getAllProducts():[]);
  return Array.isArray(src)?src.filter(p=>p && isUuid(p.id)):[];
}
function currency(p){return p?.currency||p?.currency_code||window.VELORA_CURRENCY||'USD'}
function price(p){return Number(p?.price||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+' '+currency(p)}
function saveRecent(id){
  try{
    const key='velora_recently_viewed_v1';
    const arr=JSON.parse(localStorage.getItem(key)||'[]').filter(x=>x!==id);
    arr.unshift(id);localStorage.setItem(key,JSON.stringify(arr.slice(0,8)));
  }catch(_){ }
}
function getRecent(){try{return JSON.parse(localStorage.getItem('velora_recently_viewed_v1')||'[]')}catch(_){return[]}}
function pickRecommendations(limit=4){
  const all=products();
  if(!all.length)return[];
  const recent=new Set(getRecent());
  const preferred=all.filter(p=>!recent.has(p.id)).sort((a,b)=>{
    const ar=Number(a.rating||0),br=Number(b.rating||0);
    const ac=Number(a.review_count||a.reviewsCount||0),bc=Number(b.review_count||b.reviewsCount||0);
    const as=Number(a.stock||0)>0?1:0,bs=Number(b.stock||0)>0?1:0;
    return (br*2+Math.log1p(bc)+bs)-(ar*2+Math.log1p(ac)+as);
  });
  return preferred.slice(0,limit);
}
function cardMarkup(p){
  if(typeof renderProductCard==='function')return renderProductCard(p);
  return `<article class="product-card"><div class="product-info"><h3>${esc(p.name)}</h3><div>${price(p)}</div><button class="btn btn-primary" onclick="openProductDetail('${esc(p.id)}')">View product</button></div></article>`;
}
function section(id,title,subtitle,items){
  const old=document.getElementById(id);if(old)old.remove();
  const host=document.querySelector('#page-home .container:last-of-type');
  if(!host)return;
  const el=document.createElement('section');el.id=id;el.className='velora-cx-wrap';
  el.innerHTML=`<div class="velora-cx-section"><div class="velora-cx-row"><div><div class="velora-cx-kicker">VELORA DISCOVERY</div><h2 style="margin:.25rem 0 0">${esc(title)}</h2><div class="velora-cx-muted">${esc(subtitle)}</div></div><button class="btn" onclick="navigateTo('shop')">Explore all →</button></div><div class="velora-cx-products">${items.map(cardMarkup).join('')}</div></div>`;
  host.insertAdjacentElement('afterend',el);
}
function injectTrust(){
  const modal=document.getElementById('productModal');if(!modal)return;
  if(modal.querySelector('[data-velora-cx-trust]'))return;
  const target=modal.querySelector('.modal-body')||modal;
  if(!target)return;
  const box=document.createElement('div');box.setAttribute('data-velora-cx-trust','1');box.className='velora-cx-seller-panel';
  box.innerHTML=`<strong>🛡️ Velora Marketplace Protection</strong><div class="velora-cx-trust"><span class="velora-cx-chip">Secure checkout</span><span class="velora-cx-chip">Order tracking</span><span class="velora-cx-chip">Delivery proof</span><span class="velora-cx-chip">Returns & disputes</span></div><div class="velora-cx-muted" style="margin-top:8px">Seller and order data remain governed by Velora access controls. Delivery proof and dispute workflows are available where enabled for the order.</div>`;
  target.appendChild(box);
}
function renderHomeExperience(){
  const all=products();
  if(!all.length)return;
  const rec=pickRecommendations(4);
  if(rec.length)section('veloraCxRecommended','Recommended for you','Quality-first discovery using Velora catalog signals. Personalized recommendations are only used when the relevant consent allows them.',rec);
  const viewed=getRecent().map(id=>all.find(p=>p.id===id)).filter(Boolean).slice(0,4);
  if(viewed.length)section('veloraCxRecent','Continue exploring','Pick up where you left off with products you viewed recently.',viewed);
  const trust=document.getElementById('veloraCxTrustBanner');
  if(!trust){
    const anchor=document.querySelector('#page-home .hero');
    if(anchor){
      const b=document.createElement('div');b.id='veloraCxTrustBanner';b.className='velora-cx-wrap';b.innerHTML=`<div class="velora-cx-grid"><div class="velora-cx-card"><strong>🔐 Protected checkout</strong><div class="velora-cx-muted">Payment attempts and order creation use governed backend flows.</div></div><div class="velora-cx-card"><strong>🏪 Multi-seller</strong><div class="velora-cx-muted">Shop multiple stores from one marketplace experience.</div></div><div class="velora-cx-card"><strong>📦 Track your order</strong><div class="velora-cx-muted">Shipping status and delivery evidence can follow the order lifecycle.</div></div><div class="velora-cx-card"><strong>🛡️ Trust & Safety</strong><div class="velora-cx-muted">Returns, disputes, fraud controls, and account enforcement are governed.</div></div></div>`;
      anchor.insertAdjacentElement('afterend',b);
    }
  }
}
const originalOpen=window.openProductDetail;
window.openProductDetail=async function(productId){
  if(isUuid(productId))saveRecent(productId);
  const r=typeof originalOpen==='function'?await originalOpen.apply(this,arguments):undefined;
  setTimeout(injectTrust,80);
  return r;
};
const originalLoad=window.loadPageContent;
window.loadPageContent=function(page){
  const r=typeof originalLoad==='function'?originalLoad.apply(this,arguments):undefined;
  if(page==='home')setTimeout(renderHomeExperience,220);
  if(page==='shop')setTimeout(()=>{const host=document.querySelector('#page-shop .container');if(host&&!host.querySelector('[data-velora-cx-shop-note]')){const n=document.createElement('div');n.setAttribute('data-velora-cx-shop-note','1');n.className='velora-cx-muted';n.style.margin='0 0 12px';n.textContent='Search results are ranked with catalog quality, relevance, stock, rating and marketplace fairness signals.';host.prepend(n)}},260);
  return r;
};
setTimeout(renderHomeExperience,1400);
console.log('✅ Velora Stage 38 Customer Marketplace Experience loaded');
})();
