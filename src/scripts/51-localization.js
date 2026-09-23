/* ================================================================
   VELORA I18N KERNEL — SINGLE SOURCE OF TRUTH
   ----------------------------------------------------------------
   Rules:
   1) Locale state changes synchronously in the browser.
   2) Supabase persistence is asynchronous and can never overwrite a
      newer client choice.
   3) Translations resolve from stable canonical source messages.
   4) Missing translations fall back to the whole canonical source;
      partial English/Arabic mixtures are never synthesized.
   5) Dynamic DOM is covered by a MutationObserver as a safety net.
   ================================================================ */
(()=>{
'use strict';

window.VELORA_I18N_V5_PRESENT=true;
window.VELORA_I18N_V5_READY=false;
window.VELORA_I18N_V5_FAILED=false;

const getDb=()=>window.mahaSupabase||window.supabaseClient||window.sb||null;
const meta=()=>window.VELORA_CORE?.languages||{};
const state=window.VELORA_GLOBAL_LOCALE_STATE=window.VELORA_GLOBAL_LOCALE_STATE||{
  locale:(localStorage.getItem('velora_language')||'en').toLowerCase()
};
const DIR={ar:'rtl'};
const dbCatalog={};
const sourceByNode=new WeakMap();
const sourceByAttr=new WeakMap();
let rendering=false;
let observerPaused=false;

const norm=v=>String(v??'').replace(/\s+/g,' ').trim();
const localeList=()=>Object.keys(window.__VELORA_PACK||meta()||{});
const isLocale=code=>localeList().includes(String(code||'').toLowerCase());
const langName=code=>meta()[code]?.name||meta()[code]?.native||code;

const CORE_AR={
  'Dashboard':'لوحة التحكم',
  'Protected':'محمي',
  'Protected 🔐':'محمي 🔐',
  'Overview':'نظرة عامة',
  'Operations':'العمليات',
  'System':'النظام',
  'Catalog Trust':'ثقة الكتالوج',
  'Customers':'العملاء',
  'Users':'المستخدمون',
  'Sellers':'البائعون',
  'Seller':'البائع',
  'Products':'المنتجات',
  'Orders':'الطلبات',
  'Pending Reviews':'التقييمات المعلقة',
  'Active Account Actions':'إجراءات الحساب النشطة',
  'Pending Sellers':'البائعون المعلقون',
  'Pending Products':'المنتجات المعلقة',
  'Needs Attention':'تحتاج إلى مراجعة',
  'Order Value by Currency':'قيمة الطلبات حسب العملة',
  'Non-cancelled/refunded orders':'الطلبات غير الملغاة وغير المستردة',
  'Operations Breakdown':'ملخص العمليات',
  'Recent Orders':'أحدث الطلبات',
  'Latest 10':'أحدث 10',
  'Recent Audit Activity':'أحدث نشاط للتدقيق',
  'Quick Actions':'إجراءات سريعة',
  'Review Applications':'مراجعة الطلبات',
  'Manage Sellers':'إدارة البائعين',
  'Moderate Products':'مراجعة المنتجات',
  'Audit Logs':'سجلات التدقيق',
  'Applications':'طلبات البائعين',
  'Reviews':'التقييمات',
  'Customer':'العميل',
  'Payment':'الدفع',
  'Total':'الإجمالي',
  'Date':'التاريخ',
  'Status':'الحالة',
  'Order':'الطلب',
  'Refresh':'تحديث',
  'No orders found.':'لا توجد طلبات.',
  'No order value recorded.':'لا توجد قيمة طلبات مسجلة.',
  'No recent audit activity.':'لا يوجد نشاط تدقيق حديث.',
  'Pending':'معلق',
  'Paid':'مدفوع',
  'Failed':'فشل',
  'Refunded':'مسترد',
  'Approved':'معتمد',
  'Rejected':'مرفوض',
  'Processing':'قيد المعالجة',
  'Shipped':'تم الشحن',
  'Delivered':'تم التسليم',
  'Suspended':'موقوف',
  'Multi':'متعدد',
  'Categories':'الفئات',
  'Powered':'مدعوم',
  'Global Preferences':'التفضيلات العامة',
  'Language, country, currency, timezone and regional formatting are saved to your Velora account.':'يتم حفظ اللغة والدولة والعملة والمنطقة الزمنية والتنسيق الإقليمي في حساب Velora الخاص بك.',
  'Country / Region':'الدولة / المنطقة',
  'Currency':'العملة',
  'Timezone':'المنطقة الزمنية',
  'Date / Number Locale':'تنسيق التاريخ / الأرقام',
  'Save Global Preferences':'حفظ التفضيلات العامة',
  'Localization Center':'مركز الترجمة',
  'Global Experience':'التجربة العامة',
  'Seller Applications':'طلبات البائعين',
  'Explore Velora':'استكشف Velora',
  'Shop What You Love':'تسوق ما تحب',
  'Recommended for you':'موصى به لك',
  'Quick':'سريع',
  'Recent':'أحدث',
  'Review Applications':'مراجعة الطلبات',
  'No sellers.':'لا يوجد بائعون.',
  'No products.':'لا توجد منتجات.',
  'No items recorded.':'لا توجد عناصر مسجلة.',
  'Build my routine':'أنشئ روتينك',
  'Protected checkout':'الدفع المحمي',
  'Multi-seller':'متعدد البائعين',
  'Track your order':'تتبع طلبك',
  'Trust & Safety':'الثقة والأمان',
  'Quick Actions':'إجراءات سريعة',
  'Recent Orders':'أحدث الطلبات',
  'Recent Audit Activity':'أحدث نشاط للتدقيق',
  'Operations Breakdown':'ملخص العمليات',
  'Order Value by Currency':'قيمة الطلبات حسب العملة',
  'Pending Reviews':'التقييمات المعلقة',
  'Active Account Actions':'إجراءات الحساب النشطة',
  'Become a Seller':'كن بائعًا',
  'Start Shopping':'ابدأ التسوق',
  'Explore Velora':'استكشف Velora'
};

function catalog(locale){
  const code=String(locale||'en').toLowerCase();
  const pack=(window.__VELORA_PACK||{})[code]||{};
  const merged=Object.assign({},pack,dbCatalog[code]||{});
  if(code==='ar')Object.assign(merged,CORE_AR);
  return merged;
}

function splitDecorations(value){
  const s=String(value??'');
  const lead=(s.match(/^[\s\p{Extended_Pictographic}\uFE0F\u200D]+/u)||[''])[0];
  const tail=(s.match(/[\s\p{Extended_Pictographic}\uFE0F\u200D]+$/u)||[''])[0];
  const body=s.slice(lead.length, tail.length?s.length-tail.length:undefined).trim();
  return {lead,body,tail};
}

function resolveExact(source,locale){
  const s=norm(source);
  if(!s)return s;
  const d=catalog(locale);
  if(Object.prototype.hasOwnProperty.call(d,s) && norm(d[s]))return String(d[s]);

  const sl=s.toLowerCase();
  for(const k of Object.keys(d)){
    if(norm(k).toLowerCase()===sl && norm(d[k]))return String(d[k]);
  }

  const decorated=splitDecorations(s);
  if(decorated.body){
    if(Object.prototype.hasOwnProperty.call(d,decorated.body) && norm(d[decorated.body]))
      return decorated.lead+String(d[decorated.body])+decorated.tail;
    const bl=decorated.body.toLowerCase();
    for(const k of Object.keys(d)){
      if(norm(k).toLowerCase()===bl && norm(d[k]))
        return decorated.lead+String(d[k])+decorated.tail;
    }
  }

  const en=catalog('en');
  if(locale==='en'){
    if(Object.prototype.hasOwnProperty.call(en,s))return String(en[s]);
    if(decorated.body && Object.prototype.hasOwnProperty.call(en,decorated.body))
      return decorated.lead+String(en[decorated.body])+decorated.tail;
    for(const k of Object.keys(en)){
      if(norm(k).toLowerCase()===sl)return String(en[k]);
      if(decorated.body && norm(k).toLowerCase()===decorated.body.toLowerCase())
        return decorated.lead+String(en[k])+decorated.tail;
    }
  }
  return s;
}

let reverseCache={};
function rebuildReverse(){
  const out={};
  for(const locale of localeList()){
    const d=catalog(locale);
    for(const key of Object.keys(d)){
      const source=norm(key);
      const value=norm(d[key]);
      if(!value||value===source)continue;
      const bucket=out[value]||(out[value]=new Set());
      bucket.add(source);
      const lower=value.toLowerCase();
      const lb=out[lower]||(out[lower]=new Set());
      lb.add(source);
    }
  }
  reverseCache=out;
}
function reverseSource(raw){
  const v=norm(raw); if(!v)return null;
  const exact=reverseCache[v];
  if(exact&&exact.size===1)return [...exact][0];
  const lower=reverseCache[v.toLowerCase()];
  if(lower&&lower.size===1)return [...lower][0];
  return null;
}

function sourceForNode(node){
  if(sourceByNode.has(node))return sourceByNode.get(node);
  const raw=norm(node.nodeValue||'');
  if(!raw)return '';
  const p=node.parentElement;
  let source=null;
  const holder=(p&&p.hasAttribute?.('data-velora-i18n'))?p:null;
  if(holder&&holder.childNodes.length===1){
    const key=norm(holder.getAttribute('data-velora-i18n')||'');
    if(key)source=key;
  }
  if(!source && Object.prototype.hasOwnProperty.call(catalog('en'),raw))source=raw;
  if(!source){
    const decorated=splitDecorations(raw);
    if(decorated.body && (
      Object.prototype.hasOwnProperty.call(catalog('en'),decorated.body) ||
      Object.prototype.hasOwnProperty.call(catalog(state.locale),decorated.body)
    )){
      source=decorated.lead+decorated.body+decorated.tail;
    }
  }
  if(!source)source=reverseSource(raw);
  source=source||raw;
  sourceByNode.set(node,source);
  return source;
}

function sourceForAttr(el,attr){
  let map=sourceByAttr.get(el);
  if(!map){map=new Map();sourceByAttr.set(el,map);}
  if(map.has(attr))return map.get(attr);
  const slot='data-velora-i18n-'+attr;
  const explicit=norm(el.getAttribute(slot)||'');
  const raw=norm(el.getAttribute(attr)||'');
  const source=explicit||(
    Object.prototype.hasOwnProperty.call(catalog('en'),raw)?raw:
    reverseSource(raw)||raw
  );
  map.set(attr,source);
  if(!el.hasAttribute(slot))el.setAttribute(slot,source);
  return source;
}

function textEligible(node){
  const p=node.parentElement;
  if(!p)return false;
  const tag=p.tagName;
  if(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','SVG','PATH'].includes(tag))return false;
  if(p.closest?.('[contenteditable="true"]'))return false;
  return !!norm(node.nodeValue||'');
}

function translateRoot(root,locale){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];let n;
  while((n=walker.nextNode()))nodes.push(n);
  for(const node of nodes){
    if(!textEligible(node))continue;
    const raw=node.nodeValue||'';
    // First try the live text itself. This handles renderer replacements and
    // prevents stale provenance from blocking an exact catalog translation.
    const direct=resolveExact(raw,locale);
    const source=(direct!==norm(raw))?raw:sourceForNode(node);
    const translated=(direct!==norm(raw))?direct:resolveExact(source,locale);
    const lead=raw.match(/^\s*/)?.[0]||'';
    const trail=raw.match(/\s*$/)?.[0]||'';
    if(translated!==source)node.nodeValue=lead+translated+trail;
    else if(locale==='en' && source!==norm(raw))node.nodeValue=lead+source+trail;
  }

  const query=root.querySelectorAll?root:document;
  const els=query.querySelectorAll?.('input,textarea,button,[title],[aria-label],option')||[];
  els.forEach(el=>{
    for(const attr of ['placeholder','title','aria-label']){
      if(!el.hasAttribute(attr))continue;
      const rawAttr=el.getAttribute(attr)||'';
      const directAttr=resolveExact(rawAttr,locale);
      const source=(directAttr!==norm(rawAttr))?rawAttr:sourceForAttr(el,attr);
      const translated=(directAttr!==norm(rawAttr))?directAttr:resolveExact(source,locale);
      if(translated!==source)el.setAttribute(attr,translated);
      else if(locale==='en')el.setAttribute(attr,source);
    }
    if(el.tagName==='OPTION'){
      const node=el.firstChild;
      if(node&&node.nodeType===3){
        const rawOpt=node.nodeValue||'';
        const directOpt=resolveExact(rawOpt,locale);
        const source=(directOpt!==norm(rawOpt))?rawOpt:sourceForNode(node);
        const translated=(directOpt!==norm(rawOpt))?directOpt:resolveExact(source,locale);
        if(translated!==source)node.nodeValue=translated;
        else if(locale==='en'&&source!==norm(node.nodeValue||''))node.nodeValue=source;
      }
    }
  });
}

function refreshPickerUi(locale){
  const s=document.getElementById('languageSelect');
  if(s)s.value=locale;
  if(s?.nextElementSibling?.classList?.contains('velora-picker')){
    const wrap=s.nextElementSibling;
    const btn=wrap.querySelector('.velora-picker-btn');
    const metaLang=meta()[locale]||{};
    if(btn)btn.innerHTML='<span>'+String(metaLang.code||locale.toUpperCase())+'</span><span aria-hidden="true">▾</span>';
    wrap.querySelectorAll('.velora-picker-option').forEach(o=>{
      const active=o.dataset.value===locale;
      o.classList.toggle('active',active);
      o.setAttribute('aria-selected',active?'true':'false');
    });
  }
}

function paintLocale(locale){
  const code=String(locale||'en').toLowerCase();
  if(!isLocale(code))return false;

  state.locale=code;
  window.VELORA_GLOBAL_LOCALE=code;
  window.VELORA_GLOBAL_LOCALE_STATE=window.VELORA_GLOBAL_LOCALE_STATE||state;
  window.VELORA_GLOBAL_LOCALE_STATE.locale=code;
  localStorage.setItem('velora_language',code);
  document.documentElement.lang=code;
  document.documentElement.dir=DIR[code]||'ltr';
  refreshPickerUi(code);

  rebuildReverse();
  observerPaused=true;
  try{translateRoot(document,code);}finally{observerPaused=false;}

  // One last synchronous pass after DOM mutations triggered by translation.
  try{translateRoot(document,code);}catch(_){}
  try{window.dispatchEvent(new CustomEvent('velora:languagechange',{detail:{code}}));}catch(_){}
  try{window.dispatchEvent(new CustomEvent('velora:i18n-applied',{detail:{locale:code}}));}catch(_){}
  return true;
}

async function loadDbCatalog(locale){
  try{
    const db=getDb();
    if(!db?.rpc)return;
    const r=await db.rpc('velora_get_i18n_catalog',{p_locale:locale});
    if(!r.error&&r.data&&typeof r.data==='object'){
      dbCatalog[locale]=r.data;
      rebuildReverse();
      if(state.locale===locale)paintLocale(locale);
    }
  }catch(_){}
}

async function persistLocale(locale){
  try{
    const db=getDb();
    if(!db?.rpc)return;
    const session=await db.auth?.getSession?.();
    if(session?.data?.session?.user){
      await db.rpc('velora_set_language_preference',{p_locale:locale});
    }
  }catch(_){}
}

function setLang(code){
  const locale=String(code||'').toLowerCase();
  if(!isLocale(locale))return false;

  // Critical invariant: never await before changing what the user sees.
  paintLocale(locale);
  void persistLocale(locale);
  void loadDbCatalog(locale);
  return true;
}

async function applyLocale(locale){
  const code=String(locale||'en').toLowerCase();
  if(!isLocale(code))return false;
  paintLocale(code);
  await loadDbCatalog(code);
  return true;
}

function prime(root=document){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];let n;
  while((n=walker.nextNode()))nodes.push(n);
  for(const node of nodes){
    if(!textEligible(node))continue;
    sourceForNode(node);
  }
  const els=(root.querySelectorAll?root:document).querySelectorAll?.('input,textarea,button,[title],[aria-label],option')||[];
  els.forEach(el=>{
    for(const attr of ['placeholder','title','aria-label']){
      if(el.hasAttribute(attr))sourceForAttr(el,attr);
    }
  });
}

const observer=new MutationObserver(mutations=>{
  if(observerPaused||rendering)return;
  const added=[];
  for(const m of mutations){
    if(m.type==='childList'){
      for(const n of Array.from(m.addedNodes||[]))if(n.nodeType===1||n.nodeType===3)added.push(n);
    }else if(m.type==='characterData' && m.target?.nodeType===3){
      added.push(m.target);
    }
  }
  if(!added.length)return;
  rendering=true;
  try{
    rebuildReverse();
    const locale=state.locale||localStorage.getItem('velora_language')||'en';
    for(const n of added){
      if(n.nodeType===3){
        if(!sourceByNode.has(n))sourceForNode(n);
        translateRoot(n.parentElement||document,locale);
      }else{
        prime(n);
        translateRoot(n,locale);
      }
    }
  }finally{rendering=false;}
});


/* ----------------------------------------------------------------
   RENDER-CAPTURE GUARD
   Dynamic Velora renderers still contain legacy hard-coded English
   strings. Intercept the final DOM write so localized HTML is
   translated BEFORE it reaches the live page. This is the last
   compatibility boundary while feature renderers migrate to t().
   ---------------------------------------------------------------- */
let nativeInnerHTML=null;
let nativeTextContent=null;
let nativeSetAttribute=null;
let renderCaptureInstalled=false;
let captureBusy=false;

function localizeMarkupBeforeMount(html){
  const locale=state.locale||'en';
  if(locale==='en'||captureBusy||typeof document==='undefined')return String(html??'');
  captureBusy=true;
  try{
    const tpl=document.createElement('template');
    nativeInnerHTML?.set?.call(tpl,String(html??''));
    prime(tpl.content);
    translateRoot(tpl.content,locale);
    return tpl.innerHTML;
  }catch(_){
    return String(html??'');
  }finally{
    captureBusy=false;
  }
}

function installRenderCapture(){
  if(renderCaptureInstalled||typeof Element==='undefined')return;
  renderCaptureInstalled=true;

  const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
  if(inner?.set){
    nativeInnerHTML=inner;
    Object.defineProperty(Element.prototype,'innerHTML',{
      configurable:inner.configurable,
      enumerable:inner.enumerable,
      get:inner.get,
      set(value){
        const tag=String(this?.tagName||'').toUpperCase();
        if(captureBusy||['SCRIPT','STYLE','NOSCRIPT'].includes(tag)){
          inner.set.call(this,value);return;
        }
        inner.set.call(this,localizeMarkupBeforeMount(value));
      }
    });
  }

  const textDesc=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
  if(textDesc?.set){
    nativeTextContent=textDesc;
    Object.defineProperty(Node.prototype,'textContent',{
      configurable:textDesc.configurable,
      enumerable:textDesc.enumerable,
      get:textDesc.get,
      set(value){
        if(captureBusy||this?.nodeType!==1){
          textDesc.set.call(this,value);return;
        }
        const locale=state.locale||'en';
        const raw=String(value??'');
        const translated=resolveExact(raw,locale);
        textDesc.set.call(this,translated);
      }
    });
  }

  const setAttr=Element.prototype.setAttribute;
  if(typeof setAttr==='function'){
    nativeSetAttribute=setAttr;
    Element.prototype.setAttribute=function(name,value){
      const attr=String(name||'').toLowerCase();
      if(!captureBusy&&['placeholder','title','aria-label'].includes(attr)){
        const locale=state.locale||'en';
        value=resolveExact(String(value??''),locale);
      }
      return setAttr.call(this,name,value);
    };
  }

  window.__VELORA_I18N_RENDER_CAPTURE=true;
}

function syncLoadingScreen(){
  const loading=document.getElementById('loadingScreen');
  if(loading)loading.classList.add('hidden');
}

function bootSync(){
  const stored=String(localStorage.getItem('velora_language')||'').toLowerCase();
  let code=isLocale(stored)?stored:'en';
  installRenderCapture();
  rebuildReverse();
  prime(document);
  paintLocale(code);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  window.VELORA_I18N_V5_READY=true;
  window.VELORA_I18N_V5_FAILED=false;
  syncLoadingScreen();

  if(!stored){
    void (async()=>{
      try{
        const db=getDb();
        const r=await db?.rpc?.('velora_get_language_preference');
        const server=String(r?.data||'').toLowerCase();
        if(isLocale(server)&&server!==state.locale)paintLocale(server);
      }catch(_){}
    })();
  }
}

window.VELORA_V5_SET_LANGUAGE=setLang;
window.VELORA_I18N_SET_LANGUAGE=setLang;
window.VELORA_I18N_RENDER=(root)=>translateRoot(root||document,state.locale||'en');
window.VELORA_TRANSLATE_ALL=()=>translateRoot(document,state.locale||'en');
window.VELORA_GET_TRANSLATION=(source,locale=state.locale)=>resolveExact(source,locale);
window.VELORA_I18N=(window.__VELORA_PACK||{});
window.VELORA_I18N_VERSION='KERNEL-1.0';
window.setVeloraLanguage=setLang;

/* Keep the compatibility fallback API inert while V5 is healthy. */
window.VELORA_I18N_ACTIVATE_FALLBACK=()=>false;

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',bootSync,{once:true});
}else{
  bootSync();
}

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
