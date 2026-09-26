/* ============================================================
   VELORA S2-D — ADMIN DASHBOARD
   ------------------------------------------------------------
   Read-only operational overview backed by a staff-gated
   Supabase RPC. Existing admin sections remain intact.
   ============================================================ */
(function(){
  'use strict';

  var client=window.mahaSupabase;
  if(!client || !client.rpc) return;

  var originalShow=window.showAdminSection;
  var originalOpen=window.openAdminPlatform;

  function adminLabel(){
    return String(document.documentElement.lang||'').toLowerCase()==='ar'
      ? '⚙️ لوحة الإدارة'
      : '⚙️ Admin Dashboard';
  }

  function removeAdminNavEntries(){
    document.querySelectorAll('[data-velora-admin-entry]').forEach(function(el){
      el.closest('li')?.remove();
    });
  }

  function ensureAdminNavEntry(){
    try{
      var navLists=document.querySelectorAll('.main-nav ul, .mobile-menu-list');
      navLists.forEach(function(ul){
        if(ul.querySelector('[data-velora-admin-entry]')) return;
        var li=document.createElement('li');
        var a=document.createElement('a');
        a.href='#';
        a.setAttribute('data-velora-admin-entry','true');
        a.textContent=adminLabel();
        a.setAttribute('aria-label',adminLabel());
        a.onclick=function(){
          if(typeof window.openAdminPlatform==='function') window.openAdminPlatform();
          return false;
        };
        li.appendChild(a);
        ul.appendChild(li);
      });
    }catch(_){}
  }

  async function syncAdminNav(){
    try{
      var session=await client.auth.getUser();
      var user=session?.data?.user;
      if(!user){
        removeAdminNavEntries();
        return;
      }
      var result=await client.from('user_roles').select('role').eq('user_id',user.id);
      if(result?.error){
        removeAdminNavEntries();
        return;
      }
      var roles=(result.data||[]).map(function(x){return String(x.role||'').toLowerCase();});
      if(roles.includes('admin')||roles.includes('owner')) ensureAdminNavEntry();
      else removeAdminNavEntries();
    }catch(_){
      removeAdminNavEntries();
    }
  }


  function esc(v){
    if(typeof escapeHtml==='function') return escapeHtml(String(v==null?'':v));
    return String(v==null?'':v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function money(value,currency){
    var n=Number(value||0), code=String(currency||'').toUpperCase();
    if(!Number.isFinite(n)) return '—';
    try{
      return new Intl.NumberFormat(undefined,{
        style:'currency',currency:code||'USD',maximumFractionDigits:2
      }).format(n);
    }catch(_){
      return code+' '+n.toFixed(2);
    }
  }

  function count(v){
    var n=Number(v||0);
    return Number.isFinite(n)?n.toLocaleString():'—';
  }

  function setActiveDashboardNav(btn){
    document.querySelectorAll('.admin-nav-item').forEach(function(item){
      item.classList.toggle('active',item===btn || (!btn && item.dataset.section==='dashboard'));
    });
    var title=document.getElementById('adminHeaderTitle');
    if(title) title.textContent='Dashboard';
  }

  function statusClass(value){
    value=String(value||'').toLowerCase();
    if(['delivered','approved','paid','captured','published','completed'].indexOf(value)>=0) return 'v56-ok';
    if(['pending','confirmed','processing','shipped'].indexOf(value)>=0) return 'v56-warn';
    if(['failed','rejected','cancelled','refunded','suspended'].indexOf(value)>=0) return 'v56-risk';
    return 'v56-muted-pill';
  }

  function renderError(message){
    var c=document.getElementById('adminContent');
    if(!c) return;
    c.innerHTML='<div class="v56-card"><div class="v56-head"><div><h2>Admin Dashboard</h2><div class="v56-muted">Operational overview</div></div></div><div class="v56-error">⚠️ '+esc(message||'Dashboard unavailable.')+'</div></div>';
  }

  function renderLoading(){
    var c=document.getElementById('adminContent');
    if(!c) return;
    c.innerHTML='<div class="v56-card"><div class="v56-loading">⏳ Loading authoritative dashboard…</div></div>';
  }

  async function renderDashboard(){
    var c=document.getElementById('adminContent');
    if(!c) return;

    renderLoading();
    try{
      var r=await client.rpc('velora_get_admin_dashboard');
      if(r.error) throw r.error;
      var d=r.data||{}, u=d.users||{}, s=d.sellers||{}, p=d.products||{}, o=d.orders||{},
          pay=d.payments||{}, po=d.payouts||{}, rev=d.reviews||{},
          sec=d.security||{}, attention=d.attention||{};
      var values=d.order_value_by_currency||{};
      var recent=Array.isArray(d.recent_orders)?d.recent_orders:[];
      var audit=Array.isArray(d.recent_audit_logs)?d.recent_audit_logs:[];

      var kpis=[
        ['👥','Customers',u.customers],
        ['🏪','Sellers',s.total],
        ['📦','Products',p.total],
        ['🛒','Orders',o.total],
        ['⭐','Pending Reviews',rev.pending],
        ['🛡️','Active Account Actions',sec.active_account_actions]
      ];

      var attentionRows=[
        ['Pending sellers',attention.pending_sellers,'sellers'],
        ['Pending products',attention.pending_products,'products'],
        ['Pending reviews',attention.pending_reviews,null],
        ['Failed payments',attention.failed_payments,null],
        ['Pending payouts',attention.pending_payouts,null]
      ];

      var valueKeys=Object.keys(values).sort();

      c.innerHTML=
        '<div class="v56-wrap">'+
          '<div class="v56-head">'+
            '<div><span class="v56-kicker">OPERATIONS</span><h2>Admin Dashboard</h2><div class="v56-muted">Supabase-authoritative read-only overview</div></div>'+
            '<button type="button" class="btn btn-outline" id="v56Refresh">↻ Refresh</button>'+
          '</div>'+

          '<div class="v56-grid">'+kpis.map(function(k){
            return '<div class="v56-card v56-kpi"><div class="v56-kpi-icon">'+k[0]+'</div><div class="v56-kpi-value">'+count(k[2])+'</div><div class="v56-kpi-label">'+esc(k[1])+'</div></div>';
          }).join('')+'</div>'+

          '<div class="v56-two-col">'+
            '<section class="v56-card"><div class="v56-section-head"><h3>⚠️ Needs Attention</h3></div>'+
              '<div class="v56-attention">'+attentionRows.map(function(row){
                var action=row[2]?'onclick="showAdminSection(\''+row[2]+'\')"':'';
                return '<button type="button" class="v56-attention-row" '+action+'><span>'+esc(row[0])+'</span><strong>'+count(row[1])+'</strong></button>';
              }).join('')+'</div>'+
            '</section>'+

            '<section class="v56-card"><div class="v56-section-head"><h3>💰 Order Value by Currency</h3><span class="v56-muted">Non-cancelled/refunded orders</span></div>'+
              (valueKeys.length
                ? '<div class="v56-value-list">'+valueKeys.map(function(code){
                    return '<div class="v56-value-row"><span>'+esc(code)+'</span><strong>'+esc(money(values[code],code))+'</strong></div>';
                  }).join('')+'</div>'
                : '<div class="v56-empty">No order value recorded.</div>')+
            '</section>'+
          '</div>'+

          '<section class="v56-card"><div class="v56-section-head"><h3>📊 Operations Breakdown</h3></div>'+
            '<div class="v56-breakdown">'+
              '<div><b>Sellers</b><span>Pending '+count(s.pending)+' · Approved '+count(s.approved)+' · Suspended '+count(s.suspended)+'</span></div>'+
              '<div><b>Products</b><span>Pending '+count(p.pending)+' · Approved '+count(p.approved)+' · Rejected '+count(p.rejected)+'</span></div>'+
              '<div><b>Orders</b><span>Pending '+count(o.pending)+' · Processing '+count(o.processing)+' · Shipped '+count(o.shipped)+' · Delivered '+count(o.delivered)+'</span></div>'+
              '<div><b>Payments</b><span>Pending '+count(pay.pending)+' · Paid '+count(pay.paid)+' · Failed '+count(pay.failed)+' · Refunded '+count(pay.refunded)+'</span></div>'+
              '<div><b>Payouts</b><span>Pending '+count(po.pending)+' · Completed '+count(po.completed)+' · Failed '+count(po.failed)+'</span></div>'+
              '<div><b>Reviews</b><span>Pending '+count(rev.pending)+' · Published '+count(rev.published)+' · Hidden '+count(rev.hidden)+' · Rejected '+count(rev.rejected)+'</span></div>'+
            '</div>'+
          '</section>'+

          '<section class="v56-card"><div class="v56-section-head"><h3>🕒 Recent Orders</h3><span class="v56-muted">Latest 10</span></div>'+
            (recent.length
              ? '<div class="v56-table-wrap"><table class="v56-table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead><tbody>'+
                recent.map(function(x){
                  return '<tr><td>#'+esc(x.order_number)+'</td><td>'+esc(x.customer_name||'—')+'</td><td><span class="v56-pill '+statusClass(x.status)+'">'+esc(x.status)+'</span></td><td><span class="v56-pill '+statusClass(x.payment_status)+'">'+esc(x.payment_status)+'</span></td><td>'+esc(money(x.total,x.currency))+'</td><td>'+esc(new Date(x.created_at).toLocaleDateString())+'</td></tr>';
                }).join('')+'</tbody></table></div>'
              : '<div class="v56-empty">No orders found.</div>')+
          '</section>'+

          '<section class="v56-card"><div class="v56-section-head"><h3>🧾 Recent Audit Activity</h3><span class="v56-muted">Latest 10</span></div>'+
            (audit.length
              ? '<div class="v56-audit-list">'+audit.map(function(x){
                  return '<div class="v56-audit-row"><span>'+esc(x.action)+'</span><span class="v56-muted">'+esc(x.entity_type||'—')+'</span><time>'+esc(new Date(x.created_at).toLocaleString())+'</time></div>';
                }).join('')
              : '<div class="v56-empty">No recent audit activity.</div>')+
          '</section>'+

          '<div class="v56-footer-note">Generated '+esc(new Date(d.generated_at||Date.now()).toLocaleString())+' · Dashboard is read-only in S2-D; existing management sections retain their own controls.</div>'+
        '</div>';

      try{window.VELORA_I18N_RENDER?.(c);}catch(_){}
      var refresh=document.getElementById('v56Refresh');
      if(refresh) refresh.onclick=function(){renderDashboard();};
    }catch(err){
      console.warn('Velora S2-D admin dashboard:',err);
      renderError(String(err&&err.message||'Admin dashboard unavailable.'));
    }
  }

  function show(section,btn){
    if(section!=='dashboard' && typeof originalShow==='function') return originalShow.apply(this,arguments);
    setActiveDashboardNav(btn||null);
    return renderDashboard();
  }

  // A locale switch may occur while Admin is closed. When it is already
  // open, re-render the authoritative dashboard immediately; when closed,
  // the normal opener remains ready for the next route activation.
  window.addEventListener('velora:languagechange', function(){
    setTimeout(function(){
      var p=document.getElementById('adminPlatform');
      if(p && p.classList.contains('active')){
        try{renderDashboard();}catch(_){}
      }
    },0);
  });

  window.VELORA_RENDER_ADMIN_DASHBOARD=renderDashboard;
  window.showAdminSection=show;

  if(originalOpen){
    window.openAdminPlatform=function(){
      var result=originalOpen.apply(this,arguments);
      setTimeout(function(){
        if(document.getElementById('adminPlatform')?.classList.contains('active')) renderDashboard();
      },80);
      return result;
    };
  }

  var prevCanonical=window.VELORA_CANONICAL_ADMIN_SECTION;
  window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){
    if(section==='dashboard'){
      setActiveDashboardNav(btn||null);
      return renderDashboard();
    }
    if(prevCanonical) return prevCanonical.apply(this,arguments);
    return show(section,btn);
  };

  window.addEventListener('velora:languagechange', function(){
    document.querySelectorAll('[data-velora-admin-entry]').forEach(function(a){
      a.textContent=adminLabel();
      a.setAttribute('aria-label',adminLabel());
    });
  });

  if(client.auth && typeof client.auth.onAuthStateChange==='function'){
    client.auth.onAuthStateChange(function(event){
      if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='TOKEN_REFRESHED'){
        setTimeout(syncAdminNav,50);
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',syncAdminNav,{once:true});
  }else{
    setTimeout(syncAdminNav,0);
  }

  console.log('✅ S2-D read-only admin dashboard loaded');
})();
