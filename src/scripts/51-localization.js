/* ================================================================
   VELORA I18N V5 — GLOBAL UI TRANSLATION RUNTIME + LOCALIZATION CENTER
   ================================================================ */
(()=>{
'use strict';
const getDb=()=>window.mahaSupabase||window.supabaseClient||window.sb||null;
const state=window.VELORA_GLOBAL_LOCALE_STATE=window.VELORA_GLOBAL_LOCALE_STATE||{locale:localStorage.getItem('velora_language')||'en'};
const meta=()=>window.VELORA_CORE?.languages||{};
const basePack=()=>window.__VELORA_PACK||{};
const __VELORA_CORE_OVERRIDES = {
  en:{'Discover More.':'Discover More.','Shop Better.':'Shop Better.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.','MULTI-SELLER MARKETPLACE':'MULTI-SELLER MARKETPLACE','Start Shopping':'Start Shopping','Become a Seller':'Become a Seller'},
  ar:{'Discover More.':'اكتشف المزيد.','Shop Better.':'تسوق بشكل أفضل.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'كل ما تحتاجه، من متاجر يمكنك الوثوق بها. استكشف المنتجات واكتشف بائعين جدد وتسوق بذكاء — كل ذلك في سوق واحد.','MULTI-SELLER MARKETPLACE':'سوق متعدد البائعين','Start Shopping':'ابدأ التسوق','Become a Seller':'كن بائعًا'},
  es:{'Discover More.':'Descubre más.','Shop Better.':'Compra mejor.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'Todo lo que necesitas, de tiendas en las que puedes confiar. Explora productos, descubre nuevos vendedores y compra de forma más inteligente, todo en un mismo marketplace.','MULTI-SELLER MARKETPLACE':'MERCADO MULTIVENDEDOR','Start Shopping':'Empezar a comprar','Become a Seller':'Conviértete en vendedor'},
  fr:{'Discover More.':'Découvrez plus.','Shop Better.':'Achetez mieux.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'Tout ce dont vous avez besoin, auprès de boutiques de confiance. Explorez les produits, découvrez de nouveaux vendeurs et achetez plus intelligemment, le tout sur une seule marketplace.','MULTI-SELLER MARKETPLACE':'MARKETPLACE MULTI-VENDEURS','Start Shopping':'Commencer les achats','Become a Seller':'Devenir vendeur'},
  de:{'Discover More.':'Mehr entdecken.','Shop Better.':'Besser einkaufen.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'Alles, was Sie brauchen, von vertrauenswürdigen Shops. Entdecken Sie Produkte, neue Verkäufer und kaufen Sie intelligenter ein – alles auf einem Marktplatz.','MULTI-SELLER MARKETPLACE':'MULTI-VENDEUR-MARKTPLATZ','Start Shopping':'Jetzt einkaufen','Become a Seller':'Verkäufer werden'},
  it:{'Discover More.':'Scopri di più.','Shop Better.':'Acquista meglio.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'Tutto ciò di cui hai bisogno, da negozi di fiducia. Scopri prodotti, nuovi venditori e acquista in modo più intelligente, tutto in un unico marketplace.','MULTI-SELLER MARKETPLACE':'MARKETPLACE MULTI-VENDITORE','Start Shopping':'Inizia a fare acquisti','Become a Seller':'Diventa venditore'},
  pt:{'Discover More.':'Descubra mais.','Shop Better.':'Compre melhor.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'Tudo o que precisa, de lojas em que pode confiar. Explore produtos, descubra novos vendedores e compre de forma mais inteligente, tudo num só marketplace.','MULTI-SELLER MARKETPLACE':'MARKETPLACE MULTIVENDEDOR','Start Shopping':'Começar a comprar','Become a Seller':'Tornar-se vendedor'},
  tr:{'Discover More.':'Daha fazlasını keşfet.','Shop Better.':'Daha iyi alışveriş yap.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'İhtiyacınız olan her şey, güvenebileceğiniz mağazalardan. Ürünleri keşfedin, yeni satıcıları bulun ve daha akıllı alışveriş yapın — hepsi tek bir pazaryerinde.','MULTI-SELLER MARKETPLACE':'ÇOKLU SATICILI PAZARYERİ','Start Shopping':'Alışverişe başla','Become a Seller':'Satıcı ol'},
  zh:{'Discover More.':'发现更多。','Shop Better.':'更好地购物。','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'您需要的一切，来自值得信赖的商店。探索商品、发现新卖家并更聪明地购物——尽在一个市场。','MULTI-SELLER MARKETPLACE':'多卖家商城','Start Shopping':'开始购物','Become a Seller':'成为卖家'},
  ja:{'Discover More.':'もっと発見。','Shop Better.':'もっと上手に買い物。','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'信頼できるショップから必要なものをすべて。商品や新しい販売者を見つけ、もっと賢くショッピングできます。すべてひとつのマーケットプレイスで。','MULTI-SELLER MARKETPLACE':'マルチセラーマーケットプレイス','Start Shopping':'ショッピングを始める','Become a Seller':'販売者になる'},
  ko:{'Discover More.':'더 발견하세요.','Shop Better.':'더 현명하게 쇼핑하세요.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'신뢰할 수 있는 스토어에서 필요한 모든 것을 만나보세요. 상품과 새로운 판매자를 발견하고 더 스마트하게 쇼핑하세요 — 하나의 마켓플레이스에서.','MULTI-SELLER MARKETPLACE':'멀티 셀러 마켓플레이스','Start Shopping':'쇼핑 시작','Become a Seller':'판매자 되기'},
  hi:{'Discover More.':'और खोजें।','Shop Better.':'बेहतर खरीदारी करें।','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'आपको जो भी चाहिए, भरोसेमंद स्टोर्स से। उत्पाद खोजें, नए विक्रेताओं को जानें और बेहतर तरीके से खरीदारी करें — सब एक ही मार्केटप्लेस में।','MULTI-SELLER MARKETPLACE':'मल्टी-सेलर मार्केटप्लेस','Start Shopping':'खरीदारी शुरू करें','Become a Seller':'विक्रेता बनें'}
};
let dbCatalog={}; let translating=false;
const __VELORA_TEXT_SOURCES = new WeakMap();
const rxEmoji=/^[\\s\\p{Extended_Pictographic}\\uFE0F\\u200D\\u2060\\u2022\\u25AA\\u25AB\\u25CF\\u25A0\\u25B6\\u25BC\\u25C6\\u2600-\\u27BF]+/u;
const norm=v=>String(v??'').replace(/\\s+/g,' ').trim();
const core=v=>norm(v).replace(rxEmoji,'').trim();
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function catalog(locale){
  const p=basePack()[locale]||{};
  return Object.assign({},p,dbCatalog[locale]||{},__VELORA_CORE_OVERRIDES[locale]||{});
}
function translateExact(text,locale){
  const original=norm(text); if(!original) return text;
  const c=catalog(locale);
  if(c[original]) return c[original];
  const bare=core(original);
  if(c[bare]){ const prefix=original.slice(0,original.indexOf(bare)); return prefix+c[bare]; }
  // Longest-match translation for dynamic strings that contain a known phrase.
  let out=original; let changed=false;
  Object.keys(c).filter(k=>k&&k.length>2&&original.includes(k)).sort((a,b)=>b.length-a.length).slice(0,8).forEach(k=>{
    const v=c[k]; if(v&&v!==k&&out.includes(k)){out=out.split(k).join(v);changed=true;}
  });
  return changed?out:text;
}
function translateElementAttrs(el,locale){
  ['placeholder','title','aria-label'].forEach(a=>{const v=el.getAttribute?.(a); if(v){const t=translateExact(v,locale); if(t!==v) el.setAttribute(a,t);}});
  if(el.tagName==='INPUT' || el.tagName==='TEXTAREA') {
    const v=el.value; if(v){const t=translateExact(v,locale); if(t!==v && !el.matches(':focus')) el.value=t;}
  }
}
function translateDom(root=document){
  if(translating) return; translating=true;
  const locale=state.locale||localStorage.getItem('velora_language')||'en';
  try{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
      const p=n.parentElement; if(!p) return NodeFilter.FILTER_REJECT;
      const tag=p.tagName; if(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','OPTION'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if(p.closest('[contenteditable="true"]')) return NodeFilter.FILTER_REJECT;
      const v=norm(n.nodeValue||''); return v?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[]; let n; while((n=walker.nextNode())) nodes.push(n);
    nodes.forEach(node=>{
      const raw=node.nodeValue||'';
      let source=__VELORA_TEXT_SOURCES.get(node);
      if(source===undefined){ source=norm(raw); __VELORA_TEXT_SOURCES.set(node,source); }
      const t=translateExact(source,locale);
      if(t!==source && raw!==t) node.nodeValue=t;
      else if(locale==='en' && raw!==source) node.nodeValue=source;
    });
    root.querySelectorAll?.('*').forEach(el=>translateElementAttrs(el,locale));
  } finally{translating=false;}
}
async function loadDbCatalog(locale){
  try{const db=getDb(); if(!db?.rpc) return; const r=await db.rpc('velora_get_i18n_catalog',{p_locale:locale}); if(!r.error&&r.data&&typeof r.data==='object') dbCatalog[locale]=r.data;}catch(_){}
}
async function applyLocale(locale){
  state.locale=locale; localStorage.setItem('velora_language',locale);
  document.documentElement.lang=locale; document.documentElement.dir=meta()[locale]?.dir||(locale==='ar'?'rtl':'ltr');
  window.VELORA_GLOBAL_LOCALE = locale;
  await loadDbCatalog(locale);
  await veloraLoadContentTranslations(locale);
  translateDom(document);
  try{ __veloraFixHeroCore(locale); }catch(_){}
  try{ if(typeof renderCategories==='function') renderCategories(); }catch(_){}
  try{ if(typeof renderFeaturedProducts==='function') renderFeaturedProducts(); }catch(_){}
  try{ if(typeof renderShopProducts==='function' && document.getElementById('shopProducts')) renderShopProducts(); }catch(_){}
  document.querySelectorAll('select#languageSelect, #languageSelect, select[id*=language i]').forEach(x=>{try{x.value=locale}catch(_){}});
  window.dispatchEvent(new CustomEvent('velora:i18n-applied',{detail:{locale}}));
}
// Preserve the existing language engine but make its DOM translation robust (emoji + dynamic content).
const previous=window.setVeloraLanguage;
window.setVeloraLanguage=async function(locale){
  if(!meta()[locale] && !basePack()[locale]) return false;
  try{if(typeof previous==='function'){const ok=await previous(locale); if(ok===false)return false;}}catch(_){}
  await applyLocale(locale); return true;
};
window.VELORA_TRANSLATE_ALL=()=>translateDom(document);
function __veloraFixHeroCore(locale){
  const root=document.querySelector('#page-home'); if(!root)return;
  const h=root.querySelector('.hero-title');
  if(h){const parts=[...h.childNodes].filter(n=>n.nodeType===3); if(parts[0])parts[0].nodeValue=(__VELORA_CORE_OVERRIDES[locale]?.['Discover More.']||'Discover More.')+' '; const p=parts[1]; if(p)p.nodeValue=__VELORA_CORE_OVERRIDES[locale]?.['Shop Better.']||'Shop Better.';}
  root.querySelectorAll('.hero-badge').forEach(e=>{if(e.textContent.trim().includes('MULTI-SELLER MARKETPLACE'))e.lastChild&& (e.lastChild.nodeValue=' '+(__VELORA_CORE_OVERRIDES[locale]?.['MULTI-SELLER MARKETPLACE']||'MULTI-SELLER MARKETPLACE'));});
}

window.VELORA_GET_TRANSLATION=(source,locale=state.locale)=>translateExact(source,locale);

const observer=new MutationObserver(ms=>{
  if(document.documentElement.dataset.veloraI18nBusy==='1')return;
  const frag=[]; ms.forEach(m=>{m.addedNodes?.forEach(n=>{if(n.nodeType===1)frag.push(n);});});
  if(frag.length) frag.forEach(n=>translateDom(n));
});
function boot(){
  try{observer.observe(document.body,{subtree:true,childList:true});}catch(_){}
  const initial=state.locale||'en'; applyLocale(initial);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();

/* ---------- Global Content Localization editor ---------- */
(function(){try{if(document.getElementById('velora-content-loc-style'))return;const s=document.createElement('style');s.id='velora-content-loc-style';s.textContent='.velora-loc-editor{margin:14px 0;padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.025)}.velora-loc-editor-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px;flex-wrap:wrap}.velora-loc-editor-item{border-top:1px solid rgba(255,255,255,.08);padding:10px 0}.velora-loc-editor-item summary{cursor:pointer;font-weight:800;list-style:none}.velora-loc-editor-item summary::-webkit-details-marker{display:none}';document.head.appendChild(s)}catch(_){}})();

/* ---------- Localization Center (admin / owner / staff) ---------- */
(function(){
  const navId='veloraLocCenterNav60'; const hostId='veloraLocalization60';
  function adminRoot(){return document.querySelector('#adminPlatform .admin-nav,.admin-sidebar,.admin-nav');}
  function addNav(){
    const nav=adminRoot(); if(!nav||document.getElementById(navId))return;
    const sec=document.createElement('div'); sec.className='admin-nav-section';
    sec.innerHTML='<div class="admin-nav-title">Global Experience</div><div class="admin-nav-item" id="'+navId+'"><span>🌍</span><span>Localization Center</span></div>';
    const item=sec.querySelector('#'+navId); item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Localization Center';render();}; nav.appendChild(sec);
  }
  async function rpc(name,args){const db=getDb(); if(!db?.rpc)throw new Error('Supabase unavailable'); const r=await db.rpc(name,args||{}); if(r.error)throw r.error; return r.data;}
  const langs=()=>Object.keys(meta());
  async function render(){
    const c=document.getElementById('adminContent'); if(!c)return;
    let root=document.getElementById(hostId); if(!root){root=document.createElement('div');root.id=hostId;c.appendChild(root);}
    root.innerHTML='<div class="velora-loc-shell"><div class="velora-loc-card"><h2>🌍 Localization Center</h2><p>Manage Velora UI translations from the database. Changes apply without rebuilding the HTML.</p><div id="veloraLocStats60">Loading…</div></div><div class="velora-loc-card"><div class="velora-loc-toolbar"><input id="veloraLocSearch60" class="form-input" placeholder="Search translation key or English text"><select id="veloraLocLang60" class="form-input">'+langs().map(l=>'<option value="'+esc(l)+'">'+esc(meta()[l]?.name||l)+'</option>').join('')+'</select></div><div id="veloraLocTable60">Loading…</div></div></div>';
    const langSel=document.getElementById('veloraLocLang60'); langSel.value=state.locale||'en';
    async function load(){
      const keys=await rpc('velora_get_i18n_admin_snapshot');
      const rows=Array.isArray(keys?.keys)?keys.keys:[]; const trans=keys?.translations||{};
      const stats=langs().map(l=>{const total=rows.length;const done=rows.filter(k=>trans[l]?.[k.key]).length;return '<span class="velora-loc-stat"><b>'+esc(meta()[l]?.name||l)+'</b> '+done+'/'+total+' ('+(total?Math.round(done*100/total):100)+'%)</span>';}).join('');
      document.getElementById('veloraLocStats60').innerHTML=stats||'No translation keys registered yet.';
      function paint(){
        const q=norm(document.getElementById('veloraLocSearch60').value).toLowerCase(); const loc=langSel.value;
        const filtered=rows.filter(k=>!q||String(k.key).toLowerCase().includes(q)||String(k.source_text).toLowerCase().includes(q)).slice(0,150);
        document.getElementById('veloraLocTable60').innerHTML='<div class="velora-loc-table-wrap"><table class="velora-loc-table"><thead><tr><th>Key</th><th>Source (EN)</th><th>'+esc(meta()[loc]?.name||loc)+'</th><th>Save</th></tr></thead><tbody>'+filtered.map(k=>{const v=trans[loc]?.[k.key]||'';return '<tr><td><code>'+esc(k.key)+'</code></td><td>'+esc(k.source_text)+'</td><td><input class="form-input" data-loc-key="'+esc(k.key)+'" value="'+esc(v)+'"></td><td><button class="btn btn-primary" data-loc-save="'+esc(k.key)+'">Save</button></td></tr>';}).join('')+'</tbody></table></div>';
        document.querySelectorAll('[data-loc-save]').forEach(btn=>btn.onclick=async()=>{const key=btn.getAttribute('data-loc-save');const input=document.querySelector('[data-loc-key="'+CSS.escape(key)+'"]');try{await rpc('velora_upsert_i18n_translation',{p_key:key,p_source_text:rows.find(x=>x.key===key)?.source_text||key,p_locale:loc,p_translated_text:input?.value||'',p_category:'ui',p_reviewed:true});showToast('Translation saved','success');await load();await loadDbCatalog(loc);await applyLocale(state.locale);}catch(e){showToast('⚠️ '+(e.message||e),'error');}});
      }
      document.getElementById('veloraLocSearch60').oninput=paint; langSel.onchange=paint; paint();
    }
    try{await load();}catch(e){root.innerHTML='<div class="velora-loc-card">Localization Center requires staff access and the Stage 60 RPCs.</div>';}
  }
  function css(){if(document.getElementById('velora-loc-style60'))return;const s=document.createElement('style');s.id='velora-loc-style60';s.textContent='.velora-loc-shell{display:grid;gap:16px}.velora-loc-card{background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px}.velora-loc-toolbar{display:grid;grid-template-columns:1fr 220px;gap:10px;margin-bottom:14px}.velora-loc-table-wrap{overflow:auto}.velora-loc-table{width:100%;border-collapse:collapse}.velora-loc-table th,.velora-loc-table td{padding:10px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:top}.velora-loc-stat{display:inline-block;margin:6px 8px 0 0;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.05)}@media(max-width:700px){.velora-loc-toolbar{grid-template-columns:1fr}}';document.head.appendChild(s)}
  const boot=()=>{css();addNav();if(document.getElementById('adminPlatform')?.classList.contains('active')){}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  const oldShow=window.showAdminSection; window.showAdminSection=function(section,btn){if(typeof oldShow==='function')oldShow.apply(this,arguments);if(section==='localization60'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Localization Center';render();}};
})();
})();
