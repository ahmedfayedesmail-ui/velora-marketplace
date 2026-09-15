/* ============================================================
   VELORA STAGE 10 — SHIPPING / TRACKING / DELIVERY PROOF
   ============================================================ */
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const cls=s=>String(s||'').toLowerCase().replace(/[^a-z0-9_-]/g,'');
const money=(n,c)=>{try{return new Intl.NumberFormat(undefined,{style:'currency',currency:c||'USD'}).format(Number(n||0))}catch(_){return `${Number(n||0).toFixed(2)} ${c||''}`}};
const shipStatuses=['pending','label_created','preparing','shipped','in_transit','delivered','failed','returned','cancelled'];
async function authUser(){const {data,error}=await db.auth.getUser();if(error)throw error;if(!data?.user)throw new Error('Please login first');return data.user}
async function operationalShipments(storeId=null){const {data,error}=await db.rpc('velora_get_operational_shipments',{p_store_id:storeId});if(error)throw error;return data||[]}
async function activeCarriers(){const {data,error}=await db.from('shipping_carriers').select('code,name,tracking_url_template,is_active').eq('is_active',true).order('name');if(error)throw error;return data||[]}
async function shipmentProofsForOrder(orderId){const {data,error}=await db.rpc('velora_get_customer_delivery_proofs',{p_order_id:orderId});if(error)throw error;return data||[]}
async function createShipment(orderId,itemIds,carrierCode,serviceName,trackingNumber,trackingUrl,estimatedDelivery){
 const {data,error}=await db.rpc('velora_create_shipment',{p_order_id:orderId,p_order_item_ids:itemIds,p_carrier_code:carrierCode||null,p_service_name:serviceName||null,p_tracking_number:trackingNumber||null,p_tracking_url:trackingUrl||null,p_estimated_delivery_at:estimatedDelivery||null});
 if(error)throw error;return data;
}
async function createShipmentForSeller(){
 const s=window.VELORA_CANONICAL_SELLER; if(!s) throw new Error('Seller session unavailable');
 const store=window.VELORA_CANONICAL_STORE; if(!store?.id) throw new Error('Store unavailable');
 const {data:rows,error:oe}=await db.rpc('velora_get_seller_orders',{p_seller_id:s.id}); if(oe)throw oe;
 const orders=[...new Map((rows||[]).map(r=>[String(r.order_id),r])).values()];
 if(!orders.length){showToast('ℹ️ No seller order is ready for shipment','info');return;}
 const list=orders.slice(0,20).map(r=>`${r.order_number||r.order_id} — ${r.customer_name||'Customer'} — ${r.order_status||'pending'}`).join('\n');
 const ref=prompt('Enter Order # or Order ID to ship:\n\n'+list, String(orders[0].order_number||orders[0].order_id)); if(ref===null)return;
 const order=orders.find(r=>String(r.order_number)===String(ref)||String(r.order_id)===String(ref)); if(!order){showToast('❌ Order not found in your seller orders','error');return;}
 const {data:itemRows,error:ie}=await db.from('order_items').select('id,quantity,status').eq('order_id',order.order_id).eq('store_id',store.id); if(ie)throw ie;
 const eligible=(itemRows||[]).filter(x=>['confirmed','processing','shipped'].includes(String(x.status))); if(!eligible.length){showToast('⚠️ No shippable items found for this order','warning');return;}
 const carrier=prompt('Carrier code:',(await activeCarriers())[0]?.code||''); if(carrier===null)return;
 const service=prompt('Service name:','Standard'); if(service===null)return;
 const tracking=prompt('Tracking number (optional):',''); if(tracking===null)return;
 const url=prompt('Tracking URL (optional):',''); if(url===null)return;
 const eta=prompt('Estimated delivery date/time ISO (optional):',''); if(eta===null)return;
 await createShipment(order.order_id,eligible.map(x=>x.id),carrier,service,tracking,url,eta||null);
 showToast('✅ Shipment created','success'); await sellerShippingSection();
}

async function updateShipment(id,status,trackingNumber,trackingUrl,carrierCode,serviceName){
 const {data,error}=await db.rpc('velora_update_shipment_status',{p_shipment_id:id,p_status:status,p_tracking_number:trackingNumber||null,p_tracking_url:trackingUrl||null,p_carrier_code:carrierCode||null,p_service_name:serviceName||null});
 if(error)throw error;return data;
}
async function addProof(shipmentId,url,recipient,notes){
 const {data,error}=await db.rpc('velora_submit_delivery_proof',{p_shipment_id:shipmentId,p_proof_type:'photo',p_proof_url:url||null,p_delivered_to:recipient||null,p_metadata:{source:'velora_stage10',notes:notes||''},p_latitude:null,p_longitude:null,p_proof_hash:null});
 if(error)throw error;return data;
}
function shipmentRow(s,carriers){
 const carrier=carriers.find(c=>c.code===s.carrier_code);
 const tracking=s.tracking_number?`<div><b>Tracking:</b> ${esc(s.tracking_number)}</div>`:'';
 const link=s.tracking_url?`<a class="velora-track-link" href="${esc(s.tracking_url)}" target="_blank" rel="noopener">Open tracking ↗</a>`:(carrier?.tracking_url_template&&s.tracking_number?`<a class="velora-track-link" href="${esc(carrier.tracking_url_template.replace('{tracking_number}',s.tracking_number))}" target="_blank" rel="noopener">Open tracking ↗</a>`:'');
 const eta=s.estimated_delivery_at?new Date(s.estimated_delivery_at).toLocaleDateString():'—';
 return `<tr><td><strong>#${esc(s.order_id)}</strong></td><td>${esc(s.carrier_code||'—')}<div class="velora-op-muted">${esc(s.service_name||'')}</div></td><td>${tracking||'—'} ${link}</td><td>${esc(eta)}</td><td><span class="velora-op-status ${cls(s.status)}">${esc(s.status)}</span></td><td><div class="velora-ship-actions"><button onclick="window.VELORA_SHIPMENT_UPDATE('${s.id}','${esc(s.status)}','${esc(s.tracking_number||'')}','${esc(s.tracking_url||'')}','${esc(s.carrier_code||'')}','${esc(s.service_name||'')}')">✏️ Update</button><button onclick="window.VELORA_SHIPMENT_PROOF('${s.id}')">📸 Proof</button></div></td></tr>`;
}
async function renderShipping(sectionTarget,isStaff=false,storeId=null){
 const c=document.getElementById(sectionTarget);if(!c)return;
 c.innerHTML='<div class="velora-op-note">⏳ Loading shipping control plane…</div>';
 try{
  const [ships,carriers]=await Promise.all([operationalShipments(storeId),activeCarriers()]);
  const delivered=ships.filter(s=>s.status==='delivered').length, inTransit=ships.filter(s=>['shipped','in_transit'].includes(s.status)).length, pending=ships.filter(s=>['pending','label_created','preparing'].includes(s.status)).length;
  c.innerHTML=`<div class="velora-op-note"><b>Stage 10 — Shipping + Tracking + Delivery Proof.</b> Shipping records are canonical in Supabase. Carrier APIs remain provider-specific; manual tracking is supported now.</div>
  <div class="velora-ship-grid"><div class="velora-ship-card"><div class="kpi-value">${ships.length}</div><div class="kpi-label">Shipments</div></div><div class="velora-ship-card"><div class="kpi-value">${pending}</div><div class="kpi-label">Preparing</div></div><div class="velora-ship-card"><div class="kpi-value">${inTransit}</div><div class="kpi-label">In Transit</div></div><div class="velora-ship-card"><div class="kpi-value">${delivered}</div><div class="kpi-label">Delivered</div></div><div class="velora-ship-card"><div class="kpi-value">${carriers.length}</div><div class="kpi-label">Active Carriers</div></div></div>
  <div class="admin-section-card"><div class="velora-ship-toolbar"><div><h3 style="margin:0">🚚 Shipment Operations</h3><div class="velora-op-muted">${isStaff?'Admin/Owner visibility across marketplace stores.':'Only shipments for your store.'}</div></div>${isStaff?'':'<button class="btn btn-primary" onclick="window.VELORA_CREATE_SHIPMENT()">➕ Create Shipment</button>'}</div>
  <div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Order</th><th>Carrier</th><th>Tracking</th><th>ETA</th><th>Status</th><th>Actions</th></tr></thead><tbody>${ships.map(s=>shipmentRow(s,carriers)).join('')||'<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No shipments yet.</td></tr>'}</tbody></table></div></div>
  <div class="admin-section-card"><h3>🔗 Carrier Configuration</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Carrier</th><th>Code</th><th>Tracking template</th><th>Status</th></tr></thead><tbody>${carriers.map(x=>`<tr><td>${esc(x.name)}</td><td><code>${esc(x.code)}</code></td><td>${esc(x.tracking_url_template||'Manual tracking')}</td><td><span class="velora-op-status approved">active</span></td></tr>`).join('')||'<tr><td colspan="4">No active carriers configured.</td></tr>'}</tbody></table></div></div>`;
 }catch(e){c.innerHTML=`<div class="velora-op-note">❌ ${esc(e.message||e)}</div>`}
}
async function sellerShippingSection(){
 const s=window.VELORA_CANONICAL_SELLER; if(!s) throw new Error('Seller session unavailable');
 let store=window.VELORA_CANONICAL_STORE;
 if(!store){const {data,error}=await db.from('stores').select('id,name,slug,status,currency_code').eq('owner_id',s.user_id).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;store=data;window.VELORA_CANONICAL_STORE=store;}
 await renderShipping('sellerContent',false,store?.id||null);
}
async function adminShippingSection(){await renderShipping('adminContent',true,null)}
async function updateShipment(id,currentStatus,currentTracking,currentUrl,currentCarrier,currentService){
 const status=prompt('New shipment status:\n'+shipStatuses.join(', '),currentStatus||'in_transit');if(status===null)return;
 const valid=shipStatuses.includes(String(status).toLowerCase());if(!valid){showToast('❌ Invalid shipment status','error');return}
 const tracking=prompt('Tracking number:',currentTracking||'');if(tracking===null)return;
 const url=prompt('Tracking URL (optional):',currentUrl||'');if(url===null)return;
 const carrier=prompt('Carrier code (optional):',currentCarrier||'');if(carrier===null)return;
 const service=prompt('Service name (optional):',currentService||'');if(service===null)return;
 try{await updateShipment(id,String(status).toLowerCase(),tracking,url,carrier,service);showToast('✅ Shipment updated','success');if(document.getElementById('adminContent')?.innerText.includes('Shipping')||document.getElementById('adminContent')){if(document.getElementById('adminPlatform')?.classList.contains('active'))await adminShippingSection();}if(document.getElementById('sellerPlatform')?.classList.contains('active'))await sellerShippingSection()}catch(e){toastErr(e)}
}
async function shipmentProof(id){
 const url=prompt('Delivery proof photo URL (https://…):','');if(url===null)return;
 const recipient=prompt('Delivered to (name/recipient):','');if(recipient===null)return;
 const notes=prompt('Optional notes:','')||'';
 try{await addProof(id,url,recipient,notes);showToast('✅ Delivery proof saved and shipment marked delivered','success');if(document.getElementById('adminPlatform')?.classList.contains('active'))await adminShippingSection();if(document.getElementById('sellerPlatform')?.classList.contains('active'))await sellerShippingSection()}catch(e){toastErr(e)}
}
async function insertSellerNav(){const nav=document.querySelector('#sellerPlatform .seller-nav');if(!nav||nav.querySelector('[data-velora-shipping-nav]'))return;const item=document.createElement('div');item.className='seller-nav-item';item.dataset.veloraShippingNav='1';item.dataset.section='shipping';item.innerHTML='<span>🚚</span><span>Shipping</span>';item.onclick=()=>window.VELORA_CANONICAL_SELLER_SECTION('shipping',item);const settings=nav.querySelector('[data-section="settings"]');settings?settings.before(item):nav.appendChild(item)}
async function insertAdminNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-shipping-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Fulfillment</div><div class="admin-nav-item" data-velora-shipping-nav="1" onclick="window.VELORA_CANONICAL_ADMIN_SECTION(\'shipping\',this)"><span>🚚</span><span>Shipping</span></div>';nav.appendChild(section)}
/* Extend seller controller */
const prevSeller=window.VELORA_CANONICAL_SELLER_SECTION;
window.VELORA_CANONICAL_SELLER_SECTION=async function(section,btn){if(section==='shipping')return sellerShippingSection();const r=prevSeller?await prevSeller(section,btn):undefined;setTimeout(insertSellerNav,50);return r};
const prevOpenSeller=window.VELORA_OPEN_SELLER;
window.VELORA_OPEN_SELLER=async function(){const r=prevOpenSeller?await prevOpenSeller():undefined;setTimeout(insertSellerNav,80);return r};
/* Extend admin controller */
const prevAdmin=window.VELORA_CANONICAL_ADMIN_SECTION;
window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='shipping'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Shipping';return adminShippingSection()}return prevAdmin?prevAdmin(section,btn):undefined};
const prevOpenAdmin=window.VELORA_OPEN_ADMIN;
window.VELORA_OPEN_ADMIN=async function(){const r=prevOpenAdmin?await prevOpenAdmin():undefined;setTimeout(insertAdminNav,100);return r};
window.VELORA_CREATE_SHIPMENT=createShipmentForSeller;window.VELORA_SHIPMENT_UPDATE=updateShipment;window.VELORA_SHIPMENT_PROOF=shipmentProof;
/* Customer delivery proof presentation */
const prevOrders=window.renderOrdersPage;
window.renderOrdersPage=async function(){const r=prevOrders?await prevOrders.apply(this,arguments):undefined;setTimeout(async()=>{try{const orders=await window.veloraLoadCustomerOrders?.()||[];const proofsByOrder=new Map();for(const o of orders){const proofs=await shipmentProofsForOrder(o.id);if(proofs.length)proofsByOrder.set(String(o.order_number),proofs)}const cards=[...document.querySelectorAll('#ordersContent .form-section')];for(const card of cards){const m=(card.innerText||'').match(/Order #([0-9]+)/);if(!m)continue;const proofs=proofsByOrder.get(m[1]);if(!proofs||!proofs.length)continue;const holder=document.createElement('div');holder.className='velora-proof';holder.innerHTML='<strong>📸 Delivery Proof</strong>'+proofs.map(p=>`<div style="margin-top:.4rem"><div>${p.recipient_name?`Delivered to <b>${esc(p.recipient_name)}</b>`:'Delivery confirmed'}</div>${p.photo_url?`<a href="${esc(p.photo_url)}" target="_blank" rel="noopener"><img src="${esc(p.photo_url)}" alt="Delivery proof"></a>`:''}<div class="velora-op-muted">${new Date(p.delivered_at||p.created_at).toLocaleString()}</div></div>`).join('');card.appendChild(holder)}}catch(e){console.warn('Stage10 customer proof render',e)}},250);return r};
setTimeout(insertAdminNav,500);setTimeout(insertSellerNav,500);
console.log('✅ Velora Stage 10 Shipping + Tracking + Delivery Proof loaded');
})();
