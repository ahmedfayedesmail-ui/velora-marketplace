(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(v,c)=>Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+' '+(c||'EGP');
async function load(placement,targetId,title,subtitle){
  const target=document.getElementById(targetId); if(!target)return;
  if(target.previousElementSibling?.dataset?.veloraSponsoredSection===placement)return;
  const client=window.supabaseClient||window.sb; if(!client?.rpc)return;
  const r=await client.rpc('velora_get_active_seller_ads',{p_placement:placement,p_category:null,p_limit:8});
  if(r.error||!Array.isArray(r.data)||!r.data.length)return;
  const section=document.createElement('section');
  section.dataset.veloraSponsoredSection=placement;
  section.className='container';
  section.style.marginBottom='2rem';
  section.innerHTML='<div class="section-header"><span class="section-label">SPONSORED</span><h2 class="section-title">'+esc(title)+'</h2><div class="velora-seller39-muted">'+esc(subtitle)+'</div></div><div class="products-grid">'+
    r.data.map(p=>'<div class="product-card" data-id="'+esc(p.product_id)+'" data-product-id="'+esc(p.product_id)+'" data-sponsored="true">'+
      '<div class="product-image" onclick="openProductDetail(\''+esc(p.product_id)+'\')"><span>'+esc(p.emoji||'✨')+'</span><div class="product-badges"><span class="product-badge badge-hot">Sponsored</span></div></div>'+
      '<div class="product-info"><div class="product-category">'+esc(p.category||'Beauty')+'</div><div class="product-name" onclick="openProductDetail(\''+esc(p.product_id)+'\')">'+esc(p.product_name||'Product')+'</div><div class="product-brand">'+esc(p.brand||'')+'</div><div class="product-footer"><div class="product-price"><span class="price-current">'+esc(money(p.price,p.currency_code))+'</span></div><button class="add-cart-btn" onclick="event.stopPropagation(); addToCart(\''+esc(p.product_id)+'\')">🛒</button></div></div>'+
    '</div>').join('')+'</div>';
  target.parentNode.insertBefore(section,target);
}
async function refresh(){
  await Promise.all([
    load('home_spotlight','featuredProducts','Sponsored beauty spotlight','Paid seller placements are shown only after verified payment capture.'),
    load('shop_sponsored','shopProducts','Sponsored products','Paid seller placements are shown only while their campaign is active.')
  ]);
}
function install(){
  refresh();
  const nav=window.navigateTo;
  if(typeof nav==='function'&&!nav.__veloraAdsWrapped){
    function wrapped(page){const out=nav.apply(this,arguments);setTimeout(refresh,80);return out;}
    wrapped.__veloraAdsWrapped=true;
    window.navigateTo=wrapped;
  }
}
setTimeout(install,1200);
})();