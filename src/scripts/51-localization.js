/* ================================================================
   VELORA I18N V5 — GLOBAL UI TRANSLATION RUNTIME + LOCALIZATION CENTER
   ================================================================ */
(()=>{
'use strict';
/* V5_PRESENT is synchronous: V4 must remain dormant while V5 is available. */
window.VELORA_I18N_V5_PRESENT=true;
window.VELORA_I18N_V5_READY=false;
window.VELORA_I18N_V5_FAILED=false;
const getDb=()=>window.mahaSupabase||window.supabaseClient||window.sb||null;
const __phase1StoredLocale=(localStorage.getItem('velora_language')||'en').toLowerCase();
const state=window.VELORA_GLOBAL_LOCALE_STATE=window.VELORA_GLOBAL_LOCALE_STATE||{locale:['en','ar'].includes(__phase1StoredLocale)?__phase1StoredLocale:'en'};
const ACTIVE_LOCALES=Object.freeze(['en','ar']);
const meta=()=>window.VELORA_CORE?.languages||{};
const basePack=()=>window.__VELORA_PACK||{};
let localeEpoch=0;
let reverseSourceCache=null;
function normalizeLocale(code){
  const value=String(code||'').toLowerCase();
  return ACTIVE_LOCALES.includes(value)?value:'en';
}
function buildReverseSourceCache(){
  const reverse=new Map();
  const addPack=(pack)=>{
    if(!pack||typeof pack!=='object')return;
    Object.entries(pack).forEach(([source,target])=>{
      const sourceText=norm(source);
      const targetText=norm(target);
      if(sourceText)reverse.set(sourceText,sourceText);
      if(targetText&&!reverse.has(targetText))reverse.set(targetText,sourceText||targetText);
    });
  };
  addPack(basePack().en||{});
  Object.keys(basePack()).forEach(locale=>addPack(basePack()[locale]));
  Object.keys(__VELORA_CORE_OVERRIDES).forEach(locale=>addPack(__VELORA_CORE_OVERRIDES[locale]||{}));
  Object.keys(dbCatalog).forEach(locale=>addPack(dbCatalog[locale]||{}));
  reverseSourceCache=[...reverse.entries()].sort((a,b)=>b[0].length-a[0].length);
  return reverseSourceCache;
}
function canonicalSourceFor(raw){
  const original=norm(raw);
  if(!original)return original;
  const entries=reverseSourceCache||buildReverseSourceCache();
  const direct=entries.find(([localized])=>localized===original);
  if(direct)return direct[1];
  let out=original;
  let changed=false;
  for(const [localized,source] of entries){
    if(localized.length<3||localized===source)continue;
    if(out.includes(localized)){
      out=out.split(localized).join(source);
      changed=true;
    }
  }
  return changed?norm(out):original;
}
const textSourceCache=new WeakMap();
const __VELORA_CORE_OVERRIDES = {
  en:{'Dashboard':'Dashboard',
    'Users':'Users',
    'Sellers':'Sellers',
    'Audit Logs':'Audit Logs',
    'Seller Applications':'Seller Applications',
    'Applications':'Applications',
    'Recent Orders':'Recent Orders',
    'Pending Sellers':'Pending Sellers',
    'Pending Products':'Pending Products',
    'Global Preferences':'Global Preferences',
    'Language, country, currency, timezone and regional formatting are saved to your Velora account.':'Language, country, currency, timezone and regional formatting are saved to your Velora account.',
    'Country / Region':'Country / Region',
    'Currency':'Currency',
    'Timezone':'Timezone',
    'Date / Locale':'Date / Locale',
    'Save Global Preferences':'Save Global Preferences',
    'My Account':'My Account',
    'Manage your profile and preferences':'Manage your profile and preferences',
    'Protected':'Protected',
    'Quick Links':'Quick Links',
    'Customer Service':'Customer Service',
    'Newsletter':'Newsletter',
    'Subscribe for latest offers':'Subscribe for latest offers',
    'Return Policy':'Return Policy',
    'Shipping Policy':'Shipping Policy',
    'FAQ':'FAQ',
    'Contact Us':'Contact Us',
    'Discover More.':'Discover More.','Shop Better.':'Shop Better.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.','MULTI-SELLER MARKETPLACE':'MULTI-SELLER MARKETPLACE','Start Shopping':'Start Shopping','Become a Seller':'Become a Seller'},
  ar:{'Dashboard':'لوحة التحكم',
    'Users':'المستخدمون',
    'Sellers':'البائعون',
    'Audit Logs':'سجل التدقيق',
    'Seller Applications':'طلبات البائعين',
    'Applications':'التطبيقات',
    'Recent Orders':'أحدث الطلبات',
    'Pending Sellers':'البائعون المعلّقون',
    'Pending Products':'المنتجات المعلّقة',
    'Global Preferences':'الإعدادات العالمية',
    'Language, country, currency, timezone and regional formatting are saved to your Velora account.':'يتم حفظ اللغة والدولة والعملة والمنطقة الزمنية وتنسيق العرض الإقليمي في حسابك على Velora.',
    'Country / Region':'الدولة / المنطقة',
    'Currency':'العملة',
    'Timezone':'المنطقة الزمنية',
    'Date / Locale':'التاريخ / الإعدادات المحلية',
    'Save Global Preferences':'حفظ الإعدادات العالمية',
    'My Account':'حسابي',
    'Manage your profile and preferences':'إدارة ملفك الشخصي وتفضيلاتك',
    'Protected':'محمي',
    'Quick Links':'روابط سريعة',
    'Customer Service':'خدمة العملاء',
    'Newsletter':'النشرة البريدية',
    'Subscribe for latest offers':'اشترك للحصول على أحدث العروض',
    'Return Policy':'سياسة الإرجاع',
    'Shipping Policy':'سياسة الشحن',
    'FAQ':'الأسئلة الشائعة',
    'Contact Us':'اتصل بنا',
    'Discover More.':'اكتشف المزيد.','Shop Better.':'تسوق بشكل أفضل.','Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.':'كل ما تحتاجه، من متاجر يمكنك الوثوق بها. استكشف المنتجات واكتشف بائعين جدد وتسوق بذكاء — كل ذلك في سوق واحد.','MULTI-SELLER MARKETPLACE':'سوق متعدد البائعين','Start Shopping':'ابدأ التسوق','Become a Seller':'كن بائعًا'},
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
try{window.VELORA_I18N_PROVENANCE?.registerCatalog('en',__VELORA_CORE_OVERRIDES.en||{});}catch(_){}
Object.keys(__VELORA_CORE_OVERRIDES).forEach(locale=>{
  if(locale!=='en'){try{window.VELORA_I18N_PROVENANCE?.registerCatalog(locale,__VELORA_CORE_OVERRIDES[locale]||{});}catch(_){}}
});
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
  if(translating)return;
  translating=true;
  const locale=normalizeLocale(state.locale);
  try{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
      const p=n.parentElement;if(!p)return NodeFilter.FILTER_REJECT;
      const tag=p.tagName;if(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','OPTION'].includes(tag))return NodeFilter.FILTER_REJECT;
      if(p.closest('[contenteditable="true"]'))return NodeFilter.FILTER_REJECT;
      const v=norm(n.nodeValue||'');return v?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);
    nodes.forEach(node=>{
      const raw=node.nodeValue||'';
      const knownSource=textSourceCache.get(node);
      const source=knownSource||canonicalSourceFor(raw);
      textSourceCache.set(node,source);
      const t=translateExact(source,locale);
      if(raw!==t)node.nodeValue=t;
    });

    const elements=(root.querySelectorAll?root:document).querySelectorAll?.('input,textarea,button,[title],[aria-label]')||[];
    elements.forEach(el=>{
      ['placeholder','title','aria-label'].forEach(attr=>{
        if(!el.hasAttribute(attr))return;
        const raw=el.getAttribute(attr)||'';
        const slot='data-velora-i18n-'+attr;
        const knownSource=el.getAttribute(slot);
        const source=knownSource||canonicalSourceFor(raw);
        el.setAttribute(slot,source);
        const t=translateExact(source,locale);
        if(t!==source)el.setAttribute(attr,t);
        else if(raw!==source)el.setAttribute(attr,source);
      });
    });
  }finally{translating=false;}
}

async function loadDbCatalog(locale){
  try{
    const db=getDb();if(!db?.rpc)return;
    const r=await db.rpc('velora_get_i18n_catalog',{p_locale:locale});
    if(!r.error&&r.data&&typeof r.data==='object'){
      dbCatalog[locale]=r.data;
      reverseSourceCache=null;
      try{window.VELORA_I18N_PROVENANCE?.registerCatalog(locale,r.data);}catch(_){}
    }
  }catch(_){}
}

async function applyLocale(locale,requestId){
  locale=normalizeLocale(locale);
  state.locale=locale;
  const model=window.VELORA_GLOBAL_LOCALE_STATE||state;
  model.locale=locale;
  window.VELORA_GLOBAL_LOCALE = locale;
  localStorage.setItem('velora_language',locale);
  document.documentElement.lang=locale;
  document.documentElement.dir=meta()[locale]?.dir||(locale==='ar'?'rtl':'ltr');
  await loadDbCatalog(locale);
  if(requestId!==localeEpoch)return false;
  if(typeof veloraLoadContentTranslations==='function') await veloraLoadContentTranslations(locale);

  // Render locale-sensitive dynamic surfaces first, normalize the Home hero,
  // then perform one final DOM translation pass. Keeping hero normalization
  // inside this lifecycle avoids a post-translation mutation round-trip.
  try{ if(typeof renderCategories==='function') renderCategories(); }catch(_){}
  try{ if(typeof renderFeaturedProducts==='function') renderFeaturedProducts(); }catch(_){}
  try{ if(typeof renderShopProducts==='function' && document.getElementById('shopProducts')) renderShopProducts(); }catch(_){}

  try{ __veloraFixHeroCore(locale); }catch(_){}
  translateDom(document);

  document.querySelectorAll('select#languageSelect, #languageSelect, select[id*=language i]').forEach(x=>{try{x.value=locale}catch(_){}});
  if(requestId!==localeEpoch)return false;
  window.dispatchEvent(new CustomEvent('velora:i18n-applied',{detail:{locale}}));
  return true;
}
// Preserve the existing language engine but make its DOM translation robust (emoji + dynamic content).
async function setLang(code){
  code=normalizeLocale(code);
  if(!meta()[code] && !basePack()[code])return false;
  const requestId=++localeEpoch;
  try{
    localStorage.setItem('velora_language',code);
    const c=getDb();
    if(c?.rpc){
      try{
        const s=await c.auth?.getSession?.();
        if(s?.data?.session?.user) await c.rpc('velora_set_language_preference',{p_locale:code});
      }catch(_){}
    }
    state.locale=code;
    const s=document.getElementById('languageSelect');if(s)s.value=code;
    return await applyLocale(code,requestId);
  }catch(e){
    window.VELORA_I18N_V5_READY=false;
    window.VELORA_I18N_V5_FAILED=true;
    console.warn('[Velora i18n] V5 runtime failure; activating V4 fallback',e);
    try{window.VELORA_I18N_ACTIVATE_FALLBACK?.();}catch(_){}
    return false;
  }
}


function __veloraFixHeroCore(locale){
  const root=document.querySelector('#page-home'); if(!root)return;
  const h=root.querySelector('.hero-title');
  if(h){
    const parts=[...h.childNodes].filter(n=>n.nodeType===3 && n.nodeValue.trim());
    const pack=__VELORA_CORE_OVERRIDES[locale]||{};
    const first=pack['Discover More.']||'Discover More.';
    const second=pack['Shop Better.']||'Shop Better.';
    if(parts[0] && parts[0].nodeValue !== first) parts[0].nodeValue=first;
    if(parts[1] && parts[1].nodeValue !== second) parts[1].nodeValue=second;
  }
  const core=__VELORA_CORE_OVERRIDES[locale]||{};
  const desc=root.querySelector('.hero-desc');
  const description=core['Everything you need, from stores you can trust. Explore products, discover new sellers, and shop smarter — all in one marketplace.'];
  if(desc && description && desc.textContent !== description) desc.textContent=description;
  root.querySelectorAll('.hero-badge').forEach(e=>{
    if(e.textContent.trim().includes('MULTI-SELLER MARKETPLACE')){
      const textNodes=[...e.childNodes].filter(n=>n.nodeType===3 && n.nodeValue.trim());
      const last=textNodes[textNodes.length-1];
      const badgeText=' '+(core['MULTI-SELLER MARKETPLACE']||'MULTI-SELLER MARKETPLACE');
      if(last && last.nodeValue !== badgeText) last.nodeValue=badgeText;
    }
  });
}

window.VELORA_GET_TRANSLATION=(source,locale=state.locale)=>translateExact(source,locale);

let observerRunning=false;
const observer=new MutationObserver(ms=>{
  if(observerRunning)return;
  if(document.documentElement.dataset.veloraI18nBusy==='1')return;
  if(!ms.some(m=>(m.type==='childList'&&m.addedNodes.length)||(m.type==='characterData'&&m.target)))return;

  observerRunning=true;
  observer.disconnect();

  try{
    translateDom(document);
  }catch(e){
    window.VELORA_I18N_V5_READY=false;
    window.VELORA_I18N_V5_FAILED=true;
    console.warn('[Velora i18n] V5 observer failure; activating V4 fallback',e);
    try{window.VELORA_I18N_ACTIVATE_FALLBACK?.();}catch(_){}
  }finally{
    observerRunning=false;
    if(document.body){
      observer.observe(document.body,{childList:true,subtree:true});
    }
  }
});

async function boot(){
  try{
    const stored=String(localStorage.getItem('velora_language')||'').toLowerCase();
    const lang=normalizeLocale(state.locale||stored);
    state.locale=lang;
    localStorage.setItem('velora_language',lang);
    const requestId=++localeEpoch;
    const s=document.getElementById('languageSelect');
    if(s)s.value=lang;
    await applyLocale(lang,requestId);
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
    window.VELORA_I18N_V5_READY=true;
    window.VELORA_I18N_V5_FAILED=false;
  }catch(e){
    window.VELORA_I18N_V5_READY=false;
    window.VELORA_I18N_V5_FAILED=true;
    console.warn('[Velora i18n] V5 boot failure; activating V4 fallback',e);
    try{window.VELORA_I18N_ACTIVATE_FALLBACK?.();}catch(_){}
  }
}

window.VELORA_V5_SET_LANGUAGE=setLang;
window.VELORA_I18N_SET_LANGUAGE=setLang;
window.VELORA_I18N_RENDER=translateDom;
window.VELORA_TRANSLATE_ALL=()=>translateDom(document);

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
