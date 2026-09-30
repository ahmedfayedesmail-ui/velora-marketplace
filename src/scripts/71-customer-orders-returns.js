/* ============================================================
   VELORA — Canonical Customer Orders + Returns UI Adapter
   No new business engine. Reads canonical orders/order_items/returns
   through existing RLS and uses the existing return request RPC.
   ============================================================ */
(function(){
  'use strict';

  const db = window.mahaSupabase;
  if(!db || typeof db.from!=='function' || typeof db.rpc!=='function') return;

  const esc = (v)=>{
    if(typeof window.escapeHtml==='function') return window.escapeHtml(String(v==null?'':v));
    return String(v==null?'':'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };

  const money = (n,c)=>{
    const amount=Number(n||0);const currency=String(c||'EGP').toUpperCase();
    const s=window.VELORA_GLOBAL_LOCALE_STATE||{};
    const locale=String(s.date_locale||((s.locale||document.documentElement.lang||'en').toLowerCase()+'-'+(s.country_code||'EG').toUpperCase()));
    try{return new Intl.NumberFormat(locale,{style:'currency',currency}).format(amount)}
    catch(_){try{return new Intl.NumberFormat(locale.startsWith('ar')?'ar-EG':'en-EG',{style:'currency',currency}).format(amount)}catch(__){return amount.toFixed(2)+' '+currency}}
  };

  const statusText = (value)=>{
    const ar = {
      pending:'قيد الانتظار',
      confirmed:'مؤكد',
      processing:'قيد التجهيز',
      shipped:'تم الشحن',
      delivered:'تم التسليم',
      cancelled:'ملغى',
      failed:'فشل',
      paid:'مدفوع',
      refunded:'مسترد',
      requested:'تم طلب الإرجاع',
      approved:'تمت الموافقة',
      rejected:'مرفوض',
      in_transit:'قيد الشحن',
      received:'تم الاستلام'
    };
    const s=String(value||'').toLowerCase();
    return String(document.documentElement.lang||'en').toLowerCase()==='ar' ? (ar[s]||s) : s;
  };

  const t=(en,ar)=>String(document.documentElement.lang||'en').toLowerCase()==='ar' ? ar : en;

  function ensureStyle(){
    if(document.getElementById('veloraCanonicalOrdersStyle')) return;
    const style=document.createElement('style');
    style.id='veloraCanonicalOrdersStyle';
    style.textContent=
      '.velora-customer-order{margin-bottom:1rem;border:1px solid var(--border);border-radius:18px;background:var(--card);padding:1rem;}' +
      '.velora-customer-order-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;flex-wrap:wrap;}' +
      '.velora-customer-order-meta{font-size:.82rem;color:var(--text-muted);}' +
      '.velora-customer-order-items{margin-top:1rem;display:grid;gap:.7rem;}' +
      '.velora-customer-order-item{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:.8rem;border:1px solid var(--border);border-radius:14px;}' +
      '.velora-customer-order-item-main{min-width:0;}' +
      '.velora-customer-order-item-name{font-weight:800;}' +
      '.velora-customer-order-item-meta{font-size:.78rem;color:var(--text-muted);margin-top:.2rem;}' +
      '.velora-customer-order-store{margin-top:1rem;border-top:1px solid var(--border);padding-top:1rem;}' +
      '.velora-customer-order-store-head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;}' +
      '.velora-customer-return-btn{margin-top:.75rem;}' +
      '.velora-customer-order-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem;}' +
      '.velora-customer-return-modal{position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:1rem;}' +
      '.velora-customer-return-dialog{width:min(680px,100%);max-height:92vh;overflow:auto;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:20px;padding:1rem;box-shadow:0 20px 60px rgba(0,0,0,.25);}' +
      '.velora-customer-return-row{display:grid;grid-template-columns:1fr 90px;gap:.7rem;align-items:center;padding:.65rem 0;border-bottom:1px solid var(--border);}' +
      '.velora-customer-return-row:last-child{border-bottom:0;}' +
      '.velora-customer-order-shipping{margin-top:1rem;display:grid;gap:.55rem;}' +
      '.velora-customer-order-shipment{display:flex;justify-content:space-between;gap:.8rem;align-items:center;padding:.7rem;border:1px solid var(--border);border-radius:12px;}' +
      '.velora-customer-order-proof{margin-top:.8rem;padding:.75rem;border:1px dashed var(--border);border-radius:12px;}' +
      '@media(max-width:700px){.velora-customer-order-item{align-items:flex-start;flex-direction:column;}.velora-customer-return-row{grid-template-columns:1fr 78px;}}';
    document.head.appendChild(style);
  }

  async function currentUser(){
    const r=await db.auth.getUser();
    if(r.error) throw r.error;
    return r.data?.user||null;
  }

  async function loadOrders(userId){
    const r=await db.from('orders')
      .select('id,order_number,status,subtotal,discount,shipping,total,currency,payment_status,customer_city,customer_address,customer_notes,created_at,updated_at')
      .eq('customer_id',userId)
      .order('created_at',{ascending:false})
      .limit(100);
    if(r.error) throw r.error;
    const orders=r.data||[];
    if(!orders.length) return [];

    const ids=orders.map(x=>x.id);
    const [itemsRes,returnsRes,shipmentsRes,proofsRes]=await Promise.all([
      db.from('order_items')
        .select('id,order_id,product_id,product_name,unit_price,quantity,subtotal,store_id,store_name,sku,product_variant_id,product_variant_name,product_variant_attributes')
        .in('order_id',ids)
        .order('created_at',{ascending:true}),
      db.from('returns')
        .select('id,order_id,store_id,status,refund_amount,currency_code,reason,created_at')
        .in('order_id',ids)
        .order('created_at',{ascending:false}),
      db.from('shipments')
        .select('id,order_id,store_id,status,tracking_number,tracking_url,carrier_code,service_name,estimated_delivery_at,shipped_at,delivered_at,created_at')
        .in('order_id',ids)
        .order('created_at',{ascending:false}),
      db.from('delivery_proofs')
        .select('id,order_id,store_id,delivered_at,photo_url,recipient_name,notes,created_at')
        .in('order_id',ids)
        .order('created_at',{ascending:false})
    ]);
    if(itemsRes.error) throw itemsRes.error;
    if(returnsRes.error) throw returnsRes.error;
    if(shipmentsRes.error) throw shipmentsRes.error;
    if(proofsRes.error) throw proofsRes.error;

    const itemsByOrder=new Map();
    (itemsRes.data||[]).forEach(row=>{
      if(!itemsByOrder.has(row.order_id)) itemsByOrder.set(row.order_id,[]);
      itemsByOrder.get(row.order_id).push(row);
    });

    const returnsByOrder=new Map();
    (returnsRes.data||[]).forEach(row=>{
      if(!returnsByOrder.has(row.order_id)) returnsByOrder.set(row.order_id,[]);
      returnsByOrder.get(row.order_id).push(row);
    });

    const shipmentsByOrder=new Map();
    (shipmentsRes.data||[]).forEach(row=>{
      if(!shipmentsByOrder.has(row.order_id)) shipmentsByOrder.set(row.order_id,[]);
      shipmentsByOrder.get(row.order_id).push(row);
    });

    const proofsByOrder=new Map();
    (proofsRes.data||[]).forEach(row=>{
      if(!proofsByOrder.has(row.order_id)) proofsByOrder.set(row.order_id,[]);
      proofsByOrder.get(row.order_id).push(row);
    });

    return orders.map(o=>({
      ...o,
      items:itemsByOrder.get(o.id)||[],
      returns:returnsByOrder.get(o.id)||[],
      shipments:shipmentsByOrder.get(o.id)||[],
      proofs:proofsByOrder.get(o.id)||[]
    }));
  }

  function groupStores(items){
    const map=new Map();
    (items||[]).forEach(item=>{
      const key=String(item.store_id||'');
      if(!key) return;
      if(!map.has(key)) map.set(key,{store_id:key,store_name:item.store_name||t('Store','المتجر'),items:[]});
      map.get(key).items.push(item);
    });
    return Array.from(map.values());
  }

  function activeReturnForStore(order,storeId){
    return (order.returns||[]).find(r=>
      String(r.store_id)===String(storeId) &&
      !['rejected','cancelled'].includes(String(r.status||'').toLowerCase())
    )||null;
  }

  function renderOrder(order){
    const stores=groupStores(order.items);
    const canReturn=String(order.status||'').toLowerCase()==='delivered'
      && ['paid','refunded'].includes(String(order.payment_status||'').toLowerCase());
    const canCancel=['pending','confirmed'].includes(String(order.status||'').toLowerCase())
      && String(order.payment_status||'').toLowerCase()==='pending';

    return '<article class="velora-customer-order">'+
      '<div class="velora-customer-order-head">'+
        '<div>'+
          '<div style="font-size:1.05rem;font-weight:900;">#'+esc(order.order_number)+'</div>'+
          '<div class="velora-customer-order-meta">'+esc(new Date(order.created_at).toLocaleString())+'</div>'+
        '</div>'+
        '<div class="velora-op-actions">'+
          '<span class="velora-op-status '+esc(String(order.status||''))+'">'+esc(statusText(order.status))+'</span>'+
          '<span class="velora-op-status '+esc(String(order.payment_status||''))+'">'+esc(statusText(order.payment_status))+'</span>'+
        '</div>'+
      '</div>'+
      '<div class="velora-customer-order-meta" style="margin-top:.55rem;">'+
        esc(order.customer_city||'')+
        (order.customer_address?' · '+esc(order.customer_address):'')+
      '</div>'+
      '<div class="velora-customer-order-items">'+      (order.shipments?.length ? '<div class="velora-customer-order-shipping">'+
        order.shipments.map(sh=>{
          const tracking=sh.tracking_number
            ? (sh.tracking_url
              ? '<a href="'+esc(sh.tracking_url)+'" target="_blank" rel="noopener">'+esc(sh.tracking_number)+'</a>'
              : '<span>'+esc(sh.tracking_number)+'</span>')
            : '';
          const eta=sh.estimated_delivery_at?new Date(sh.estimated_delivery_at).toLocaleDateString():'';
          return '<div class="velora-customer-order-shipment">'+
            '<div><strong>🚚 '+esc(statusText(sh.status))+'</strong>'+
              '<div class="velora-customer-order-item-meta">'+esc(sh.carrier_code||'')+(sh.service_name?' · '+esc(sh.service_name):'')+(eta?' · '+esc(t('ETA','متوقع'))+': '+esc(eta):'')+'</div></div>'+
            (tracking?'<div style="font-weight:700">'+tracking+'</div>':'')+
          '</div>';
        }).join('')+'</div>' : '')+

        (order.items.length ? order.items.map(item=>
          '<div class="velora-customer-order-item">'+
            '<div class="velora-customer-order-item-main">'+
              '<div class="velora-customer-order-item-name">'+esc(item.product_name||t('Product','المنتج'))+'</div>'+
              '<div class="velora-customer-order-item-meta">'+
                esc(item.store_name||'')+
                (item.product_variant_name?' · '+esc(item.product_variant_name):'')+
                (item.sku?' · SKU '+esc(item.sku):'')+
              '</div>'+
            '</div>'+
            '<div style="text-align:end;white-space:nowrap;">'+
              '<div style="font-weight:800;">'+esc(item.quantity)+' × '+money(item.unit_price,order.currency)+'</div>'+
              '<div class="velora-customer-order-item-meta">'+money(item.subtotal,order.currency)+'</div>'+
            '</div>'+
          '</div>'
        ).join('') : '<div class="velora-op-muted">'+esc(t('No items found for this order.','لم يتم العثور على عناصر لهذا الطلب.'))+'</div>')+
      '</div>'+
      (order.proofs?.length ? '<div class="velora-customer-order-proof">'+
        '<strong>📸 '+esc(t('Delivery proof','إثبات التسليم'))+'</strong>'+
        order.proofs.map(pr=>
          '<div class="velora-customer-order-item-meta" style="margin-top:.45rem;">'+
            (pr.recipient_name?esc(t('Delivered to','تم التسليم إلى'))+' <b>'+esc(pr.recipient_name)+'</b>':'')+
            (pr.photo_url?' · <a href="'+esc(pr.photo_url)+'" target="_blank" rel="noopener">'+esc(t('View proof','عرض الإثبات'))+'</a>':'')+
          '</div>'
        ).join('')+
      '</div>' : '')+
      '<div style="display:flex;justify-content:space-between;gap:1rem;align-items:center;flex-wrap:wrap;margin-top:1rem;font-weight:900;">'+
        '<span>'+esc(t('Total','الإجمالي'))+': '+money(order.total,order.currency)+'</span>'+
        (canCancel ? '<button class="btn btn-outline" type="button" data-velora-cancel-order="'+esc(order.id)+'">'+esc(t('Cancel order','إلغاء الطلب'))+'</button>' : '')+
      '</div>'+
      (stores.length ? stores.map(store=>{
        const existing=activeReturnForStore(order,store.store_id);
        return '<div class="velora-customer-order-store">'+
          '<div class="velora-customer-order-store-head">'+
            '<div><strong>'+esc(store.store_name)+'</strong>'+
              '<div class="velora-customer-order-item-meta">'+esc(store.items.length)+' '+esc(t(store.items.length===1?'item':'items',store.items.length===1?'عنصر':'عناصر'))+'</div>'+
            '</div>'+
            (existing
              ? '<span class="velora-op-status '+esc(String(existing.status))+'">'+esc(statusText(existing.status))+'</span>'
              : (canReturn
                ? '<button class="btn btn-outline velora-customer-return-btn" type="button" data-velora-return-order="'+esc(order.id)+'" data-velora-return-store="'+esc(store.store_id)+'">'+esc(t('Request return','طلب إرجاع'))+'</button>'
                : ''))+
          '</div>'+
        '</div>';
      }).join('') : '')+
    '</article>';
  }

  async function cancelOrder(order){
    const confirmed=window.confirm(t(
      'Cancel this order? Inventory will be released if the server confirms cancellation.',
      'هل تريد إلغاء هذا الطلب؟ سيتم تحرير المخزون إذا أكد الخادم الإلغاء.'
    ));
    if(!confirmed) return;
    try{
      const result=await db.rpc('velora_cancel_order',{p_order_id:order.id});
      if(result.error) throw result.error;
      if(window.showToast) window.showToast('✅ '+t('Order cancelled.','تم إلغاء الطلب.'),'success');
      await renderCanonicalOrders();
    }catch(error){
      if(window.showToast) window.showToast('❌ '+String(error?.message||error),'error');
    }
  }

  function showError(container,error){
    container.innerHTML=
      '<div class="empty-state">'+
        '<div class="empty-icon">⚠️</div>'+
        '<h3>'+esc(t('Could not load your orders','تعذر تحميل طلباتك'))+'</h3>'+
        '<p>'+esc(error?.message||error||t('Please try again.','حاول مرة أخرى.'))+'</p>'+
        '<button class="btn btn-primary" type="button" id="veloraOrdersRetry">'+esc(t('Retry','إعادة المحاولة'))+'</button>'+
      '</div>';
    document.getElementById('veloraOrdersRetry')?.addEventListener('click',()=>renderCanonicalOrders());
  }

  function closeReturnModal(){
    document.getElementById('veloraCanonicalReturnModal')?.remove();
    document.body.style.overflow='';
  }

  function openReturnModal(order,store){
    closeReturnModal();
    const modal=document.createElement('div');
    modal.id='veloraCanonicalReturnModal';
    modal.className='velora-customer-return-modal';
    const rows=store.items.map(item=>
      '<label class="velora-customer-return-row">'+
        '<span><strong>'+esc(item.product_name||t('Product','المنتج'))+'</strong>'+
        (item.product_variant_name?'<small class="velora-customer-order-item-meta">'+esc(item.product_variant_name)+'</small>':'')+
        '<small class="velora-customer-order-item-meta">'+esc(item.quantity)+' '+esc(t('available','متاح'))+'</small></span>'+
        '<input class="form-input" type="number" min="0" max="'+esc(item.quantity)+'" step="1" value="0" data-return-item="'+esc(item.id)+'" data-return-max="'+esc(item.quantity)+'">'+
      '</label>'
    ).join('');

    modal.innerHTML=
      '<div class="velora-customer-return-dialog" role="dialog" aria-modal="true" aria-labelledby="veloraReturnTitle">'+
        '<div class="velora-customer-order-store-head">'+
          '<div><h3 id="veloraReturnTitle" style="margin:0;">↩️ '+esc(t('Request return','طلب إرجاع'))+'</h3>'+
          '<div class="velora-customer-order-item-meta">'+esc(store.store_name)+'</div></div>'+
          '<button type="button" class="btn btn-outline" id="veloraReturnClose" aria-label="'+esc(t('Close','إغلاق'))+'">✕</button>'+
        '</div>'+
        '<div style="margin-top:1rem;">'+rows+'</div>'+
        '<div class="form-group" style="margin-top:1rem;"><label>'+esc(t('Reason','السبب'))+' *</label><input class="form-input" id="veloraReturnReason" maxlength="500" placeholder="'+esc(t('Why are you returning the item?','لماذا تريد إرجاع المنتج؟'))+'"></div>'+
        '<div class="form-group"><label>'+esc(t('Details (optional)','التفاصيل (اختياري)'))+'</label><textarea class="form-textarea" id="veloraReturnDescription" maxlength="4000" rows="4"></textarea></div>'+
        '<div class="velora-customer-order-actions"><button type="button" class="btn btn-primary" id="veloraReturnSubmit">'+esc(t('Submit return request','إرسال طلب الإرجاع'))+'</button></div>'+
        '<div class="velora-op-note" style="margin-top:.7rem;">'+esc(t('The server will validate delivery, payment settlement, ownership, quantity and duplicate-return rules.','الخادم سيتحقق من التسليم والتسوية وملكية الطلب والكميات وعدم تكرار الإرجاع.'))+'</div>'+
      '</div>';

    document.body.appendChild(modal);
    document.body.style.overflow='hidden';

    document.getElementById('veloraReturnClose').onclick=closeReturnModal;
    modal.addEventListener('click',e=>{if(e.target===modal)closeReturnModal();},{once:true});

    document.getElementById('veloraReturnSubmit').onclick=async ()=>{
      const button=document.getElementById('veloraReturnSubmit');
      const reason=document.getElementById('veloraReturnReason')?.value.trim()||'';
      const description=document.getElementById('veloraReturnDescription')?.value.trim()||null;
      const selected=Array.from(modal.querySelectorAll('[data-return-item]')).map(input=>{
        const max=Number(input.getAttribute('data-return-max')||0);
        const quantity=Math.max(0,Math.min(max,Math.floor(Number(input.value||0))));
        return {order_item_id:input.getAttribute('data-return-item'),quantity};
      }).filter(x=>x.quantity>0);

      if(!reason){
        if(window.showToast) window.showToast('⚠️ '+t('Return reason is required.','سبب الإرجاع مطلوب.'),'warning');
        return;
      }
      if(!selected.length){
        if(window.showToast) window.showToast('⚠️ '+t('Select at least one quantity.','اختر كمية واحدة على الأقل.'),'warning');
        return;
      }

      button.disabled=true;
      button.textContent=t('Submitting…','جارٍ الإرسال…');
      try{
        const result=await db.rpc('velora_request_return',{
          p_order_id:order.id,
          p_store_id:store.store_id,
          p_items:selected,
          p_reason:reason,
          p_description:description
        });
        if(result.error) throw result.error;
        if(window.showToast) window.showToast('✅ '+t('Return request submitted.','تم إرسال طلب الإرجاع.'),'success');
        closeReturnModal();
        await renderCanonicalOrders();
      }catch(error){
        if(window.showToast) window.showToast('❌ '+String(error?.message||error),'error');
        button.disabled=false;
        button.textContent=t('Submit return request','إرسال طلب الإرجاع');
      }
    };

    const first=modal.querySelector('[data-return-item]');
    first?.focus?.();
  }

  async function renderCanonicalOrders(){
    ensureStyle();
    const container=document.getElementById('ordersContent');
    if(!container) return;

    const user=await currentUser();
    if(!user){
      container.innerHTML=
        '<div class="empty-state"><div class="empty-icon">🔐</div><h3>'+esc(t('Login required','تسجيل الدخول مطلوب'))+'</h3>'+
        '<p>'+esc(t('Please login to view your canonical orders.','سجل الدخول لرؤية طلباتك الحقيقية.'))+'</p>'+
        '<button class="btn btn-primary btn-lg" type="button" id="veloraOrdersLogin">'+esc(t('Login','تسجيل الدخول'))+'</button></div>';
      document.getElementById('veloraOrdersLogin')?.addEventListener('click',()=>{
        if(typeof window.openAuthModal==='function') window.openAuthModal('login');
      });
      return;
    }

    container.innerHTML='<div class="velora-op-card"><div style="font-size:1.7rem;">⏳</div><div class="velora-op-muted">'+esc(t('Loading your orders…','جارٍ تحميل طلباتك…'))+'</div></div>';

    try{
      const orders=await loadOrders(user.id);
      if(!orders.length){
        container.innerHTML=
          '<div class="empty-state"><div class="empty-icon">📦</div><h3>'+esc(t('No orders yet','لا توجد طلبات بعد'))+'</h3>'+
          '<p>'+esc(t('Your completed checkouts will appear here.','طلباتك المكتملة من Checkout ستظهر هنا.'))+'</p>'+
          '<button class="btn btn-primary btn-lg" type="button" id="veloraOrdersShop">'+esc(t('Shop Now','تسوق الآن'))+'</button></div>';
        document.getElementById('veloraOrdersShop')?.addEventListener('click',()=>{if(typeof window.navigateTo==='function')window.navigateTo('shop');});
        return;
      }

      container.innerHTML=orders.map(renderOrder).join('');
      container.querySelectorAll('[data-velora-return-order]').forEach(button=>{
        button.addEventListener('click',()=>{
          const order=orders.find(x=>String(x.id)===String(button.getAttribute('data-velora-return-order')));
          const store=groupStores(order?.items||[]).find(x=>String(x.store_id)===String(button.getAttribute('data-velora-return-store')));
          if(order&&store) openReturnModal(order,store);
        });
      });
      container.querySelectorAll('[data-velora-cancel-order]').forEach(button=>{
        button.addEventListener('click',()=>{
          const order=orders.find(x=>String(x.id)===String(button.getAttribute('data-velora-cancel-order')));
          if(order) cancelOrder(order);
        });
      });
    }catch(error){
      console.error('Velora canonical orders',error);
      showError(container,error);
    }
  }

  const legacyRenderOrders=window.renderOrdersPage;
  window.renderOrdersPage=renderCanonicalOrders;

  window.VELORA_RENDER_CANONICAL_ORDERS=renderCanonicalOrders;
  window.VELORA_REQUEST_RETURN_FROM_ORDER=(orderId,storeId)=>{
    return renderCanonicalOrders().then(()=>{
      const container=document.getElementById('ordersContent');
      const button=container?.querySelector('[data-velora-return-order="'+String(orderId)+'"][data-velora-return-store="'+String(storeId)+'"]');
      button?.click();
    });
  };

  console.log('✅ Velora canonical customer orders/returns adapter loaded',!!legacyRenderOrders);
})();
