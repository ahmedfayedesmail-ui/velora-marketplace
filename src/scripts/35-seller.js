(()=>{
'use strict';
function v39El(id){return document.getElementById(id)}
async function v39Rpc(fn,args={}){if(window.supabaseClient?.rpc)return window.supabaseClient.rpc(fn,args); if(window.sb?.rpc)return window.sb.rpc(fn,args); return {data:null,error:new Error('Supabase client unavailable')}}
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
 <div class="velora-seller39-card" style="margin-top:12px"><div class="velora-seller39-muted">Estimated seller earnings</div><div class="velora-seller39-kpi">${Number(d.estimated_earnings||0).toLocaleString()}</div><div class="velora-seller39-muted" style="margin-top:6px">Operational estimate from canonical order items; not a payout settlement.</div>
 <div class="velora-seller39-actions"><button class="velora-seller39-btn primary" id="v39Snapshot">Capture operations snapshot</button><button class="velora-seller39-btn" id="v39Refresh">Refresh</button></div></div>
 </div>`;
 v39El('v39Snapshot')?.addEventListener('click',async()=>{const x=await v39Rpc('velora_capture_seller_ops_snapshot'); if(x.error) alert(x.error.message||'Snapshot failed'); else {alert('Operations snapshot captured');v39Load()}});
 v39El('v39Refresh')?.addEventListener('click',v39Load);
}
function v39Install(){
 let admin=document.querySelector('[data-page="seller-operations"],#page-seller-operations,#page-seller');
 if(!admin || (admin.classList.contains('page') && !admin.classList.contains('active')))return;
 if(document.getElementById('veloraSellerOps39'))return;
 const wrap=document.createElement('div');wrap.id='veloraSellerOps39';
 const title=document.createElement('div');title.innerHTML='<h2 style="margin:0 0 8px">🏪 Seller Command Center</h2><div class="velora-seller39-muted">Seller-scoped operations, catalog health, order flow and earnings signals.</div>';
 wrap.appendChild(title);wrap.insertAdjacentHTML('beforeend','');
 admin.appendChild(wrap);setTimeout(v39Load,50);
}
const oldLoad=window.loadPageContent;
window.loadPageContent=function(page){const r=typeof oldLoad==='function'?oldLoad.apply(this,arguments):undefined; if(String(page).toLowerCase().includes('seller'))setTimeout(v39Install,150);return r};
setTimeout(v39Install,1800);
console.log('✅ Velora Stage 39 Seller UX & Operations loaded');
})();
