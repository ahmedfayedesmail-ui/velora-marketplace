(()=>{
'use strict';
const esc53=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const rpc53=async(name,args={})=>{const c=window.supabaseClient||window.sb;if(!c?.rpc)throw new Error('Supabase client unavailable');return await c.rpc(name,args)};
const host53=()=>document.getElementById('veloraStage53');
function badge53(s){const cls=s==='PASS'?'v53-pass':s==='FAIL'?'v53-fail':s==='BLOCKED'?'v53-block':'v53-warn';return '<span class="v53-pill '+cls+'">'+esc53(s)+'</span>'}
function hasAny53(selectors){return selectors.some(s=>document.querySelector(s))}
function runLocal53(){
 const checks=[];
 const client=!!(window.supabaseClient||window.sb);
 checks.push({code:'runtime_dom',name:'Runtime DOM',status:document.documentElement?'PASS':'FAIL',detail:'Document shell is mounted'});
 checks.push({code:'supabase_client',name:'Supabase client',status:client?'PASS':'WARN',detail:client?'Client object detected':'Client not mounted in current runtime'});
 checks.push({code:'customer_catalog',name:'Customer catalog',status:hasAny53(['#productGrid','.product-grid','.product-card','[data-product-id]'])?'PASS':'WARN',detail:'Catalog/product anchor detected'});
 checks.push({code:'cart',name:'Cart',status:hasAny53(['#cart','.cart','.cart-drawer','[data-cart]'])?'PASS':'WARN',detail:'Cart anchor detected'});
 checks.push({code:'checkout',name:'Checkout',status:hasAny53(['#checkout','.checkout','.checkout-page','[data-checkout]'])?'PASS':'WARN',detail:'Checkout anchor detected'});
 checks.push({code:'orders',name:'Orders',status:hasAny53(['#orders','.orders','.order-list','[data-order-id]'])?'PASS':'WARN',detail:'Order anchor detected'});
 checks.push({code:'seller',name:'Seller surface',status:hasAny53(['.seller-center','.seller-platform','#sellerContent'])?'PASS':'WARN',detail:'Seller anchor detected'});
 checks.push({code:'admin',name:'Admin control plane',status:hasAny53(['#adminPlatform','.admin-platform'])?'PASS':'WARN',detail:'Admin shell detected'});
 checks.push({code:'canonical_checkout_rpc',name:'Canonical checkout RPC',status:typeof window.veloraCreateCheckoutSession==='function'?'PASS':'WARN',detail:'Frontend checkout contract export'});
 return checks;
}
async function persist53(checks){
 try{const r=await rpc53('velora_record_regression_run',{p_suite:'stage53_runtime_contract',p_checks:checks});if(r.error)throw new Error(r.error.message);return r.data||null}catch(e){return {persistError:e.message||String(e)}}
}
async function render53(){
 const h=host53(); if(!h)return;
 h.innerHTML='<div class="v53-wrap"><div class="v53-muted">Running Stage 53 regression suite…</div></div>';
 let local=runLocal53(), saved=await persist53(local);
 const pass=local.filter(x=>x.status==='PASS').length,warn=local.filter(x=>x.status==='WARN').length,fail=local.filter(x=>x.status==='FAIL').length,blocked=local.filter(x=>x.status==='BLOCKED').length;
 h.innerHTML=`<div class="v53-wrap"><div class="v53-row"><div><strong>Stage 53 — Regression & Contract Test Suite</strong><div class="v53-muted">Safe runtime regression checks. These tests validate local contracts and mounted surfaces; they do not simulate a real card charge, provider webhook, carrier delivery, or production deployment.</div></div><div class="v53-actions"><button class="v53-btn primary" id="v53Run">🧪 Run regression</button></div></div>
 <div class="v53-grid" style="margin-top:12px"><div class="v53-card"><div class="v53-muted">PASS</div><div class="v53-big">${pass}</div></div><div class="v53-card"><div class="v53-muted">WARN</div><div class="v53-big">${warn}</div></div><div class="v53-card"><div class="v53-muted">FAIL</div><div class="v53-big">${fail}</div></div><div class="v53-card"><div class="v53-muted">BLOCKED</div><div class="v53-big">${blocked}</div></div></div>
 <div class="v53-card" style="margin-top:12px"><strong>Contract checks</strong><div class="v53-list">${local.map(c=>`<div class="v53-row"><div><b>${esc53(c.name)}</b><div class="v53-muted">${esc53(c.code)} · ${esc53(c.detail)}</div></div>${badge53(c.status)}</div>`).join('')}</div></div>
 <div class="v53-card" style="margin-top:12px"><strong>Persistence</strong><div class="v53-muted" style="margin-top:7px">${esc53(saved?.persistError||('Run recorded in the regression ledger: '+(saved?.run_id||saved?.id||'yes')))}</div></div>
 <div class="v53-muted" style="margin-top:10px">Regression rule: a PASS means the local contract is present, not that an external provider or real-world device flow has completed successfully.</div></div>`;
 document.getElementById('v53Run')?.addEventListener('click',render53);
}
function install53(){if(host53())return;const c=document.getElementById('adminContent');if(!c)return;const h=document.createElement('div');h.id='veloraStage53';c.appendChild(h);render53()}
function addNav53(){const nav=document.querySelector('#adminPlatform .admin-nav,.admin-sidebar,.admin-nav');if(!nav||nav.querySelector('[data-v53-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Quality & Testing</div><div class="admin-nav-item" data-v53-nav><span>🧪</span><span>Regression Suite</span></div>';const item=sec.querySelector('[data-v53-nav]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const t=document.getElementById('adminHeaderTitle');if(t)t.textContent='Regression & Contract Test Suite';install53()};nav.appendChild(sec)}
const boot53=()=>{addNav53();if(document.getElementById('adminPlatform')?.classList.contains('active'))install53()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot53);else boot53();
window.VELORA_STAGE53={run:runLocal53,render:render53};
console.log('✅ Velora Stage 53 Regression & Contract Test Suite loaded');
})();
