(()=>{
'use strict';
const esc46=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rpc46=async(name,args)=>{if(!window.sb?.rpc)return {error:{message:'Supabase client unavailable'}};return await window.sb.rpc(name,args||{})};
function host46(){return document.getElementById('veloraTransactionLoop46')}
async function load46(orderId=null){
 const h=host46(); if(!h)return;
 h.innerHTML='<div class="velora-stage46"><div class="velora-stage46-card">Loading transaction loop…</div></div>';
 const r=await rpc46('velora_get_transaction_loop',orderId?{p_order_id:orderId}:{p_order_id:null});
 if(r.error){h.innerHTML='<div class="velora-stage46"><div class="velora-stage46-card"><strong>Transaction loop unavailable</strong><div class="velora-stage46-muted" style="margin-top:6px">'+esc46(r.error.message)+'</div></div></div>';return}
 const d=r.data||{},orders=Array.isArray(d.orders)?d.orders:[],messages=Array.isArray(d.messages)?d.messages:[],updates=Array.isArray(d.updates)?d.updates:[];
 h.innerHTML=`<div class="velora-stage46"><div class="velora-stage46-grid"><div class="velora-stage46-card"><div class="velora-stage46-muted">Transactions</div><div class="velora-stage46-big">${orders.length}</div></div><div class="velora-stage46-card"><div class="velora-stage46-muted">Messages</div><div class="velora-stage46-big">${messages.length}</div></div><div class="velora-stage46-card"><div class="velora-stage46-muted">Updates</div><div class="velora-stage46-big">${updates.length}</div></div><div class="velora-stage46-card"><div class="velora-stage46-muted">Governance</div><div class="velora-stage46-big">✓</div></div></div><div class="velora-stage46-card" style="margin-top:12px"><div class="velora-stage46-row"><div><strong>🤝 Seller ↔ Customer Transaction Loop</strong><div class="velora-stage46-muted">Shared order context with scoped visibility</div></div><span class="velora-stage46-pill">Identity-bound</span></div><div class="velora-stage46-list">${orders.map(o=>`<div class="velora-stage46-item"><div class="velora-stage46-row"><strong>${esc46(o.order_number||o.id)}</strong><span class="velora-stage46-pill">${esc46(o.status||'pending')}</span></div><div class="velora-stage46-muted" style="margin-top:5px">${esc46(o.currency||'')} ${esc46(o.total??'')}</div><div class="velora-stage46-actions"><button class="velora-stage46-btn" data46="view" data-id46="${esc46(o.id)}">View loop</button><button class="velora-stage46-btn" data46="message" data-id46="${esc46(o.id)}">Send message</button></div></div>`).join('')||'<div class="velora-stage46-muted">No eligible transactions found.</div>'}</div></div><div id="velora46Detail" class="velora-stage46-card" style="margin-top:12px"><strong>Transaction communication</strong><div class="velora-stage46-muted" style="margin-top:5px">Select an order to inspect its customer/seller communication context.</div></div></div>`;
 h.querySelectorAll('[data46]').forEach(b=>b.addEventListener('click',()=>action46(b.dataset.data46,b.dataset.id46)));
}
async function action46(action,id){
 const box=document.getElementById('velora46Detail'); if(!box)return;
 if(action==='message'){
  box.innerHTML='<strong>✉️ Send transaction message</strong><textarea id="velora46Msg" class="velora-stage46-text" maxlength="2000" placeholder="Write a customer-safe message..."></textarea><div class="velora-stage46-actions"><button id="velora46Send" class="velora-stage46-btn primary">Send</button></div>';
  document.getElementById('velora46Send').onclick=async()=>{const t=document.getElementById('velora46Msg').value.trim();if(!t)return;const r=await rpc46('velora_send_transaction_message',{p_order_id:id,p_message:t});if(r.error){alert(r.error.message||'Unable to send');return}box.innerHTML='<strong>Message sent</strong><div class="velora-stage46-muted" style="margin-top:5px">The message was recorded with actor identity and audit trail.</div>';setTimeout(()=>load46(id),350)};
  return;
 }
 const r=await rpc46('velora_get_transaction_loop',{p_order_id:id});
 if(r.error){box.innerHTML='<strong>Unable to load transaction</strong><div class="velora-stage46-muted" style="margin-top:5px">'+esc46(r.error.message)+'</div>';return}
 const d=r.data||{},msgs=Array.isArray(d.messages)?d.messages:[],ups=Array.isArray(d.updates)?d.updates:[];
 box.innerHTML='<strong>Transaction timeline</strong><div class="velora-stage46-list">'+[...ups.map(x=>`<div class="velora-stage46-item"><b>${esc46(x.title||x.update_type)}</b><div>${esc46(x.body||'')}</div><div class="velora-stage46-muted">${esc46(new Date(x.created_at).toLocaleString())}</div></div>`),...msgs.map(x=>`<div class="velora-stage46-item"><b>${esc46(x.actor_role)}</b><div>${esc46(x.message)}</div><div class="velora-stage46-muted">${esc46(new Date(x.created_at).toLocaleString())}</div></div>`)].join('')||'<div class="velora-stage46-muted">No communication recorded yet.</div>'+'</div>';
}
function install46(){if(host46())return;const target=document.getElementById('sellerDashboardPage')||document.querySelector('[data-page="seller"]')||document.getElementById('ordersPage')||document.querySelector('.customer-content')||document.body;const h=document.createElement('div');h.id='veloraTransactionLoop46';target.appendChild(h);setTimeout(()=>load46(),60)}
const p46=window.renderSellerDashboard;window.renderSellerDashboard=function(){const r=typeof p46==='function'?p46.apply(this,arguments):undefined;setTimeout(install46,20);return r};
const n46=window.navigateTo;window.navigateTo=function(page){const r=typeof n46==='function'?n46.apply(this,arguments):undefined;const s=String(page).toLowerCase();if(s.includes('seller')||s.includes('orders'))setTimeout(install46,120);return r};
setTimeout(install46,2200);console.log('✅ Velora Stage 46 Transaction Loop loaded');
})();
