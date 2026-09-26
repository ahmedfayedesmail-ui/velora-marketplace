(function(){
'use strict';
const db=window.mahaSupabase;
if(!db) return;
const esc11 = window.esc || window.escapeHtml || (x=>String(x??''));
const money11 = (a,c)=>{try{return new Intl.NumberFormat(undefined,{style:'currency',currency:c||window.VELORA_CURRENCY||'USD'}).format(Number(a||0))}catch(_){return `${Number(a||0).toFixed(2)} ${c||''}`}};
const cls11 = s => String(s||'').toLowerCase().replace(/[^a-z0-9_-]/g,'-');
const toast11 = e => window.showToast ? showToast('❌ '+(e?.message||e),'error') : console.error(e);

async function trustStats(){
 const qs=await Promise.all([
   db.from('disputes').select('id,status',{count:'exact',head:true}),
   db.from('returns').select('id,status',{count:'exact',head:true}),
   db.from('fraud_risk_events').select('id,status',{count:'exact',head:true}),
   db.from('policy_violations').select('id,status',{count:'exact',head:true}),
 ]);
 const n=(r)=>r?.count||0;
 return {disputes:n(qs[0]),returns:n(qs[1]),fraud:n(qs[2]),violations:n(qs[3])};
}
async function trustCases(){
 const [d,r,f,p]=await Promise.all([
  db.from('disputes').select('id,order_id,customer_id,store_id,reason,status,resolution,created_at,updated_at').order('created_at',{ascending:false}).limit(100),
  db.from('returns').select('id,order_id,customer_id,store_id,reason,status,refund_amount,currency_code,requested_at,resolved_at').order('requested_at',{ascending:false}).limit(100),
  db.from('fraud_risk_events').select('id,user_id,store_id,order_id,event_type,risk_score,severity,status,evidence,reviewed_by,reviewed_at,created_at').order('created_at',{ascending:false}).limit(100),
  db.from('policy_violations').select('id,user_id,store_id,product_id,violation_type,severity,status,description,action_taken,created_by,created_at,resolved_at').order('created_at',{ascending:false}).limit(100)
 ]);
 [d,r,f,p].forEach(x=>{if(x.error)throw x.error});
 return {disputes:d.data||[],returns:r.data||[],fraud:f.data||[],violations:p.data||[]};
}
async function resolveDispute(id,status,resolution){
 const {data,error}=await db.rpc('velora_resolve_dispute',{p_dispute_id:id,p_status:status,p_resolution:resolution||null});
 if(error)throw error;return data;
}
async function resolveReturn(id,status,resolution){
 const {data,error}=await db.rpc('velora_resolve_return',{p_return_id:id,p_status:status,p_resolution:resolution||null,p_refund_reference:null,p_refund_provider:null,p_refund_method:null});
 if(error)throw error;return data;
}
async function reviewFraud(id,status,note){
 const {data,error}=await db.rpc('velora_review_fraud_event',{p_event_id:id,p_status:status,p_note:note||null});
 if(error)throw error;return data;
}
async function createViolation({userId,storeId,productId,type,severity,description,action}){
 const {data,error}=await db.rpc('velora_create_policy_violation',{p_user_id:userId||null,p_store_id:storeId||null,p_product_id:productId||null,p_violation_type:type,p_severity:severity,p_description:description,p_action_taken:action||null});
 if(error)throw error;return data;
}
async function accountAction(userId,action,reason,duration){
 const {data,error}=await db.rpc('velora_account_action',{p_user_id:userId,p_action_type:action,p_reason:reason,p_duration_hours:duration||null,p_metadata:{source:'stage11_admin'}});
 if(error)throw error;return data;
}

async function renderTrustSafety(){
 const c=document.getElementById('adminContent'); if(!c)return;
 c.innerHTML='<div class="velora-op-note">⏳ Loading Trust & Safety control plane…</div>';
 try{
  const [s,data]=await Promise.all([trustStats(),trustCases()]);
  c.innerHTML=`
  <div class="velora-op-note"><b>Stage 11 — Trust & Safety.</b> Central operational view for disputes, returns, fraud signals, policy violations, and account enforcement. All sensitive mutations are backend RPCs and audited.</div>
  <div class="velora-ship-grid">
    <div class="velora-ship-card"><div class="kpi-value">${s.disputes}</div><div class="kpi-label">Disputes</div></div>
    <div class="velora-ship-card"><div class="kpi-value">${s.returns}</div><div class="kpi-label">Returns</div></div>
    <div class="velora-ship-card"><div class="kpi-value">${s.fraud}</div><div class="kpi-label">Fraud Events</div></div>
    <div class="velora-ship-card"><div class="kpi-value">${s.violations}</div><div class="kpi-label">Policy Violations</div></div>
  </div>
  <div class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">⚖️ Disputes</h3><div class="velora-op-muted">Customer vs store cases and operational resolutions.</div></div><input class="velora-op-search op-search" placeholder="Search disputes…" oninput="window.VELORA_FILTER_TABLE(this.value,'veloraDisputesTable')"></div>
    <div class="velora-op-table-wrap"><table class="velora-op-table" id="veloraDisputesTable"><thead><tr><th>Order</th><th>Reason</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>
      ${data.disputes.map(x=>`<tr><td><strong>#${esc11(x.order_id)}</strong></td><td>${esc11(x.reason)}</td><td><span class="velora-op-status ${cls11(x.status)}">${esc11(x.status)}</span></td><td>${new Date(x.created_at).toLocaleString()}</td><td><button onclick="window.VELORA_RESOLVE_DISPUTE('${x.id}','resolved')">✅ Resolve</button><button class="velora-op-danger" onclick="window.VELORA_RESOLVE_DISPUTE('${x.id}','rejected')">❌ Reject</button></td></tr>`).join('')||'<tr><td colspan="5" class="velora-op-muted" style="padding:2rem;text-align:center">No disputes.</td></tr>'}
    </tbody></table></div></div>

  <div class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">↩️ Returns</h3><div class="velora-op-muted">Return requests are operationally separated from payment settlement.</div></div><input class="velora-op-search op-search" placeholder="Search returns…" oninput="window.VELORA_FILTER_TABLE(this.value,'veloraReturnsTable')"></div>
    <div class="velora-op-table-wrap"><table class="velora-op-table" id="veloraReturnsTable"><thead><tr><th>Order</th><th>Reason</th><th>Refund</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead><tbody>
      ${data.returns.map(x=>`<tr><td><strong>#${esc11(x.order_id)}</strong></td><td>${esc11(x.reason)}</td><td>${money11(x.refund_amount,x.currency_code)}</td><td><span class="velora-op-status ${cls11(x.status)}">${esc11(x.status)}</span></td><td>${new Date(x.requested_at).toLocaleString()}</td><td><button onclick="window.VELORA_RESOLVE_RETURN('${x.id}','approved')">✅ Approve</button><button class="velora-op-danger" onclick="window.VELORA_RESOLVE_RETURN('${x.id}','rejected')">❌ Reject</button></td></tr>`).join('')||'<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No return requests.</td></tr>'}
    </tbody></table></div></div>

  <div class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🕵️ Fraud Risk</h3><div class="velora-op-muted">Review risk signals before taking account-level action.</div></div><input class="velora-op-search op-search" placeholder="Search fraud events…" oninput="window.VELORA_FILTER_TABLE(this.value,'veloraFraudTable')"></div>
    <div class="velora-op-table-wrap"><table class="velora-op-table" id="veloraFraudTable"><thead><tr><th>User/Order</th><th>Event</th><th>Risk</th><th>Severity</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${data.fraud.map(x=>`<tr><td><code>${esc11(x.user_id||'—')}</code><div class="velora-op-muted">Order: ${esc11(x.order_id||'—')}</div></td><td>${esc11(x.event_type)}</td><td><strong>${Number(x.risk_score||0).toFixed(0)}</strong>/100</td><td><span class="velora-op-status ${cls11(x.severity)}">${esc11(x.severity)}</span></td><td><span class="velora-op-status ${cls11(x.status)}">${esc11(x.status)}</span></td><td><button onclick="window.VELORA_REVIEW_FRAUD('${x.id}','reviewed')">👁️ Review</button>${x.user_id?`<button class="velora-op-danger" onclick="window.VELORA_ACCOUNT_ACTION('${x.user_id}','suspend')">🚫 Suspend</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No fraud events.</td></tr>'}
    </tbody></table></div></div>

  <div class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🚨 Policy Violations</h3><div class="velora-op-muted">Document misconduct and connect it to enforcement.</div></div><input class="velora-op-search op-search" placeholder="Search violations…" oninput="window.VELORA_FILTER_TABLE(this.value,'veloraViolationsTable')"></div>
    <div class="velora-op-table-wrap"><table class="velora-op-table" id="veloraViolationsTable"><thead><tr><th>Violation</th><th>Severity</th><th>Status</th><th>Description</th><th>Created</th><th>Actions</th></tr></thead><tbody>
      ${data.violations.map(x=>`<tr><td>${esc11(x.violation_type)}<div class="velora-op-muted">User: ${esc11(x.user_id||'—')} · Store: ${esc11(x.store_id||'—')}</div></td><td><span class="velora-op-status ${cls11(x.severity)}">${esc11(x.severity)}</span></td><td><span class="velora-op-status ${cls11(x.status)}">${esc11(x.status)}</span></td><td>${esc11(x.description||'')}</td><td>${new Date(x.created_at).toLocaleString()}</td><td>${x.user_id?`<button class="velora-op-danger" onclick="window.VELORA_ACCOUNT_ACTION('${x.user_id}','ban')">⛔ Ban User</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No policy violations.</td></tr>'}
    </tbody></table></div></div>

  <div class="admin-section-card"><h3>🔐 Enforcement Center</h3><div class="velora-op-note">Use account actions for documented moderation decisions. Permanent bans are represented by the blocked account state and an immutable action/audit record. Do not use frontend-only role changes.</div><div style="display:flex;gap:.75rem;flex-wrap:wrap"><button class="btn btn-outline" onclick="window.VELORA_MANUAL_ACCOUNT_ACTION()">🛡️ Account Action</button><button class="btn btn-outline" onclick="window.VELORA_MANUAL_VIOLATION()">🚨 Record Violation</button></div></div>`;
 }catch(e){c.innerHTML=`<div class="velora-op-note">❌ ${esc11(e.message||e)}</div>`}
}

async function manualAccountAction(){
 const uid=prompt('User UUID:','');if(!uid)return; const action=prompt('Action (warn/suspend/ban/restore/unban):','suspend');if(!action)return; const reason=prompt('Reason:','');if(reason===null)return; const dur=prompt('Duration in hours (blank = permanent):','');
 try{await accountAction(uid,action,reason,dur?Number(dur):null);showToast('✅ Account action recorded','success');await renderTrustSafety()}catch(e){toast11(e)}
}
async function manualViolation(){
 const uid=prompt('User UUID (optional):',''); const sid=prompt('Store UUID (optional):',''); const pid=prompt('Product UUID (optional):',''); const type=prompt('Violation type:','fraud'); if(!type)return; const sev=prompt('Severity (low/medium/high/critical):','high'); if(!sev)return; const desc=prompt('Description:',''); if(desc===null)return; const act=prompt('Action taken (optional):','');
 try{await createViolation({userId:uid||null,storeId:sid||null,productId:pid||null,type,severity:sev,description:desc,action:act||null});showToast('✅ Violation recorded','success');await renderTrustSafety()}catch(e){toast11(e)}
}
async function doDispute(id,status){const resolution=prompt('Resolution note (optional):','');if(resolution===null)return;try{await resolveDispute(id,status,resolution);showToast('✅ Dispute updated','success');await renderTrustSafety()}catch(e){toast11(e)}}
async function doReturn(id,status){const resolution=prompt('Resolution note (optional):','');if(resolution===null)return;try{await resolveReturn(id,status,resolution);showToast('✅ Return updated','success');await renderTrustSafety()}catch(e){toast11(e)}}
async function doFraud(id,status){const note=prompt('Review note (optional):','');if(note===null)return;try{await reviewFraud(id,status,note);showToast('✅ Fraud event reviewed','success');await renderTrustSafety()}catch(e){toast11(e)}}
async function doAccount(uid,action){const reason=prompt('Reason for '+action+':','');if(reason===null)return;let dur=null;if(action==='suspend'){const d=prompt('Suspension duration hours (blank = indefinite):','');if(d)dur=Number(d)}try{await accountAction(uid,action,reason,dur);showToast('✅ Account status updated','success');await renderTrustSafety()}catch(e){toast11(e)}}

window.VELORA_TRUST_SAFETY=renderTrustSafety;
window.VELORA_RESOLVE_DISPUTE=(id,status)=>doDispute(id,status);
window.VELORA_RESOLVE_RETURN=(id,status)=>doReturn(id,status);
window.VELORA_REVIEW_FRAUD=(id,status)=>doFraud(id,status);
window.VELORA_ACCOUNT_ACTION=doAccount;
window.VELORA_MANUAL_ACCOUNT_ACTION=manualAccountAction;
window.VELORA_MANUAL_VIOLATION=manualViolation;

/* Add Trust & Safety navigation to Admin */
function insertTrustNav(){
 const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-trust-nav]'))return;
 const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Trust & Safety</div><div class="admin-nav-item" data-velora-trust-nav="1"><span>🛡️</span><span>Trust & Safety</span></div>';
 section.querySelector('[data-velora-trust-nav]').onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('trust',section.querySelector('[data-velora-trust-nav]'));
 nav.appendChild(section);
}
const oldAdmin=window.VELORA_CANONICAL_ADMIN_SECTION;
window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){
 if(section==='trust'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Trust & Safety';return renderTrustSafety();}
 return oldAdmin?oldAdmin(section,btn):undefined;
};
const oldOpenAdmin=window.VELORA_OPEN_ADMIN;
window.VELORA_OPEN_ADMIN=async function(){const r=oldOpenAdmin?await oldOpenAdmin():undefined;setTimeout(insertTrustNav,120);return r};
setTimeout(insertTrustNav,700);
console.log('✅ Velora Stage 11 Trust & Safety Control Plane loaded');
})();
