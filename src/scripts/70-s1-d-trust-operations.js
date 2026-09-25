/* ============================================================
   VELORA — Trust & Compliance Operations Control Plane
   Admin/staging surface. Sensitive writes go through RPCs.
   ============================================================ */
(function(){
  'use strict';
  const db=window.mahaSupabase;
  if(!db||typeof db.rpc!=='function') return;

  function esc(v){
    const fn=window.escapeHtml;
    if(typeof fn==='function') return fn(String(v==null?'':v));
    return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function tone(v){
    v=String(v||'').toLowerCase();
    if(['completed','resolved','approved','received','refunded','verified','accepted'].includes(v)) return 'approved';
    if(['requested','reviewing','processing','in_review','open','in_transit'].includes(v)) return 'processing';
    if(['rejected','cancelled','failed'].includes(v)) return 'rejected';
    return 'pending';
  }

  async function load(){
    const [p,d,r,i]=await Promise.all([
      db.from('privacy_requests').select('id,user_id,request_type,status,reason,requested_at,completed_at,reviewed_by,reviewed_at,notes').order('requested_at',{ascending:false}).limit(100),
      db.from('disputes').select('id,order_id,customer_id,store_id,opened_by,reason,description,status,resolution,resolved_by,created_at,updated_at').order('created_at',{ascending:false}).limit(100),
      db.from('returns').select('id,order_id,customer_id,store_id,reason,description,status,refund_amount,currency_code,resolution_notes,refund_reference,refund_provider,refund_method,refund_processed_at,created_at,updated_at').order('created_at',{ascending:false}).limit(100),
      db.from('invoices').select('id,order_id,invoice_number,status,currency_code,subtotal,tax_total,shipping_total,discount_total,grand_total,issued_at,created_at').order('created_at',{ascending:false}).limit(100)
    ]);
    for(const x of [p,d,r,i]) if(x.error) throw x.error;
    return {privacy:p.data||[],disputes:d.data||[],returns:r.data||[],invoices:i.data||[]};
  }

  async function resolvePrivacy(id){
    const status=document.getElementById('trust_privacy_status_'+id)?.value;
    const notes=prompt('Privacy request notes (optional):')||null;
    const {error}=await db.rpc('velora_resolve_privacy_request',{p_request_id:id,p_status:status,p_notes:notes});
    if(error) throw error;
    if(window.showToast) window.showToast('✅ Privacy request updated','success');
    await render();
  }

  async function resolveDispute(id){
    const status=document.getElementById('trust_dispute_status_'+id)?.value;
    const resolution=prompt('Resolution evidence (required for terminal states):')||null;
    const {error}=await db.rpc('velora_resolve_dispute',{p_dispute_id:id,p_status:status,p_resolution:resolution});
    if(error) throw error;
    if(window.showToast) window.showToast('✅ Dispute updated','success');
    await render();
  }

  async function resolveReturn(id){
    const status=document.getElementById('trust_return_status_'+id)?.value;
    const resolution=prompt('Return resolution notes (optional):')||null;
    let reference=null,provider=null,method=null;
    if(status==='refunded'){
      reference=prompt('Refund reference (required):');
      if(!reference) throw new Error('REFUND_EVIDENCE_REQUIRED');
      provider=prompt('Refund provider (optional):')||null;
      method=prompt('Refund method (optional):')||null;
    }
    const {error}=await db.rpc('velora_resolve_return',{
      p_return_id:id,p_status:status,p_resolution:resolution,
      p_refund_reference:reference,p_refund_provider:provider,p_refund_method:method
    });
    if(error) throw error;
    if(window.showToast) window.showToast('✅ Return updated','success');
    await render();
  }

  function options(states,current){
    return states.map(s=>'<option value="'+esc(s)+'" '+(String(current)===s?'selected':'')+'>'+esc(s)+'</option>').join('');
  }

  function privacyCard(x){
    return '<article class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🔐 '+esc(x.request_type)+'</h3><div class="velora-op-muted">'+esc(x.user_id)+' · '+esc(x.requested_at)+'</div></div><span class="velora-op-status '+tone(x.status)+'">'+esc(x.status)+'</span></div>'+
      '<div class="velora-op-muted" style="margin:.6rem 0">'+esc(x.reason||'No reason supplied')+'</div>'+
      '<div class="velora-op-actions"><select class="form-select" id="trust_privacy_status_'+esc(x.id)+'">'+options(['requested','reviewing','approved','processing','completed','rejected','cancelled'],x.status)+'</select><button class="btn btn-primary" onclick="window.VELORA_TRUST_PRIVACY(\''+esc(x.id)+'\')">Save</button></div></article>';
  }
  function disputeCard(x){
    return '<article class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">⚖️ Dispute · '+esc(x.order_id)+'</h3><div class="velora-op-muted">'+esc(x.customer_id)+' · '+esc(x.reason)+'</div></div><span class="velora-op-status '+tone(x.status)+'">'+esc(x.status)+'</span></div>'+
      '<div class="velora-op-muted" style="margin:.6rem 0;white-space:pre-wrap">'+esc(x.description||'No description')+'</div>'+
      '<div class="velora-op-actions"><select class="form-select" id="trust_dispute_status_'+esc(x.id)+'">'+options(['open','in_review','resolved','rejected','closed'],x.status)+'</select><button class="btn btn-primary" onclick="window.VELORA_TRUST_DISPUTE(\''+esc(x.id)+'\')">Save</button></div>'+
      (x.resolution?'<div class="velora-op-note" style="margin-top:.6rem"><b>Resolution:</b> '+esc(x.resolution)+'</div>':'')+
      '</article>';
  }
  function returnCard(x){
    return '<article class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">↩️ Return · '+esc(x.order_id)+'</h3><div class="velora-op-muted">'+esc(x.reason)+' · '+esc(x.refund_amount)+' '+esc(x.currency_code)+'</div></div><span class="velora-op-status '+tone(x.status)+'">'+esc(x.status)+'</span></div>'+
      '<div class="velora-op-actions"><select class="form-select" id="trust_return_status_'+esc(x.id)+'">'+options(['requested','approved','rejected','in_transit','received','refunded','cancelled'],x.status)+'</select><button class="btn btn-primary" onclick="window.VELORA_TRUST_RETURN(\''+esc(x.id)+'\')">Save</button></div>'+
      (x.refund_reference?'<div class="velora-op-note" style="margin-top:.6rem"><b>Refund:</b> '+esc(x.refund_reference)+' · '+esc(x.refund_provider||'')+' · '+esc(x.refund_method||'')+'</div>':'')+
      '</article>';
  }
  function invoiceCard(x){
    return '<article class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🧾 '+esc(x.invoice_number)+'</h3><div class="velora-op-muted">Order '+esc(x.order_id)+'</div></div><span class="velora-op-status '+tone(x.status)+'">'+esc(x.status)+'</span></div>'+
      '<div class="velora-op-grid" style="margin-top:.7rem"><div class="velora-op-kpi"><div class="kpi-value">'+esc(x.subtotal)+'</div><div class="kpi-label">Subtotal</div></div><div class="velora-op-kpi"><div class="kpi-value">'+esc(x.tax_total)+'</div><div class="kpi-label">Tax (accounting input)</div></div><div class="velora-op-kpi"><div class="kpi-value">'+esc(x.shipping_total)+'</div><div class="kpi-label">Shipping</div></div><div class="velora-op-kpi"><div class="kpi-value">'+esc(x.grand_total)+'</div><div class="kpi-label">Grand Total</div></div></div>'+
      '<div class="velora-op-note" style="margin-top:.7rem">No tax rate is inferred here. Invoice preparation only reconciles stored components to the canonical order.</div></article>';
  }

  async function render(){
    const root=document.getElementById('adminContent'); if(!root) return;
    try{
      const x=await load();
      root.innerHTML='<div class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🛡️ Trust & Compliance Operations</h3><div class="velora-op-muted">Privacy, disputes, returns/refunds and invoice evidence. Sensitive mutations remain RPC-governed.</div></div><button class="btn btn-outline" onclick="window.VELORA_RENDER_TRUST()">↻ Refresh</button></div></div>'+
        '<div class="admin-section-card"><h3>🔐 Privacy Requests ('+x.privacy.length+')</h3>'+(x.privacy.length?x.privacy.map(privacyCard).join(''):'<div class="velora-op-muted">No privacy requests.</div>')+'</div>'+
        '<div class="admin-section-card"><h3>⚖️ Disputes ('+x.disputes.length+')</h3>'+(x.disputes.length?x.disputes.map(disputeCard).join(''):'<div class="velora-op-muted">No disputes.</div>')+'</div>'+
        '<div class="admin-section-card"><h3>↩️ Returns / Refund Evidence ('+x.returns.length+')</h3>'+(x.returns.length?x.returns.map(returnCard).join(''):'<div class="velora-op-muted">No returns.</div>')+'</div>'+
        '<div class="admin-section-card"><h3>🧾 Invoices ('+x.invoices.length+')</h3>'+(x.invoices.length?x.invoices.map(invoiceCard).join(''):'<div class="velora-op-muted">No invoice records.</div>')+'</div>';
    }catch(e){
      root.innerHTML='<div class="velora-op-card"><b>Trust operations failed.</b><div class="velora-op-muted">'+esc(e?.message||e)+'</div></div>';
      console.error(e);
    }
  }

  window.VELORA_RENDER_TRUST=render;
  window.VELORA_TRUST_PRIVACY=function(id){resolvePrivacy(id).catch(function(e){if(window.showToast)window.showToast('❌ '+String(e?.message||e),'error');});};
  window.VELORA_TRUST_DISPUTE=function(id){resolveDispute(id).catch(function(e){if(window.showToast)window.showToast('❌ '+String(e?.message||e),'error');});};
  window.VELORA_TRUST_RETURN=function(id){resolveReturn(id).catch(function(e){if(window.showToast)window.showToast('❌ '+String(e?.message||e),'error');});};

  console.log('✅ Velora Trust & Compliance control plane loaded');
})();
