/* ============================================================
   VELORA — Seller Payout Request UI Adapter
   Uses the existing payout eligibility/request contract.
   The frontend never calculates financial eligibility itself.
   ============================================================ */
(function(){
  'use strict';

  const db=window.mahaSupabase;
  if(!db || typeof db.from!=='function' || typeof db.rpc!=='function') return;

  const esc=(v)=>{
    if(typeof window.escapeHtml==='function') return window.escapeHtml(String(v==null?'':v));
    return String(v==null?'':'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  };

  const money=(n,c)=>{
    try{return new Intl.NumberFormat(
      String(document.documentElement.lang||'en').toLowerCase()==='ar'?'ar-EG':undefined,
      {style:'currency',currency:String(c||'EGP').toUpperCase()}
    ).format(Number(n||0));}
    catch(_){return Number(n||0).toFixed(2)+' '+String(c||'');}
  };

  const t=(en,ar)=>String(document.documentElement.lang||'en').toLowerCase()==='ar'?ar:en;

  const statusText=(v)=>{
    const ar={pending:'قيد الانتظار',processing:'قيد التنفيذ',paid:'تم الدفع',failed:'فشل',cancelled:'ملغى'};
    const s=String(v||'').toLowerCase();
    return String(document.documentElement.lang||'en').toLowerCase()==='ar'?(ar[s]||s):s;
  };

  async function seller(){
    const r=await db.rpc('velora_get_own_seller');
    if(r.error) throw r.error;
    const row=Array.isArray(r.data)?r.data[0]:r.data;
    if(!row) throw new Error('SELLER_NOT_FOUND');
    return row;
  }

  async function loadPayouts(sellerId){
    const r=await db.from('payouts')
      .select('id,amount,currency,status,method,reference,requested_at,processed_at,created_at,updated_at')
      .eq('seller_id',sellerId)
      .order('created_at',{ascending:false})
      .limit(50);
    if(r.error) throw r.error;
    return r.data||[];
  }

  function render(rows,s){
    const c=document.getElementById('sellerContent');
    if(!c) return;

    c.innerHTML=
      '<div class="seller-section-card">'+
        '<div class="velora-op-toolbar">'+
          '<div><h3 style="margin:0;">💸 '+esc(t('Payouts','المدفوعات المستحقة'))+'</h3>'+
          '<div class="velora-op-muted">'+esc(t('Eligibility is calculated by the server from finalized delivered commissions.','الخادم هو الذي يحسب الأهلية من العمولات النهائية للطلبات المسلّمة.'))+'</div></div>'+
          '<button class="btn btn-primary" type="button" id="veloraRequestPayout">'+esc(t('Request payout','طلب سحب'))+'</button>'+
        '</div>'+
        '<div class="velora-op-note" style="margin-bottom:1rem;">'+
          esc(t('Requests are created only when the canonical payout contract finds an eligible balance. External money transfer is still Staff/provider controlled.','لا يتم إنشاء طلب إلا عندما يجد عقد السحب الأساسي رصيدًا مؤهلًا. تحويل الأموال خارجيًا يظل تحت تحكم الموظف/المزوّد.'))+
        '</div>'+
        (rows.length
          ? '<div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>'+esc(t('Amount','المبلغ'))+'</th><th>'+esc(t('Status','الحالة'))+'</th><th>'+esc(t('Method','الطريقة'))+'</th><th>'+esc(t('Reference','المرجع'))+'</th><th>'+esc(t('Requested','الطلب'))+'</th></tr></thead><tbody>'+
            rows.map(p=>'<tr><td><strong>'+esc(money(p.amount,p.currency))+'</strong></td><td><span class="velora-op-status '+esc(String(p.status||''))+'">'+esc(statusText(p.status))+'</span></td><td>'+esc(p.method||'—')+'</td><td>'+esc(p.reference||'—')+'</td><td>'+esc(new Date(p.requested_at||p.created_at).toLocaleString())+'</td></tr>').join('')+
            '</tbody></table></div>'
          : '<div class="velora-op-card"><div class="velora-op-muted">'+esc(t('No payout requests yet.','لا توجد طلبات سحب بعد.'))+'</div></div>')+
      '</div>';

    document.getElementById('veloraRequestPayout')?.addEventListener('click',async ()=>{
      const button=document.getElementById('veloraRequestPayout');
      if(!button) return;
      button.disabled=true;
      button.textContent=t('Checking…','جارٍ التحقق…');
      try{
        const st=await seller();
        const result=await db.rpc('velora_request_seller_payout',{p_currency:s.currency_code||null});
        if(result.error) throw result.error;
        if(window.showToast) window.showToast('✅ '+t('Payout request created.','تم إنشاء طلب السحب.'),'success');
        await window.VELORA_RENDER_SELLER_PAYOUTS(st);
      }catch(e){
        const msg=String(e?.message||e);
        if(window.showToast) window.showToast('ℹ️ '+(
          msg==='NO_PAYOUT_ELIGIBLE_BALANCE'
            ? t('No payout balance is currently eligible.','لا يوجد رصيد مؤهل للسحب حاليًا.')
            : msg
        ),'warning');
        button.disabled=false;
        button.textContent=t('Request payout','طلب سحب');
      }
    });
  }

  async function renderPayouts(existingSeller){
    const c=document.getElementById('sellerContent');
    if(!c) return;
    try{
      const s=existingSeller||await seller();
      c.innerHTML='<div class="velora-op-card"><div style="font-size:1.7rem">⏳</div><div class="velora-op-muted">'+esc(t('Loading payout history…','جارٍ تحميل سجل السحب…'))+'</div></div>';
      const rows=await loadPayouts(s.id);
      render(rows,s);
    }catch(e){
      c.innerHTML='<div class="velora-op-card"><b>'+esc(t('Payouts could not be loaded.','تعذر تحميل المدفوعات المستحقة.'))+'</b><div class="velora-op-muted">'+esc(e?.message||e)+'</div></div>';
    }
  }

  window.VELORA_RENDER_SELLER_PAYOUTS=renderPayouts;

  const baseSection=window.VELORA_CANONICAL_SELLER_SECTION;
  if(typeof baseSection==='function'){
    window.VELORA_CANONICAL_SELLER_SECTION=async function(section,btn){
      if(section==='payouts') return renderPayouts();
      return baseSection.apply(this,arguments);
    };
  }

  function addNav(){
    const nav=document.querySelector('#sellerPlatform .seller-nav');
    if(!nav || nav.querySelector('[data-velora-payout-nav]')) return;
    const item=document.createElement('div');
    item.className='seller-nav-item';
    item.dataset.veloraPayoutNav='1';
    item.dataset.section='payouts';
    item.innerHTML='<span>💸</span><span>'+esc(t('Payouts','المدفوعات'))+'</span>';
    item.onclick=()=>window.VELORA_CANONICAL_SELLER_SECTION('payouts',item);
    nav.appendChild(item);
  }

  const open=window.VELORA_OPEN_SELLER;
  window.VELORA_OPEN_SELLER=async function(){
    const result=typeof open==='function'?await open.apply(this,arguments):undefined;
    setTimeout(addNav,120);
    return result;
  };
  setTimeout(addNav,400);

  console.log('✅ Velora seller payout UI adapter loaded');
})();
