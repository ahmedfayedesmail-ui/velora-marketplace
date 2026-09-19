/* ============================================================
   VELORA S2-B — AUTHORITATIVE WISHLIST
   ============================================================ */
(function(){
  'use strict';
  var client=window.mahaSupabase;
  if(!client || !client.rpc) return;

  var UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  var GUEST_KEY='velora_guest_wishlist_v1';
  var busy=new Set();
  var originalToggle=window.toggleFavorite;
  var originalRenderFavorites=window.renderFavoritesPage;

  function isUuid(v){return UUID_RE.test(String(v||''));}
  async function currentUser(){
    try{var r=await client.auth.getSession();return r.data&&r.data.session?r.data.session.user:null;}
    catch(_){return null;}
  }
  function cleanGuestItems(input){
    var src=Array.isArray(input)?input:[],seen=new Set();
    return src.map(function(x){return typeof x==='string'?{id:x}:x||{};})
      .filter(function(x){
        var id=String(x.id||x.product_id||'');
        if(!isUuid(id)||seen.has(id)) return false; seen.add(id); return true;
      })
      .map(function(x){return {
        id:String(x.id||x.product_id),
        name:x.name||x.product_name||'Product',
        price:Number(x.price||0),
        oldPrice:x.oldPrice!=null?Number(x.oldPrice):(x.original_price!=null?Number(x.original_price):null),
        emoji:x.emoji||'📦'
      };});
  }
  function readGuestItems(){
    try{var raw=localStorage.getItem(GUEST_KEY);return raw?cleanGuestItems(JSON.parse(raw)):[];}
    catch(_){return [];}
  }
  function writeGuestItems(items){
    try{localStorage.setItem(GUEST_KEY,JSON.stringify(cleanGuestItems(items)));}catch(_){}
  }
  function clearGuestItems(){
    try{localStorage.removeItem(GUEST_KEY);}catch(_){}
  }
  function normalizeRow(row){
    row=row||{};var id=String(row.product_id||row.id||'');
    return {
      id:id,canonicalId:id,productId:id,
      name:row.product_name||row.name||'Product',
      price:Number(row.price||0),
      oldPrice:row.original_price!=null?Number(row.original_price):null,
      emoji:row.emoji||'📦',
      images:Array.isArray(row.images)?row.images:[],
      rating:Number(row.rating||0),
      reviewsCount:Number(row.review_count||0),
      category:row.category||'all',
      subcategory:row.subcategory||'',
      brand:row.brand||row.store_name||'Velora Seller',
      sellerId:row.seller_id||null,
      storeId:row.store_id||null,
      storeName:row.store_name||'',
      currency:row.currency_code||window.VELORA_CURRENCY||'USD'
    };
  }
  function hydrateCatalog(items){
    if(!window.MAHA_DATA||!Array.isArray(window.MAHA_DATA.PRODUCTS)) return;
    items.forEach(function(item){
      var i=window.MAHA_DATA.PRODUCTS.findIndex(function(p){return p.id===item.id;});
      if(i<0){
        window.MAHA_DATA.PRODUCTS.push(Object.assign({},item,{
          reviewsCount:item.reviewsCount||0,images:item.images||[],
          ingredients:[],benefits:[],pros:[],cons:[],skinTypes:[],concerns:[],tags:[],
          description:item.description||''
        }));
      }else{
        window.MAHA_DATA.PRODUCTS[i]=Object.assign({},window.MAHA_DATA.PRODUCTS[i],item);
      }
    });
  }
  function refreshBadge(){if(typeof updateFavoritesBadge==='function') updateFavoritesBadge();}
  function syncButton(btn,active){
    if(!btn) return;
    btn.classList.toggle('active',!!active);
    btn.classList.remove('is-busy');
    btn.disabled=false;
    btn.setAttribute('aria-busy','false');
    btn.setAttribute('aria-pressed',active?'true':'false');
    btn.textContent=active?'❤️':'🤍';
  }
  function setButtonBusy(btn){
    if(!btn) return;
    btn.classList.add('is-busy');btn.disabled=true;btn.setAttribute('aria-busy','true');
  }
  function applyServerWishlist(data){
    var items=(Array.isArray(data)?data:[]).map(normalizeRow).filter(function(x){return isUuid(x.id);});
    hydrateCatalog(items);STATE.favorites=items;refreshBadge();
    if(STATE.currentPage==='favorites'&&typeof renderFavoritesPage==='function') renderFavoritesPage();
    return items;
  }
  async function syncServer(opts){
    opts=opts||{};var user=await currentUser();if(!user) return false;
    try{
      var r=await client.rpc('velora_get_wishlist');if(r.error) throw r.error;
      applyServerWishlist(r.data);return true;
    }catch(err){
      if(!opts.silent&&typeof showToast==='function') showToast('⚠️ Could not load your wishlist. Please try again.','warning');
      console.warn('Velora S2-B wishlist read:',err);return false;
    }
  }
  async function mergeGuestThenSync(opts){
    opts=opts||{};var user=await currentUser();if(!user) return false;
    var guest=readGuestItems();
    if(!guest.length) return syncServer(opts);
    try{
      var r=await client.rpc('velora_merge_wishlist',{p_product_ids:guest.map(function(x){return x.id;})});
      if(r.error) throw r.error;
      clearGuestItems();applyServerWishlist(r.data);return true;
    }catch(err){
      console.warn('Velora S2-B wishlist merge:',err);
      var fallback=await syncServer({silent:true});
      if(!fallback&&!opts.silent&&typeof showToast==='function')
        showToast('⚠️ Wishlist sync is temporarily unavailable. Your local wishlist is still preserved.','warning');
      return fallback;
    }
  }
  async function authoritativeToggle(productId,btn){
    productId=String(productId||'');
    if(!isUuid(productId)||busy.has(productId)) return;
    var user=await currentUser();
    if(!user){
      if(typeof originalToggle==='function') originalToggle.apply(this,arguments);
      setTimeout(function(){writeGuestItems(Array.isArray(STATE.favorites)?STATE.favorites:[]);},0);
      return;
    }
    busy.add(productId);setButtonBusy(btn);
    try{
      var r=await client.rpc('velora_toggle_wishlist',{p_product_id:productId});
      if(r.error) throw r.error;
      var isFavorite=Boolean(r.data&&r.data.is_favorite);
      var count=Number(r.data&&r.data.wishlist_count||0);
      if(isFavorite){
        var product=window.MAHA_DATA&&Array.isArray(window.MAHA_DATA.PRODUCTS)
          ?window.MAHA_DATA.PRODUCTS.find(function(p){return p.id===productId;}):null;
        if(product){
          var item=Object.assign({},product,{
            id:product.id,canonicalId:product.id,productId:product.id,
            price:Number(product.price||0),
            oldPrice:product.oldPrice!=null?Number(product.oldPrice):null,
            rating:Number(product.rating||0),
            reviewsCount:Number(product.reviewsCount||product.review_count||0)
          });
          STATE.favorites=(STATE.favorites||[]).filter(function(x){return x.id!==productId;});
          STATE.favorites.push(item);
        }else{
          await syncServer({silent:true});
        }
      }else{
        STATE.favorites=(STATE.favorites||[]).filter(function(x){return x.id!==productId;});
      }
      refreshBadge();
      if(STATE.currentPage==='favorites'&&typeof renderFavoritesPage==='function') renderFavoritesPage();
      syncButton(btn,isFavorite);
      if(typeof showToast==='function') showToast(isFavorite?'❤️ Added to wishlist':'💔 Removed from wishlist','success');
      if(Number.isFinite(count)){var badge=document.getElementById('favBadge');if(badge&&count===0) badge.style.display='none';}
    }catch(err){
      syncButton(btn,STATE.favorites.some(function(x){return x.id===productId;}));
      console.warn('Velora S2-B wishlist write:',err);
      if(typeof showToast==='function'){
        var unavailable=String(err&&err.message||'').indexOf('PRODUCT_NOT_AVAILABLE')>=0;
        showToast(unavailable?'⚠️ This product is no longer available.':'⚠️ Could not update your wishlist. Please try again.','error');
      }
    }finally{busy.delete(productId);}
  }
  window.toggleFavorite=authoritativeToggle;
  window.VELORA_TOGGLE_FAVORITE=authoritativeToggle;
  window.veloraSyncCloudWishlist=syncServer;

  window.renderFavoritesPage=function(){
    var container=document.getElementById('favoritesContent');
    if(!container) return typeof originalRenderFavorites==='function'?originalRenderFavorites():undefined;
    var items=Array.isArray(STATE.favorites)?STATE.favorites:[];
    if(!items.length){
      container.innerHTML='<div class="empty-state"><div class="empty-icon">❤️</div><h3>Your wishlist is empty</h3><p>Click ❤️ on any product to save it here.</p><button class="btn btn-primary btn-lg" onclick="navigateTo(\\'shop\\')">Shop Now</button><div class="velora-wishlist-note">Guest wishlists are saved on this device. Sign in to sync across devices.</div></div>';
      return;
    }
    hydrateCatalog(items);
    var cards=items.map(function(item){
      var p=window.MAHA_DATA&&Array.isArray(window.MAHA_DATA.PRODUCTS)
        ?window.MAHA_DATA.PRODUCTS.find(function(x){return x.id===item.id;}):null;
      p=p||item;
      return typeof renderProductCard==='function'?renderProductCard(p):('<div class="product-card"><div class="product-info"><div class="product-name">'+String(p.name||'Product')+'</div></div></div>');
    }).join('');
    container.innerHTML='<div class="velora-wishlist-toolbar"><div><strong>'+items.length+' saved '+(items.length===1?'item':'items')+'</strong><div class="velora-wishlist-note">Your account wishlist is synced with Velora.</div></div><button class="btn btn-outline" onclick="navigateTo(\\'shop\\')">Continue Shopping</button></div><div class="products-grid">'+cards+'</div>';
  };

  async function boot(){
    var user=await currentUser();
    if(user){await mergeGuestThenSync({silent:true});return;}
    try{
      var legacy=Array.isArray(STATE.favorites)?STATE.favorites:[];
      if(!readGuestItems().length&&legacy.length) writeGuestItems(legacy);
    }catch(_){}
    refreshBadge();
  }

  client.auth.onAuthStateChange(function(event,session){
    if(event==='SIGNED_IN') setTimeout(function(){mergeGuestThenSync({silent:false});},325);
    else if(event==='TOKEN_REFRESHED'&&session&&session.user) setTimeout(function(){syncServer({silent:true});},325);
    else if(event==='SIGNED_OUT'){
      STATE.favorites=[];
      try{localStorage.removeItem(KEYS.FAVORITES);}catch(_){}
      clearGuestItems();refreshBadge();
      if(STATE.currentPage==='favorites'&&typeof renderFavoritesPage==='function') renderFavoritesPage();
    }
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,425);},{once:true});
  else setTimeout(boot,425);
})();
