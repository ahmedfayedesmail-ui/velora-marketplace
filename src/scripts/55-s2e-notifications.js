/* ============================================================
   VELORA S2-E — AUTHORITATIVE NOTIFICATIONS
   ------------------------------------------------------------
   The public notifications UI is backed by Supabase RPCs.
   Legacy localStorage notification data is not used as a source
   of truth. Client writes are routed through authenticated RPCs.
   ============================================================ */
(function(){
  'use strict';

  // This runtime owns the public notification bell. The legacy notification
  // implementation must never replace this DOM after bootstrap.
  window.VELORA_AUTHORITATIVE_NOTIFICATIONS = true;

  function tx(en, ar){
    return String(document.documentElement.lang || '').toLowerCase() === 'ar' ? ar : en;
  }

  function client(){ return window.mahaSupabase || window.supabaseClient || window.sb || null; }

  var POLL_MS=30000;
  var LIMIT=20;
  var state={items:[],unread:0,loading:false};
  var pollTimer=null;
  var authUser=null;

  function getUser(){
    try{return STATE&&STATE.user?STATE.user:authUser;}catch(_){return authUser;}
  }

  function escape(value){
    if(typeof escapeHtml==='function') return escapeHtml(String(value==null?'':value));
    return String(value==null?'':value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function icon(type){
    var map={
      order:'📦',
      order_status:'🚚',
      seller_approved:'✅',
      seller_rejected:'❌',
      product_approved:'✅',
      product_rejected:'❌',
      payout:'💰',
      subscription:'💎',
      ad:'📢',
      review:'⭐',
      support:'💬',
      security:'🔐',
      welcome:'🎉',
      low_stock:'⚠️',
      return:'↩️',
      dispute:'⚖️'
    };
    return map[type]||'🔔';
  }

  function timeAgo(value){
    var d=new Date(value);
    if(isNaN(d.getTime())) return '';
    var diff=Math.max(0,Date.now()-d.getTime());
    var s=Math.floor(diff/1000);
    if(s<60) return tx('just now','دلوقتي');
    var m=Math.floor(s/60);
    if(m<60) return tx(m+' min ago',m+' دقيقة');
    var h=Math.floor(m/60);
    if(h<24) return tx(h+' hr ago',h+' ساعة');
    var days=Math.floor(h/24);
    if(days<30) return tx(days+(days===1?' day ago':' days ago'),days+(days===1?' يوم مضى':' أيام مضت'));
    return d.toLocaleDateString();
  }

  function currentUnread(){
    return Number(state.unread||0);
  }

  function renderBadge(){
    var bell=document.getElementById('notifBell');
    if(!bell) return;
    var btn=bell.querySelector('.icon-btn');
    if(!btn) return;
    var old=btn.querySelector('.notif-badge');
    var unread=currentUnread();

    if(unread>0){
      if(!old){
        old=document.createElement('span');
        old.className='notif-badge';
        btn.appendChild(old);
      }
      old.textContent=unread>99?'99+':String(unread);
    }else if(old){
      old.remove();
    }
  }

  function renderBell(){
    var headerActions=document.querySelector('.header-actions');
    if(!headerActions) return;

    var existing=document.getElementById('notifBell');
    if(!getUser()){
      if(existing) existing.remove();
      return;
    }

    // Reuse the existing bell instead of replacing the DOM node. Replacing it
    // would close an open dropdown during auth refresh or other lifecycle work.
    if(existing){
      var button=existing.querySelector('.icon-btn');
      if(button){
        var label=String(document.documentElement.lang||'').toLowerCase()==='ar'
          ? 'الإشعارات'
          : 'Notifications';
        button.setAttribute('title',label);
        button.setAttribute('aria-label',label);
      }
      var header=existing.querySelector('.notif-header h4');
      if(header) header.textContent='🔔 '+tx('Notifications','الإشعارات');
      return;
    }

    var wrapper=document.createElement('div');
    wrapper.innerHTML=
      '<div class="notification-bell" id="notifBell">'+
        '<button class="icon-btn" type="button" onclick="toggleNotifications(event)" title="Notifications" aria-label="Notifications">'+
          '<span class="bell-icon">🔔</span>'+
        '</button>'+
        '<div class="notif-dropdown" id="notifDropdown">'+
          '<div class="notif-header">'+
            '<h4>🔔 Notifications</h4>'+
            '<button type="button" onclick="markAllRead(event)">Mark all read</button>'+
          '</div>'+
          '<div class="notif-list" id="notifList"></div>'+
        '</div>'+
      '</div>';

    var bell=wrapper.firstElementChild;
    var accountBtn=document.getElementById('accountBtn');
    if(accountBtn && accountBtn.parentNode===headerActions){
      headerActions.insertBefore(bell,accountBtn);
    }else{
      headerActions.appendChild(bell);
    }
    renderBadge();
  }

  function renderList(){
    var list=document.getElementById('notifList');
    if(!list) return;

    if(state.loading){
      list.innerHTML='<div class="notif-empty"><div class="empty-icon">⏳</div><p>Loading notifications...</p></div>';
      return;
    }

    if(!state.items.length){
      list.innerHTML='<div class="notif-empty"><div class="empty-icon">🔔</div><p>No notifications yet</p></div>';
      return;
    }

    list.innerHTML=state.items.map(function(n){
      var unread=!n.is_read;
      var body=String(n.body||'');
      return '<div class="notif-item'+(unread?' unread':'')+'" data-notification-id="'+escape(n.id)+'" onclick="VELORA_MARK_NOTIFICATION_READ(\''+
        String(n.id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\\\'")+
        '\',event)">'+
        '<div class="notif-icon">'+icon(n.type)+'</div>'+
        '<div class="notif-content">'+
          '<div class="notif-title">'+escape(n.title||'Notification')+'</div>'+
          '<div class="notif-message">'+escape(body)+'</div>'+
          '<div class="notif-time">'+escape(timeAgo(n.created_at))+'</div>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  function closeDropdown(){
    var d=document.getElementById('notifDropdown');
    if(d) d.classList.remove('open');
  }

  async function load(silent){
    if(state.loading) return;
    if(!getUser()){
      state.items=[];
      state.unread=0;
      renderBell();
      return;
    }

    state.loading=true;
    if(!document.getElementById('notifBell')) renderBell();
    renderList();

    try{
      var sb=client();
      if(!sb || typeof sb.rpc!=='function') throw new Error('SUPABASE_UNAVAILABLE');
      var results=await Promise.all([
        sb.rpc('velora_get_notifications',{p_limit:LIMIT,p_offset:0}),
        sb.rpc('velora_get_unread_notification_count')
      ]);

      if(results[0].error) throw results[0].error;
      if(results[1].error) throw results[1].error;

      state.items=Array.isArray(results[0].data)?results[0].data:[];
      state.unread=Number(results[1].data||0);
      state.loading=false;

      if(!document.getElementById('notifBell')) renderBell();
      renderBadge();
      renderList();
    }catch(err){
      state.loading=false;
      if(!silent && typeof showToast==='function'){
        showToast('⚠️ Could not load notifications. Please try again.','warning');
      }
      console.warn('Velora S2-E notification read:',err);
      renderBell();
      renderList();
    }
  }

  async function markRead(notificationId,event){
    if(event && typeof event.stopPropagation==='function') event.stopPropagation();
    notificationId=String(notificationId||'');
    if(!notificationId) return;

    closeDropdown();

    try{
      var sb=client();
      if(!sb || typeof sb.rpc!=='function') throw new Error('SUPABASE_UNAVAILABLE');
      var r=await sb.rpc('velora_mark_notification_read',{p_notification_id:notificationId});
      if(r.error) throw r.error;

      state.items=state.items.map(function(n){
        if(String(n.id)===notificationId){
          return Object.assign({},n,{is_read:true,read_at:n.read_at||new Date().toISOString()});
        }
        return n;
      });
      state.unread=Math.max(0,state.unread-(r.data===true?1:0));
      renderBadge();
      renderList();
    }catch(err){
      console.warn('Velora S2-E notification mark-read:',err);
      if(typeof showToast==='function') showToast('⚠️ Could not mark this notification as read.','warning');
    }
  }

  async function markAll(event){
    if(event && typeof event.stopPropagation==='function') event.stopPropagation();
    if(!currentUnread()){
      renderBadge();
      return;
    }

    try{
      var sb=client();
      if(!sb || typeof sb.rpc!=='function') throw new Error('SUPABASE_UNAVAILABLE');
      var r=await sb.rpc('velora_mark_all_notifications_read');
      if(r.error) throw r.error;

      var now=new Date().toISOString();
      state.items=state.items.map(function(n){
        return Object.assign({},n,{is_read:true,read_at:n.read_at||now});
      });
      state.unread=0;
      renderBadge();
      renderList();
    }catch(err){
      console.warn('Velora S2-E notification mark-all:',err);
      if(typeof showToast==='function') showToast('⚠️ Could not mark notifications as read.','warning');
    }
  }

  window.toggleNotifications=function(event){
    if(event && typeof event.stopPropagation==='function') event.stopPropagation();
    if(!getUser()) return;
    var dropdown=document.getElementById('notifDropdown');
    if(!dropdown){
      renderBell();
      dropdown=document.getElementById('notifDropdown');
    }
    if(!dropdown) return;
    dropdown.classList.toggle('open');
    if(dropdown.classList.contains('open')){
      load(true);
    }
  };

  window.markAllRead=markAll;
  window.VELORA_MARK_NOTIFICATION_READ=markRead;
  window.veloraRefreshNotifications=function(){return load(true);};

  document.addEventListener('click',function(event){
    var bell=document.getElementById('notifBell');
    if(bell && !bell.contains(event.target)){
      closeDropdown();
    }
  });

  function bindAuth(){
    var sb=client();
    if(!sb || !sb.auth || typeof sb.auth.onAuthStateChange!=='function') return false;
    sb.auth.onAuthStateChange(function(event,session){
    authUser=session&&session.user?session.user:null;
    if(event==='SIGNED_IN' || event==='TOKEN_REFRESHED'){
      renderBell();
      setTimeout(function(){load(true);},350);
    }else if(event==='SIGNED_OUT'){
      state.items=[];
      state.unread=0;
      renderBell();
    }
    });
    return true;
  }

  function startPolling(){
    if(pollTimer) clearInterval(pollTimer);
    pollTimer=setInterval(function(){
      if(getUser()) load(true);
    },POLL_MS);
  }

  async function bootstrap(){
    if(!bindAuth()){
      setTimeout(bootstrap,250);
      return;
    }
    var sb=client();
    try{
      var current=await sb.auth.getUser();
      authUser=current&&current.data&&current.data.user?current.data.user:null;
    }catch(_){
      authUser=null;
    }
    renderBell();
    setTimeout(function(){load(true);},450);
    startPolling();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
  }else{
    bootstrap();
  }

  console.log('✅ S2-E authoritative notifications loaded');
})();
