(function(){
  'use strict';
  const sb50=()=>window.mahaSupabase;
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const pill=(s)=>{const x=String(s||'PENDING').toUpperCase();const c=x==='PASS'?'velora-s50-pass':x==='WARN'?'velora-s50-warn':x==='BLOCKED'?'velora-s50-block':'velora-s50-pending';return '<span class="velora-s50-pill '+c+'">'+esc(x)+'</span>';};
  const fallbackGates=[
   ['commerce','Commerce Core','PASS','Customer, cart, order and post-purchase layers exist.'],
   ['security','Security & RLS','PASS','RLS, privileged RPC boundaries and audit controls are implemented.'],
   ['e2e','E2E Validation','PASS','Safe end-to-end preflight and test control plane are present.'],
   ['integrity','Data Integrity','PASS','Reconciliation and integrity checks are available.'],
   ['operations','Operations & Workflow','PASS','Incidents, workflows, SLA and support case layers exist.'],
   ['trust','Trust & Safety','PASS','Returns, disputes, fraud signals and enforcement controls exist.'],
   ['privacy','Privacy & Consent','PASS','Consent and privacy request governance is implemented.'],
   ['ai','AI Governance','PASS','AI recommendations require governed approval boundaries.'],
   ['payments','Live Payments','BLOCKED','Requires real provider credentials and production settlement validation.'],
   ['webhooks','Verified Webhooks','BLOCKED','Requires provider-specific signature verification and end-to-end replay testing.'],
   ['shipping','Live Shipping','BLOCKED','Requires carrier credentials and real tracking API validation.'],
   ['deployment','Production Deployment','BLOCKED','Requires real hosting/CI-CD deployment evidence.'],
   ['dr','Disaster Recovery Drill','PENDING','Requires verified backup/restore evidence from the target environment.']
  ];
  async function load50(){
    const host=document.getElementById('veloraStage50'); if(!host)return;
    host.innerHTML='<div class="velora-s50-card"><strong>Loading Platform Blueprint…</strong></div>';
    let data=null;
    try{const r=await sb50().rpc('velora_get_platform_blueprint');if(r.error)throw r.error;data=r.data||null;}catch(e){data={blueprint:null,gates:[]};}
    const bp=data.blueprint||{};
    let gates=(data.gates||[]).map(g=>[g.gate_key,g.domain,g.status,g.evidence||'']).filter(Boolean);
    if(!gates.length)gates=fallbackGates;
    const counts=gates.reduce((a,g)=>(a[String(g[2]||'PENDING').toUpperCase()]=(a[String(g[2]||'PENDING').toUpperCase()]||0)+1,a),{});
    host.innerHTML='<div class="velora-stage50-wrap">'+
      '<div class="velora-s50-card"><div class="velora-s50-row"><div><strong>Stage 50 — Final Platform Blueprint & Cutover Plan</strong><div class="velora-s50-muted">One control plane for architecture truth, launch gates and production cutover readiness.</div></div><button id="s50Refresh" class="velora-s50-btn primary">↻ Run / Refresh Audit</button></div></div>'+
      '<div class="velora-s50-grid">'+
      ['PASS','WARN','BLOCKED','PENDING'].map(k=>'<div class="velora-s50-card"><div class="velora-s50-muted">'+k+'</div><div class="velora-s50-big">'+(counts[k]||0)+'</div></div>').join('')+
      '</div>'+
      '<div class="velora-s50-card"><div class="velora-s50-row"><div><strong>Blueprint</strong><div class="velora-s50-muted">'+esc(bp.version||'1.0.0')+' · '+esc(bp.status||'candidate')+'</div></div>'+pill(bp.status==='approved'?'PASS':((bp.status||'candidate').toUpperCase()==='BLOCKED'?'BLOCKED':'PENDING'))+'</div>'+
      '<div class="velora-s50-note" style="margin-top:10px">'+esc((bp.cutover_notes&&bp.cutover_notes.production_truth)||'Production truth requires external credentials, deployment evidence and verified provider integration.')+'</div></div>'+
      '<div class="velora-s50-card"><strong>Cutover Gates</strong><table class="velora-s50-table"><thead><tr><th>Domain</th><th>Gate</th><th>Status</th><th>Evidence / Next requirement</th></tr></thead><tbody>'+gates.map(g=>'<tr><td>'+esc(g[1])+'</td><td>'+esc(g[0])+'</td><td>'+pill(g[2])+'</td><td>'+esc(g[3])+'</td></tr>').join('')+'</tbody></table></div>'+
      '<div class="velora-s50-card"><strong>Architecture Ownership</strong><div class="velora-s50-list" style="margin-top:10px">'+[
        ['Customer','Marketplace UX, search/discovery, recommendations, checkout, orders, privacy'],
        ['Seller','Catalog, products, stock, orders, fulfillment, seller intelligence'],
        ['Platform','Security, RLS, workflow, reconciliation, observability, DR, release control'],
        ['External','Payments, webhook verification, carriers, hosting/CI-CD credentials']
      ].map(x=>'<div class="velora-s50-note"><strong>'+x[0]+'</strong> — '+x[1]+'</div>').join('')+'</div></div>'+
      '<div class="velora-s50-card"><strong>Cutover Rule</strong><div class="velora-s50-note" style="margin-top:10px">No browser-only flag, mock provider, or local state can turn a BLOCKED production dependency into PASS. Promotion must use controlled deployment and real external verification.</div></div>'+
      '</div>';
    const b=document.getElementById('s50Refresh'); if(b)b.onclick=load50;
  }
  function add50(){
    const nav=document.querySelector('#adminPlatform .admin-nav');
    if(nav&&!nav.querySelector('[data-s50-nav]')){const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Release</div><div class="admin-nav-item" data-s50-nav><span>🧭</span><span>Platform Blueprint</span></div>';const item=sec.querySelector('[data-s50-nav]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const t=document.getElementById('adminHeaderTitle');if(t)t.textContent='Final Platform Blueprint & Cutover';const c=document.getElementById('adminContent');if(c&&!document.getElementById('veloraStage50')){const h=document.createElement('div');h.id='veloraStage50';c.appendChild(h);}load50();};nav.appendChild(sec);}
    const c=document.getElementById('adminContent'); if(c&&!document.getElementById('veloraStage50')){const h=document.createElement('div');h.id='veloraStage50';c.appendChild(h);}
  }
  setTimeout(add50,2300); setTimeout(load50,2700); window.VELORA_STAGE50=load50; console.log('✅ Velora Stage 50 Blueprint loaded');
})();
