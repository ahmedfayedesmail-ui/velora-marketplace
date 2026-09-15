(()=>{
'use strict';
const esc49=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const rpc49=async(name,args={})=>{const c=window.mahaSupabase||window.supabaseClient||window.sb;if(!c?.rpc)throw new Error('Supabase client unavailable');return await c.rpc(name,args)};
const host49=()=>document.getElementById('veloraSeed49');
const pill49=(v,cls='')=>'<span class="velora-seed49-pill '+cls+'">'+esc49(v||'—')+'</span>';
async function render49(){
 const h=host49(); if(!h)return;
 h.innerHTML='<div class="velora-seed49-card">Loading seed environment control plane…</div>';
 try{
  const r=await rpc49('velora_get_seed_control_plane',{}); if(r.error)throw new Error(r.error.message||'Unavailable');
  const d=r.data||{};
  const scenarios=[
   ['golden_path','Golden Marketplace Path','Customer + seller + catalog + checkout + fulfillment happy path.'],
   ['failure_matrix','Failure & Recovery Matrix','Payment, shipping, integrity and support failure scenarios.'],
   ['multi_seller_checkout','Multi-Seller Checkout','Synthetic multi-seller/currency checkout scenario.'],
   ['trust_safety','Trust & Safety Cases','Synthetic returns, disputes, fraud and enforcement scenario.']
  ];
  h.innerHTML='<div class="velora-seed49"><div class="velora-seed49-toolbar"><div><b>Stage 49 — Production Data & Seed Environment</b><div class="velora-seed49-muted">Synthetic-only scenario lab. No production customer/order/payment mutations are allowed by this control plane.</div></div><div class="velora-seed49-actions"><button class="velora-seed49-btn primary" id="seed49Refresh">↻ Refresh</button></div></div><div class="velora-seed49-grid" style="margin-top:12px"><div class="velora-seed49-card"><div class="velora-seed49-muted">Mode</div><div class="velora-seed49-big">'+esc49(d.mode||'unknown')+'</div></div><div class="velora-seed49-card"><div class="velora-seed49-muted">Enabled scenarios</div><div class="velora-seed49-big">'+esc49(d.enabled_scenarios??0)+'</div></div><div class="velora-seed49-card"><div class="velora-seed49-muted">Seed runs</div><div class="velora-seed49-big">'+esc49(d.seed_runs??0)+'</div></div><div class="velora-seed49-card"><div class="velora-seed49-muted">Production writes</div><div class="velora-seed49-big">'+(d.production_writes_allowed?'BLOCKED':'OFF')+'</div></div></div><div class="velora-seed49-card" style="margin-top:12px"><div class="velora-seed49-row"><div><strong>Safety boundary</strong><div class="velora-seed49-muted">Real customer data and production mutations remain outside the seed engine.</div></div>'+pill49((d.real_customer_data_allowed||d.production_writes_allowed)?'REVIEW REQUIRED':'SAFE BY CONTRACT',(d.real_customer_data_allowed||d.production_writes_allowed)?'velora-seed49-block':'velora-seed49-safe')+'</div></div><div class="velora-seed49-card" style="margin-top:12px"><strong>Scenarios</strong><div class="velora-seed49-list">'+scenarios.map(s=>'<div class="velora-seed49-card"><div class="velora-seed49-row"><div><strong>'+esc49(s[1])+'</strong><div class="velora-seed49-muted" style="margin-top:4px">'+esc49(s[2])+'</div></div><button class="velora-seed49-btn" data-seed49-run="'+esc49(s[0])+'">Preview run</button></div></div>').join('')+'</div></div><div class="velora-seed49-card" style="margin-top:12px"><strong>Environment policy</strong><div class="velora-seed49-muted" style="margin-top:8px">Seed data is synthetic and isolated. Promotion to staging or production must happen through controlled deployment/CI processes, never through this browser surface.</div></div></div>';
  h.querySelector('#seed49Refresh').onclick=render49;
  h.querySelectorAll('[data-seed49-run]').forEach(b=>b.onclick=async()=>{const key=b.dataset.seed49Run;b.disabled=true;try{const x=await rpc49('velora_preview_seed_run',{p_scenario_key:key});if(x.error)throw new Error(x.error.message||'Preview failed');alert('Synthetic preview recorded. Run: '+(x.data?.run_id||'created'));render49()}catch(e){alert(e.message||'Preview unavailable')}finally{b.disabled=false}});
 }catch(e){h.innerHTML='<div class="velora-seed49-card"><strong>Seed control plane unavailable</strong><div class="velora-seed49-muted" style="margin-top:6px">'+esc49(e.message||e)+'</div></div>'}
}
function install49(){if(host49())return;const c=document.getElementById('adminContent');if(!c)return;const h=document.createElement('div');h.id='veloraSeed49';c.appendChild(h);render49()}
function addNav49(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-seed49-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Engineering</div><div class="admin-nav-item" data-seed49-nav><span>🧪</span><span>Seed Environment</span></div>';const item=sec.querySelector('[data-seed49-nav]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const t=document.getElementById('adminHeaderTitle');if(t)t.textContent='Seed Environment & Scenario Lab';install49()};nav.appendChild(sec)}
setTimeout(addNav49,2100);setTimeout(install49,2550);window.VELORA_RENDER_SEED49=render49;console.log('✅ Velora Stage 49 Seed Environment loaded');
})();
