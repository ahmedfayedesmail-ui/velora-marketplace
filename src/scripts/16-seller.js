/* ============================================================
   VELORA STAGE 12 — ANALYTICS + INTELLIGENCE
   Canonical metrics from Supabase; no fabricated production numbers.
   ============================================================ */
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=(n,c)=>{try{return new Intl.NumberFormat(undefined,{style:'currency',currency:c||'USD',maximumFractionDigits:2}).format(Number(n||0))}catch(_){return `${Number(n||0).toFixed(2)} ${c||''}`}};
const fmtPct=n=>`${Number(n||0).toFixed(1)}%`;
const daysBack=d=>Math.max(1,Math.min(365,Number(d)||30));
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data||{};}
async function adminAnalytics(days){return rpc('velora_get_admin_analytics',{p_days:daysBack(days)})}
async function sellerAnalytics(days){return rpc('velora_get_seller_analytics',{p_days:daysBack(days)})}
function bars(series){const arr=Array.isArray(series)?series:[];if(!arr.length)return '<div class="velora-op-muted" style="padding:2rem 0;text-align:center">No activity in this period.</div>';const vals=arr.map(x=>Number(x.value||0));const max=Math.max(...vals,1);return `<div class="velora-analytics-bars">${arr.map(x=>`<div class="velora-analytics-bar" style="height:${Math.max(4,(Number(x.value||0)/max)*100)}%"><span>${Number(x.value||0).toLocaleString()}</span></div>`).join('')}</div><div class="velora-analytics-axis"><span>${esc(arr[0].label||'')}</span><span>${esc(arr[Math.floor(arr.length/2)]?.label||'')}</span><span>${esc(arr[arr.length-1].label||'')}</span></div>`}
function table(rows,headers,cells){return `<div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${(rows||[]).map(r=>`<tr>${cells(r)}</tr>`).join('')||`<tr><td colspan="${headers.length}" class="velora-op-muted" style="padding:1.5rem;text-align:center">No data.</td></tr>`}</tbody></table></div>`}
async function renderAnalytics(role='admin',days=30){
 const c=document.getElementById('adminContent');if(!c)return;
 c.innerHTML='<div class="velora-pay-note">⏳ Loading canonical analytics…</div>';
 try{
  const data=role==='seller'?await sellerAnalytics(days):await adminAnalytics(days);
  const s=data.summary||{}; const cur=s.currency||'USD';
  if(role==='seller'){
   c.innerHTML=`<div class="velora-analytics-toolbar"><div><b>Stage 12 — Seller Analytics</b><div class="velora-op-muted">Canonical sales, fulfillment, inventory and earnings signals.</div></div><label>Period <select onchange="window.VELORA_RENDER_ANALYTICS('seller',this.value)"><option value="7" ${days===7?'selected':''}>7 days</option><option value="30" ${days===30?'selected':''}>30 days</option><option value="90" ${days===90?'selected':''}>90 days</option></select></label></div>
   <div class="velora-analytics-grid">
    <div class="velora-analytics-kpi"><div>GMV</div><div class="value">${money(s.gmv,cur)}</div><div class="delta">Seller gross merchandise value</div></div>
    <div class="velora-analytics-kpi"><div>Net Earnings</div><div class="value">${money(s.net_earnings, s.seller_currency||cur)}</div><div class="delta">After recorded commissions</div></div>
    <div class="velora-analytics-kpi"><div>Orders</div><div class="value">${Number(s.orders||0).toLocaleString()}</div><div class="delta">Orders containing your products</div></div>
    <div class="velora-analytics-kpi"><div>Units Sold</div><div class="value">${Number(s.units_sold||0).toLocaleString()}</div><div class="delta">Across the selected period</div></div>
    <div class="velora-analytics-kpi"><div>Average Order Value</div><div class="value">${money(s.aov,cur)}</div><div class="delta">Order-level average</div></div>
    <div class="velora-analytics-kpi"><div>On-time Delivery</div><div class="value">${fmtPct(s.on_time_delivery_pct)}</div><div class="delta">Based on delivered shipments with ETA</div></div>
   </div>
   <div class="velora-analytics-two">
    <div class="velora-analytics-card"><h3>📈 Sales Trend</h3>${bars(data.sales_series)}</div>
    <div class="velora-analytics-card"><h3>🚚 Fulfillment Health</h3><div class="velora-analytics-health"><b>${Number(s.shipped_orders||0)}</b> shipped · <b>${Number(s.delivered_orders||0)}</b> delivered · <b>${Number(s.cancelled_orders||0)}</b> cancelled</div><div class="velora-analytics-health"><b>${Number(s.low_stock_products||0)}</b> products at or below low-stock threshold</div></div>
   </div>
   <div class="velora-analytics-card" style="margin-top:1rem"><h3>🏆 Top Products</h3>${table(data.top_products||[],['Product','Units','GMV','Orders'],r=>`<td>${esc(r.name)}</td><td>${Number(r.units||0).toLocaleString()}</td><td>${money(r.gmv,r.currency||cur)}</td><td>${Number(r.orders||0).toLocaleString()}</td>`)}</div>`;
  }else{
   const risk=data.risk||{};
   c.innerHTML=`<div class="velora-analytics-toolbar"><div><b>Stage 12 — Marketplace Analytics</b><div class="velora-op-muted">Canonical marketplace intelligence from orders, payouts, fulfillment and Trust & Safety records.</div></div><label>Period <select onchange="window.VELORA_RENDER_ANALYTICS('admin',this.value)"><option value="7" ${days===7?'selected':''}>7 days</option><option value="30" ${days===30?'selected':''}>30 days</option><option value="90" ${days===90?'selected':''}>90 days</option></select></label></div>
   <div class="velora-analytics-grid">
    <div class="velora-analytics-kpi"><div>GMV</div><div class="value">${money(s.gmv,cur)}</div><div class="delta">Gross marketplace value</div></div>
    <div class="velora-analytics-kpi"><div>Paid GMV</div><div class="value">${money(s.paid_gmv,cur)}</div><div class="delta">Orders with paid status</div></div>
    <div class="velora-analytics-kpi"><div>Orders</div><div class="value">${Number(s.orders||0).toLocaleString()}</div><div class="delta">All canonical orders in period</div></div>
    <div class="velora-analytics-kpi"><div>AOV</div><div class="value">${money(s.aov,cur)}</div><div class="delta">Average order value</div></div>
    <div class="velora-analytics-kpi"><div>Delivered</div><div class="value">${Number(s.delivered_orders||0).toLocaleString()}</div><div class="delta">Successfully delivered orders</div></div>
    <div class="velora-analytics-kpi"><div>Cancellation Rate</div><div class="value">${fmtPct(s.cancellation_rate_pct)}</div><div class="delta">Cancelled / total orders</div></div>
    <div class="velora-analytics-kpi"><div>Return Rate</div><div class="value">${fmtPct(s.return_rate_pct)}</div><div class="delta">Orders with a return request</div></div>
    <div class="velora-analytics-kpi"><div>Fraud Risk Events</div><div class="value">${Number(risk.events||0).toLocaleString()}</div><div class="delta">Recorded Trust & Safety signals</div></div>
   </div>
   <div class="velora-analytics-two">
    <div class="velora-analytics-card"><h3>📈 GMV Trend</h3>${bars(data.gmv_series)}</div>
    <div class="velora-analytics-card"><h3>🛡️ Risk & Operations</h3><div class="velora-analytics-health"><b>${Number(risk.high_severity||0)}</b> high/critical risk events · <b>${Number(risk.open_disputes||0)}</b> open disputes</div><div class="velora-analytics-health"><b>${Number(s.active_sellers||0)}</b> active sellers · <b>${Number(s.active_products||0)}</b> active products</div><div class="velora-analytics-health"><b>${fmtPct(s.on_time_delivery_pct)}</b> on-time delivery · <b>${fmtPct(s.paid_conversion_pct)}</b> paid-order rate</div></div>
   </div>
   <div class="velora-analytics-card" style="margin-top:1rem"><h3>🏪 Top Sellers</h3>${table(data.top_sellers||[],['Seller','Orders','GMV','Units'],r=>`<td>${esc(r.store_name||r.seller_name||'Seller')}</td><td>${Number(r.orders||0).toLocaleString()}</td><td>${money(r.gmv,r.currency||cur)}</td><td>${Number(r.units||0).toLocaleString()}</td>`)}</div>
   <div class="velora-analytics-card" style="margin-top:1rem"><h3>📦 Top Products</h3>${table(data.top_products||[],['Product','Seller','Units','GMV'],r=>`<td>${esc(r.name)}</td><td>${esc(r.store_name||'—')}</td><td>${Number(r.units||0).toLocaleString()}</td><td>${money(r.gmv,r.currency||cur)}</td>`)}</div>`;
  }
 }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ Analytics unavailable: ${esc(e.message||e)}</div>`}
}
function addAnalyticsNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-analytics-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Intelligence</div><div class="admin-nav-item" data-velora-analytics-nav="1"><span>📊</span><span>Analytics</span></div>';section.querySelector('[data-velora-analytics-nav]').onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('analytics',section.querySelector('[data-velora-analytics-nav]'));nav.appendChild(section)}
window.VELORA_RENDER_ANALYTICS=(role,days)=>renderAnalytics(role||'admin',days||30);
const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='analytics'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Analytics';return renderAnalytics('admin',30)}return prev?prev(section,btn):undefined};
const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addAnalyticsNav,120);return r};
setTimeout(addAnalyticsNav,800);
console.log('✅ Velora Stage 12 Analytics + Intelligence Control Plane loaded');
})();
