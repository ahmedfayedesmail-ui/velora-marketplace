(()=>{
  'use strict';
  if(window.__VELORA_STAGE51_LOADED)return; window.__VELORA_STAGE51_LOADED=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const state=v=>{const x=String(v||'').toLowerCase();const cls=x==='pass'||x==='ok'?'velora-qa51-pass':(x==='blocked'||x==='fail'?'velora-qa51-blocked':'velora-qa51-warn');return `<span class="velora-qa51-pill ${cls}">${esc(String(v||'WARN').toUpperCase())}</span>`};
  function duplicateIds(){
    const map=new Map(); document.querySelectorAll('[id]').forEach(el=>{const id=el.id; if(!map.has(id))map.set(id,[]); map.get(id).push(el)});
    return [...map.entries()].filter(([,els])=>els.length>1).map(([id,els])=>({id,count:els.length,tags:els.map(e=>e.tagName).slice(0,4)}));
  }
  function essentialChecks(){
    const ids=['adminContent','sellerContent'];
    return ids.map(id=>({name:`DOM anchor: ${id}`,status:document.getElementById(id)?'PASS':'WARN',detail:document.getElementById(id)?'present in runtime DOM':'not currently mounted; may be lazy view'}));
  }
  async function run(){
    const dups=duplicateIds();
    const checks=[
      {name:'HTML document',status:document.documentElement?'PASS':'FAIL',detail:'documentElement available'},
      {name:'Customer core surface',status:document.querySelector('[class*="product"], #productGrid, .product-grid')?'PASS':'WARN',detail:'product/catalog UI anchor detected'},
      {name:'Cart surface',status:document.querySelector('[class*="cart"], #cart, .cart')?'PASS':'WARN',detail:'cart UI anchor detected'},
      {name:'Checkout surface',status:document.querySelector('[class*="checkout"], #checkout, .checkout')?'PASS':'WARN',detail:'checkout UI anchor detected'},
      {name:'Order surface',status:document.querySelector('[class*="order"], #orders, .orders')?'PASS':'WARN',detail:'order UI anchor detected'},
      {name:'Admin surface',status:document.querySelector('#adminPlatform,.admin-platform')?'PASS':'WARN',detail:'admin shell detected'},
      {name:'Seller surface',status:document.querySelector('.seller-center,.seller-platform,[id="sellerContent"]')?'PASS':'WARN',detail:'seller shell detected'},
      {name:'Duplicate IDs',status:dups.length?'WARN':'PASS',detail:dups.length?`${dups.length} duplicate id groups remain (legacy/dynamic compatibility)`: 'none detected'},
      ...essentialChecks()
    ];
    const pass=checks.filter(x=>x.status==='PASS').length,warn=checks.filter(x=>x.status==='WARN').length,fail=checks.filter(x=>x.status==='FAIL').length;
    const c=document.getElementById('adminContent'); if(!c)return;
    c.innerHTML=`<div class="velora-qa51-wrap"><div class="velora-qa51-head"><div><b>Stage 51 — Experience QA & Stabilization</b><div class="velora-qa51-muted">Runtime smoke checks for the actual Velora shell. This does not replace browser/device testing, security testing or provider certification.</div></div><div class="velora-qa51-actions"><button class="btn btn-primary" onclick="window.VELORA_RUN_QA51()">🧪 Run QA scan</button></div></div>
      <div class="velora-qa51-grid"><div class="velora-qa51-card"><div>PASS</div><div class="velora-qa51-big">${pass}</div></div><div class="velora-qa51-card"><div>WARN</div><div class="velora-qa51-big">${warn}</div></div><div class="velora-qa51-card"><div>FAIL</div><div class="velora-qa51-big">${fail}</div></div><div class="velora-qa51-card"><div>Duplicate ID Groups</div><div class="velora-qa51-big">${dups.length}</div></div></div>
      <div class="velora-qa51-section"><h3>🔬 Runtime Checks</h3>${checks.map(x=>`<div class="velora-qa51-row"><div><b>${esc(x.name)}</b><div class="velora-qa51-muted">${esc(x.detail)}</div></div>${state(x.status)}</div>`).join('')}</div>
      <div class="velora-qa51-section"><h3>🧩 Duplicate ID Watchlist</h3>${dups.length?dups.map(x=>`<div class="velora-qa51-row"><div><b>${esc(x.id)}</b><div class="velora-qa51-muted">${esc(x.tags.join(', '))}</div></div>${state('WARN')}<div class="velora-qa51-muted">×${x.count}</div></div>`).join(''):'<div class="velora-qa51-muted">No duplicate IDs detected at scan time.</div>'}</div>
      <div class="velora-qa51-note">Stabilization rule: warnings are visible instead of hidden. Duplicate IDs are retained where legacy compatibility may depend on them; they should be removed only after the affected flows are migrated to scoped selectors. Provider settlement, real-device coverage and production deployment remain separate gates.</div></div>`;
  }
  window.VELORA_RUN_QA51=run;
  function addNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-qa51-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Quality & Stability</div><div class="admin-nav-item" data-velora-qa51-nav="1"><span>🧪</span><span>Experience QA</span></div>';const item=sec.querySelector('[data-velora-qa51-nav]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Experience QA & Stabilization';run()};nav.appendChild(sec)}
  const oldOpen=window.VELORA_OPEN_ADMIN; window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addNav,420);return r}; setTimeout(addNav,2400);
  console.log('✅ Velora Stage 51 Experience QA loaded');
})();
