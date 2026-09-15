(()=>{
'use strict';
const esc43=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function rpc43(fn,args={}){if(window.supabaseClient?.rpc)return window.supabaseClient.rpc(fn,args);if(window.sb?.rpc)return window.sb.rpc(fn,args);throw new Error('Supabase client unavailable')}
async function render43(){
 const c=document.getElementById('adminContent');if(!c)return;
 c.innerHTML='<div class="velora-pay-note">⏳ Loading Checkout Orchestration…</div>';
 try{
  const r=await rpc43('velora_get_checkout_orchestration_control_plane');
  const d=r.data||{};
  const gates=Array.isArray(d.gates)?d.gates:[];
  const p=Number(d.pass_count||0),w=Number(d.warn_count||0),b=Number(d.blocked_count||0);
  c.innerHTML=`<div class="velora-checkout43">
   <div><b>Stage 43 — Real Checkout Orchestration</b><div class="velora-checkout43-muted">Canonical checkout-session control with idempotency, currency, totals, payment handoff and multi-seller readiness. No live provider settlement is claimed here.</div></div>
   <div class="velora-checkout43-actions"><button class="velora-checkout43-btn primary" id="v43Audit">🧪 Run checkout audit</button><button class="velora-checkout43-btn" id="v43Refresh">↻ Refresh</button></div>
   <div class="velora-checkout43-grid" style="margin-top:12px">
    <div class="velora-checkout43-card"><div class="velora-checkout43-muted">PASS</div><div class="velora-checkout43-big">${p}</div></div>
    <div class="velora-checkout43-card"><div class="velora-checkout43-muted">WARN</div><div class="velora-checkout43-big">${w}</div></div>
    <div class="velora-checkout43-card"><div class="velora-checkout43-muted">BLOCKED</div><div class="velora-checkout43-big">${b}</div></div>
    <div class="velora-checkout43-card"><div class="velora-checkout43-muted">Overall</div><div class="velora-checkout43-big">${esc43(d.overall_status||'UNKNOWN')}</div></div>
   </div>
   <div class="velora-checkout43-card" style="margin-top:12px"><h3>Checkout gates</h3>${gates.length?gates.map(g=>`<div class="velora-checkout43-status"><strong>${esc43(g.code||g.gate_code||'GATE')}</strong> — ${esc43(g.status||'UNKNOWN')}<div class="velora-checkout43-muted" style="margin-top:4px">${esc43(g.message||g.evidence||'')}</div></div>`).join(''):'<div class="velora-checkout43-muted">Run the audit to populate checkout gates.</div>'}</div>
  </div>`;
  document.getElementById('v43Audit')?.addEventListener('click',async()=>{try{const x=await rpc43('velora_run_checkout_orchestration_audit');if(x.error)throw x.error;await render43()}catch(e){alert(e.message||e)}});
  document.getElementById('v43Refresh')?.addEventListener('click',render43);
 }catch(e){c.innerHTML='<div class="velora-pay-note">❌ Checkout Orchestration unavailable: '+esc43(e.message||e)+'</div>'}
}
function addNav43(){
 const nav=document.querySelector('#adminPlatform .admin-nav'); if(!nav||nav.querySelector('[data-velora-checkout43]'))return;
 const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Commerce</div><div class="admin-nav-item" data-velora-checkout43="1"><span>🛒</span><span>Checkout Orchestration</span></div>';
 const item=sec.querySelector('[data-velora-checkout43]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Checkout Orchestration';render43()};nav.appendChild(sec);
}
const prev=window.renderAdminLayout;window.renderAdminLayout=function(){const html=typeof prev==='function'?prev.apply(this,arguments):'';if(!html)return html;return html.replace(/<div class="admin-nav-section">\s*<div class="admin-nav-title">System<\/div>/,m=>m+'<div class="admin-nav-item" data-section="checkout43" onclick="showAdminSection(\'checkout43\', this)"><span>🛒</span><span>Checkout Orchestration</span></div>')};
const prevShow=window.showAdminSection;window.showAdminSection=function(section,btn){if(typeof prevShow==='function')prevShow.apply(this,arguments);if(section==='checkout43'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Checkout Orchestration';render43()}};
setTimeout(addNav43,2400);console.log('✅ Velora Stage 43 Real Checkout Orchestration loaded');
})();
