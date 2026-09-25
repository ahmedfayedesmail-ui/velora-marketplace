/* ============================================================
   VELORA — Seller Onboarding Control Plane
   Staging / Restore-Test. Mutations are RPC-governed.
   ============================================================ */
(function(){
  'use strict';

  const db = window.mahaSupabase;
  if(!db || typeof db.rpc!=='function') return;

  function esc(v){
    const fn=window.escapeHtml;
    if(typeof fn==='function') return fn(String(v==null?'':v));
    return String(v==null?'':'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function statusClass(v){
    v=String(v||'').toLowerCase();
    if(['approved','verified','accepted','active','passed'].includes(v)) return 'approved';
    if(['pending','in_review','submitted','not_started'].includes(v)) return 'processing';
    if(['rejected','failed'].includes(v)) return 'rejected';
    return 'pending';
  }

  function select(name, value, options){
    return '<select class="form-select" id="vo_'+name+'">'+options.map(function(o){
      return '<option value="'+esc(o[0])+'" '+(String(value||'')===String(o[0])?'selected':'')+'>'+esc(o[1])+'</option>';
    }).join('')+'</select>';
  }

  const OPTS={
    application:[
      ['draft','Draft'],['submitted','Submitted'],['in_review','In review'],['approved','Approved'],['rejected','Rejected']
    ],
    identity:[
      ['pending','Pending'],['in_review','In review'],['verified','Verified'],['rejected','Rejected']
    ],
    authenticity:[
      ['pending','Pending'],['in_review','In review'],['verified','Verified'],['rejected','Rejected'],['not_required','Not required']
    ],
    catalog:[
      ['pending','Pending'],['in_review','In review'],['approved','Approved'],['rejected','Rejected']
    ],
    sla:[
      ['pending','Pending'],['accepted','Accepted'],['rejected','Rejected']
    ],
    pilot:[
      ['not_started','Not started'],['active','Active'],['passed','Passed'],['failed','Failed']
    ]
  };

  async function loadCases(){
    const {data,error}=await db
      .from('seller_onboarding_cases')
      .select('id,seller_id,application_status,identity_status,authenticity_status,catalog_status,sla_status,pilot_status,legal_name,business_name,contact_name,contact_channel,evidence_refs,review_notes,rejection_reason,reviewer_user_id,submitted_at,reviewed_at,activated_at,rejected_at,created_at,updated_at')
      .order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }

  function betaReady(c){
    return c.application_status==='approved'
      && c.identity_status==='verified'
      && c.catalog_status==='approved'
      && c.sla_status==='accepted'
      && ['active','passed'].includes(c.pilot_status)
      && ['verified','not_required'].includes(c.authenticity_status)
      && String(c.contact_name||'').trim()!==''
      && ['email','phone','whatsapp','other'].includes(String(c.contact_channel||''));
  }

  async function saveCase(id){
    const payload={
      p_seller_id:id,
      p_application_status:document.getElementById('vo_application_'+id)?.value||null,
      p_identity_status:document.getElementById('vo_identity_'+id)?.value||null,
      p_authenticity_status:document.getElementById('vo_authenticity_'+id)?.value||null,
      p_catalog_status:document.getElementById('vo_catalog_'+id)?.value||null,
      p_sla_status:document.getElementById('vo_sla_'+id)?.value||null,
      p_pilot_status:document.getElementById('vo_pilot_'+id)?.value||null,
      p_legal_name:document.getElementById('vo_legal_'+id)?.value.trim()||null,
      p_business_name:document.getElementById('vo_business_'+id)?.value.trim()||null,
      p_contact_name:document.getElementById('vo_contact_'+id)?.value.trim()||null,
      p_contact_channel:document.getElementById('vo_channel_'+id)?.value||null,
      p_review_notes:document.getElementById('vo_notes_'+id)?.value.trim()||null,
      p_rejection_reason:document.getElementById('vo_reject_'+id)?.value.trim()||null
    };

    const evidenceText=document.getElementById('vo_evidence_'+id)?.value.trim()||'';
    if(evidenceText){
      try{payload.p_evidence_refs=JSON.parse(evidenceText);}
      catch(_){throw new Error('Evidence refs must be valid JSON.');}
    }

    const {data,error}=await db.rpc('velora_upsert_seller_onboarding_case',payload);
    if(error) throw error;
    if(window.showToast) window.showToast('✅ Seller onboarding case updated','success');
    await render();
    return data;
  }

  function caseCard(c){
    const ready=betaReady(c);
    const evidence=JSON.stringify(c.evidence_refs||{},null,2);
    return '<section class="admin-section-card" style="margin:0 0 1rem;">'
      +'<div class="velora-op-toolbar">'
        +'<div><h3 style="margin:0">🏪 '+esc(c.business_name||'Seller')+'</h3>'
        +'<div class="velora-op-muted">Seller ID: '+esc(c.seller_id)+'</div></div>'
        +'<span class="velora-op-status '+esc(statusClass(ready?'beta_ready':c.application_status))+'">'+esc(ready?'BETA READY':c.application_status)+'</span>'
      +'</div>'
      +'<div class="velora-op-note" style="margin:.75rem 0;">'
        +'<b>Readiness is operational, not legal approval.</b> Beta-ready requires verified identity, approved catalog, accepted SLA, authenticity cleared, and pilot active/passed. Legal acceptance remains a separate versioned gate.'
      +'</div>'
      +'<div class="form-row">'
        +'<div class="form-group"><label>Application</label>'+select('application_'+c.seller_id,c.application_status,OPTS.application)+'</div>'
        +'<div class="form-group"><label>Identity</label>'+select('identity_'+c.seller_id,c.identity_status,OPTS.identity)+'</div>'
        +'<div class="form-group"><label>Authenticity</label>'+select('authenticity_'+c.seller_id,c.authenticity_status,OPTS.authenticity)+'</div>'
      +'</div>'
      +'<div class="form-row">'
        +'<div class="form-group"><label>Catalog</label>'+select('catalog_'+c.seller_id,c.catalog_status,OPTS.catalog)+'</div>'
        +'<div class="form-group"><label>SLA</label>'+select('sla_'+c.seller_id,c.sla_status,OPTS.sla)+'</div>'
        +'<div class="form-group"><label>Pilot</label>'+select('pilot_'+c.seller_id,c.pilot_status,OPTS.pilot)+'</div>'
      +'</div>'
      +'<div class="form-row">'
        +'<div class="form-group"><label>Legal name</label><input class="form-input" id="vo_legal_'+c.seller_id+'" value="'+esc(c.legal_name||'')+'"></div>'
        +'<div class="form-group"><label>Business name</label><input class="form-input" id="vo_business_'+c.seller_id+'" value="'+esc(c.business_name||'')+'"></div>'
      +'</div>'
      +'<div class="form-row">'
        +'<div class="form-group"><label>Contact name</label><input class="form-input" id="vo_contact_'+c.seller_id+'" value="'+esc(c.contact_name||'')+'"></div>'
        +'<div class="form-group"><label>Contact channel</label>'+select('channel_'+c.seller_id,c.contact_channel||'', [['','—'],['email','Email'],['phone','Phone'],['whatsapp','WhatsApp'],['other','Other']])+'</div>'
      +'</div>'
      +'<div class="form-group"><label>Evidence references (JSON only; no secrets)</label><textarea class="form-textarea" id="vo_evidence_'+c.seller_id+'" rows="4">'+esc(evidence)+'</textarea></div>'
      +'<div class="form-group"><label>Review notes</label><textarea class="form-textarea" id="vo_notes_'+c.seller_id+'" rows="3">'+esc(c.review_notes||'')+'</textarea></div>'
      +'<div class="form-group"><label>Rejection reason</label><textarea class="form-textarea" id="vo_reject_'+c.seller_id+'" rows="2">'+esc(c.rejection_reason||'')+'</textarea></div>'
      +'<div class="velora-op-actions"><button class="btn btn-primary" onclick="window.VELORA_SAVE_ONBOARDING(\''+esc(c.seller_id)+'\')">Save governed update</button></div>'
      +'<div class="velora-op-muted" style="margin-top:.7rem;">Updated: '+esc(c.updated_at||c.created_at||'')+'</div>'
      +'</section>';
  }

  async function render(){
    const c=document.getElementById('adminContent');
    if(!c) return;

    try{
      const cases=await loadCases();
      c.innerHTML='<div>'
        +'<div class="admin-section-card"><div class="velora-op-toolbar">'
        +'<div><h3 style="margin:0">🛡️ Seller Onboarding Control Plane</h3><div class="velora-op-muted">Evidence-driven onboarding lifecycle. Direct table writes are intentionally blocked.</div></div>'
        +'<button class="btn btn-outline" onclick="window.VELORA_RENDER_SELLER_ONBOARDING()">↻ Refresh</button>'
        +'</div>'
        +'<div class="velora-op-grid">'
        +'<div class="velora-op-kpi"><div class="kpi-value">'+cases.length+'</div><div class="kpi-label">Cases</div></div>'
        +'<div class="velora-op-kpi"><div class="kpi-value">'+cases.filter(betaReady).length+'</div><div class="kpi-label">Beta Ready</div></div>'
        +'<div class="velora-op-kpi"><div class="kpi-value">'+cases.filter(c=>c.identity_status==='verified').length+'</div><div class="kpi-label">Identity Verified</div></div>'
        +'<div class="velora-op-kpi"><div class="kpi-value">'+cases.filter(c=>c.catalog_status==='approved').length+'</div><div class="kpi-label">Catalog Approved</div></div>'
        +'</div></div>'
        +(cases.length?cases.map(caseCard).join(''):'<div class="velora-op-card"><div class="velora-op-muted">No seller onboarding cases yet.</div></div>')
        +'</div>';
    }catch(e){
      c.innerHTML='<div class="velora-op-card"><b>Onboarding control plane failed.</b><div class="velora-op-muted">'+esc(e?.message||e)+'</div></div>';
      console.error(e);
    }
  }

  window.VELORA_RENDER_SELLER_ONBOARDING=render;
  window.VELORA_SAVE_ONBOARDING=function(id){ return saveCase(id).catch(function(e){
    console.error(e);
    if(window.showToast) window.showToast('❌ '+String(e?.message||'Update failed'),'error');
  }); };

  console.log('✅ Velora Seller Onboarding control plane loaded');
})();
