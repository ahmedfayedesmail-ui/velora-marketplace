(()=>{'use strict';
const VPC='__VELORA_CANONICAL_PRODUCT_ADAPTER__';
if(window[VPC])return;
window[VPC]=true;

const db=()=>window.mahaSupabase||window.supabaseClient||window.sb;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=(v,c='EGP')=>Number(v??0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+' '+c;

async function ownSeller(){
  const r=await db()?.rpc('velora_get_own_seller');
  if(r?.error)throw r.error;
  const rows=Array.isArray(r?.data)?r.data:[r?.data];
  const seller=rows[0]||null;
  if(!seller?.id)throw new Error('APPROVED_SELLER_REQUIRED');
  return seller;
}

async function listMine(){
  const seller=await ownSeller();
  const r=await db().from('products')
    .select('id,seller_id,name,brand,category,subcategory,description,price,original_price,stock,status,rating,review_count,emoji,images,tags,currency_code,created_at,updated_at')
    .eq('seller_id',seller.id)
    .order('created_at',{ascending:false});
  if(r.error)throw r.error;
  return {seller,products:Array.isArray(r.data)?r.data:[]};
}

function sellerProductsHtml(products){
  return '<div class="seller-section-card"><div style="display:flex;justify-content:space-between;gap:.8rem;align-items:center;flex-wrap:wrap">'+
    '<h3>🛍️ Your Products ('+products.length+')</h3>'+
    '<button class="btn btn-primary" type="button" id="veloraCanonicalAddProduct">➕ Add Product</button></div>'+
    (products.length?'<div class="seller-table-wrap"><table class="seller-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
      products.map(p=>'<tr>'+
        '<td><strong>'+esc(p.emoji||'📦')+' '+esc(p.name)+'</strong><div style="color:var(--text-muted);font-size:.8rem">'+esc(p.brand||'')+'</div></td>'+
        '<td>'+esc(money(p.price,p.currency_code||'EGP'))+(p.original_price?'<div style="color:var(--text-muted);font-size:.78rem;text-decoration:line-through">'+esc(money(p.original_price,p.currency_code||'EGP'))+'</div>':'')+'</td>'+
        '<td>'+esc(String(p.stock??0))+'</td>'+
        '<td>'+esc(p.status||'pending')+'</td>'+
        '<td><button class="btn btn-outline velora-product-edit" data-product-id="'+esc(p.id)+'" type="button">✏️ Edit</button></td>'+
        '</tr>').join('')+
      '</tbody></table></div>':'<div class="seller-empty"><div class="empty-icon">📦</div><h4>No canonical products yet</h4><p>New products created here are stored in the marketplace database and enter pending review.</p></div>')+
    '</div>';
}

async function loadSellerProducts(){
  const host=document.getElementById('sellerContent'); if(!host)return;
  try{
    const x=await listMine();
    window.__VELORA_CANONICAL_PRODUCTS=x.products;
    if(typeof SELLER_STATE!=='undefined' && SELLER_STATE.currentSection==='products'){
      host.innerHTML=sellerProductsHtml(x.products);
      bindSellerProductButtons();
    }
  }catch(e){
    if(typeof SELLER_STATE!=='undefined' && SELLER_STATE.currentSection==='products'){
      host.innerHTML='<div class="seller-section-card"><strong>Canonical products unavailable</strong><div style="margin-top:.4rem;color:var(--text-muted)">'+esc(e.message||e)+'</div></div>';
    }
  }
}

function bindSellerProductButtons(){
  document.getElementById('veloraCanonicalAddProduct')?.addEventListener('click',()=>window.openAddProductModal?.());
  document.querySelectorAll('.velora-product-edit').forEach(b=>b.addEventListener('click',()=>window.editSellerProduct?.(b.dataset.productId)));
}

window.renderSellerProducts=function(){
  setTimeout(loadSellerProducts,0);
  return '<div class="seller-section-card"><div style="padding:1rem;color:var(--text-muted)">Loading canonical seller products…</div></div>';
};

async function getProduct(id){
  const r=await db().from('products').select('id,name,brand,category,subcategory,description,price,original_price,stock,status,emoji,images,tags,currency_code').eq('id',id).maybeSingle();
  if(r.error)throw r.error;
  if(!r.data)throw new Error('PRODUCT_NOT_FOUND');
  return r.data;
}

function openProductForm(existing){
  let modal=document.getElementById('addProductModal');
  if(!modal){modal=document.createElement('div');modal.id='addProductModal';modal.className='modal';document.body.appendChild(modal);}
  const categories=(typeof VELORA_PRODUCT_CATEGORIES!=='undefined'&&Array.isArray(VELORA_PRODUCT_CATEGORIES))?VELORA_PRODUCT_CATEGORIES:[];
  const image=Array.isArray(existing?.images)&&existing.images[0]?existing.images[0]:'';
  modal.innerHTML='<div class="modal-content modal-wide"><div class="modal-header"><h2>'+esc(existing?'✏️ Edit Product':'➕ Add New Product')+'</h2><button type="button" class="modal-close" aria-label="Close" onclick="closeModal(\'addProductModal\')">✕</button></div>'+
    '<form id="sellerCanonicalProductForm" novalidate>'+
    '<input type="hidden" id="vcpEditId" value="'+esc(existing?.id||'')+'">'+
    '<div class="form-row"><div class="form-group"><label>Product Name *</label><input class="form-input" id="vcpName" required minlength="3" value="'+esc(existing?.name||'')+'"></div><div class="form-group"><label>Brand *</label><input class="form-input" id="vcpBrand" value="'+esc(existing?.brand||'')+'"></div></div>'+
    '<div class="form-row"><div class="form-group"><label>Category</label><select class="form-input" id="vcpCategory"><option value="">Select category</option>'+categories.map(c=>'<option value="'+esc(c.id)+'" '+(String(c.id)===String(existing?.category||'')?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></div><div class="form-group"><label>Subcategory</label><input class="form-input" id="vcpSubcategory" value="'+esc(existing?.subcategory||'')+'"></div></div>'+
    '<div class="form-row"><div class="form-group"><label>Price *</label><input class="form-input" type="number" id="vcpPrice" min="0" step="0.01" required value="'+esc(existing?.price??'')+'"></div><div class="form-group"><label>Old Price</label><input class="form-input" type="number" id="vcpOriginalPrice" min="0" step="0.01" value="'+esc(existing?.original_price??'')+'"></div></div>'+
    '<div class="form-row"><div class="form-group"><label>Stock *</label><input class="form-input" type="number" id="vcpStock" min="0" step="1" required value="'+esc(existing?.stock??0)+'"></div><div class="form-group"><label>Product Icon</label><input class="form-input" id="vcpEmoji" maxlength="16" value="'+esc(existing?.emoji||'📦')+'"></div></div>'+
    '<div class="form-group"><label>Description *</label><textarea class="form-input" id="vcpDescription" rows="4" required>'+esc(existing?.description||'')+'</textarea></div>'+
    '<div class="form-group"><label>Product Image URL '+(existing?'':'*')+'</label><input class="form-input" type="url" id="vcpImageUrl" '+(existing?'':'required')+' value="'+esc(image)+'" placeholder="https://..."><small style="color:var(--text-muted)">Image storage is not provisioned in Restore-Test, so the canonical seller flow accepts a URL only.'+(existing?' On edit, leave blank to keep the existing image.':'')+'</small></div>'+
    '<div class="form-group"><label>Tags</label><input class="form-input" id="vcpTags" value="'+esc(Array.isArray(existing?.tags)?existing.tags.join(', '):'')+'" placeholder="tag1, tag2"></div>'+
    '<div id="vcpError" style="display:none;color:var(--error);background:rgba(244,67,54,.08);padding:.8rem;border-radius:10px;margin-bottom:1rem"></div>'+
    '<div style="display:flex;gap:.75rem;justify-content:flex-end"><button type="button" class="btn btn-outline" onclick="closeModal(\'addProductModal\')">Cancel</button><button type="submit" class="btn btn-primary">'+esc(existing?'💾 Save Changes':'✅ Add Product')+'</button></div>'+
    '</form></div>';
  modal.classList.add('active');document.body.style.overflow='hidden';
  document.getElementById('sellerCanonicalProductForm')?.addEventListener('submit',window.handleAddProduct);
}

window.openAddProductModal=async function(editId){
  try{
    const existing=editId?await getProduct(editId):null;
    openProductForm(existing);
  }catch(e){
    showToast?.('⚠️ '+(e.message||e),'warning');
  }
};

window.editSellerProduct=async function(productId){return window.openAddProductModal(productId)};

window.handleAddProduct=async function(event){
  event?.preventDefault?.();
  const errEl=document.getElementById('vcpError');
  const fail=m=>{if(errEl){errEl.textContent=m;errEl.style.display='block';}showToast?.(m,'warning');};
  try{
    const id=document.getElementById('vcpEditId')?.value.trim()||null;
    const name=document.getElementById('vcpName')?.value.trim();
    const brand=document.getElementById('vcpBrand')?.value.trim()||null;
    const category=document.getElementById('vcpCategory')?.value||null;
    const subcategory=document.getElementById('vcpSubcategory')?.value.trim()||null;
    const price=Number(document.getElementById('vcpPrice')?.value);
    const originalRaw=document.getElementById('vcpOriginalPrice')?.value.trim();
    const originalPrice=originalRaw===''?null:Number(originalRaw);
    const stock=Number(document.getElementById('vcpStock')?.value);
    const description=document.getElementById('vcpDescription')?.value.trim();
    const emoji=document.getElementById('vcpEmoji')?.value.trim()||'📦';
    const imageUrl=document.getElementById('vcpImageUrl')?.value.trim();
    const tags=(document.getElementById('vcpTags')?.value||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(!name||name.length<3)return fail('⚠️ Enter a valid product name.');
    if(!Number.isFinite(price)||price<0)return fail('⚠️ Enter a valid price.');
    if(!Number.isInteger(stock)||stock<0)return fail('⚠️ Enter a valid stock quantity.');
    if(!description)return fail('⚠️ Add a product description.');
    if(imageUrl&&!/^https?:\/\//i.test(imageUrl))return fail('⚠️ Add a valid http(s) image URL.');
    if(!Number.isFinite(originalPrice??0) && originalPrice!==null)return fail('⚠️ Enter a valid old price.');
    const client=db(); if(!client?.rpc)throw new Error('Supabase client unavailable');
    const b=document.querySelector('#sellerCanonicalProductForm button[type="submit"]'); if(b)b.disabled=true;
    let r;
    if(id){
      r=await client.rpc('velora_seller_update_product_full',{p_product_id:id,p_name:name,p_price:price,p_stock:stock,p_category:category,p_brand:brand,p_subcategory:subcategory,p_original_price:originalPrice,p_description:description,p_emoji:emoji,p_image_url:imageUrl,p_tags:tags});
    }else{
      const seller=await ownSeller();
      const store=await client.from('stores').select('currency_code').eq('owner_id',seller.user_id).eq('status','approved').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(store.error)throw store.error;
      r=await client.rpc('velora_seller_create_product_full',{p_name:name,p_price:price,p_stock:stock,p_category:category,p_brand:brand,p_currency:String(store.data?.currency_code||'EGP').toUpperCase(),p_original_price:originalPrice,p_subcategory:subcategory,p_description:description,p_emoji:emoji,p_image_url:imageUrl,p_tags:tags});
    }
    if(r?.error)throw r.error;
    closeModal?.('addProductModal');
    showToast?.(id?'✅ Product updated and remains under review state.':'✅ Product created and sent for review.','success');
    await loadSellerProducts();
  }catch(e){
    const msg=String(e?.message||e);
    if(errEl){errEl.textContent=msg;errEl.style.display='block';}
    showToast?.('⚠️ '+msg,'warning');
    const b=document.querySelector('#sellerCanonicalProductForm button[type="submit"]'); if(b)b.disabled=false;
  }
};


async function loadSellerInventory(){
  const host=document.getElementById('sellerContent'); if(!host)return;
  try{
    const x=await listMine();
    const low=x.products.filter(p=>Number(p.stock||0)>0&&Number(p.stock||0)<5).length;
    const out=x.products.filter(p=>Number(p.stock||0)<=0).length;
    host.innerHTML='<div class="seller-kpi-grid">'+
      '<div class="seller-kpi-card"><div class="seller-kpi-label">Products</div><div class="seller-kpi-value">'+esc(String(x.products.length))+'</div></div>'+
      '<div class="seller-kpi-card"><div class="seller-kpi-label">Low stock</div><div class="seller-kpi-value">'+esc(String(low))+'</div></div>'+
      '<div class="seller-kpi-card"><div class="seller-kpi-label">Out of stock</div><div class="seller-kpi-value">'+esc(String(out))+'</div></div>'+
    '</div>'+
    '<div class="seller-section-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:.8rem;flex-wrap:wrap"><h3>📊 Canonical Inventory</h3><span style="color:var(--text-muted);font-size:.82rem">Stock is saved through the canonical product RPC.</span></div>'+
    (x.products.length?'<div class="seller-table-wrap"><table class="seller-table"><thead><tr><th>Product</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>'+
      x.products.map(p=>{
        const s=Number(p.stock??0);
        const state=s<=0?'Out of Stock':s<5?'Low Stock':'In Stock';
        return '<tr><td><strong>'+esc(p.emoji||'📦')+' '+esc(p.name)+'</strong></td><td>'+esc(String(s))+'</td><td>'+esc(state)+'</td><td><button class="btn btn-outline velora-product-edit" data-product-id="'+esc(p.id)+'" type="button">✏️ Edit</button></td></tr>';
      }).join('')+
    '</tbody></table></div>':'<div class="seller-empty"><div class="empty-icon">📭</div><h4>No canonical products</h4></div>')+
    '</div>';
    bindSellerProductButtons();
  }catch(e){
    host.innerHTML='<div class="seller-section-card"><strong>Canonical inventory unavailable</strong><div style="margin-top:.4rem;color:var(--text-muted)">'+esc(e.message||e)+'</div></div>';
  }
}

window.renderSellerInventory=function(){
  setTimeout(loadSellerInventory,0);
  return '<div class="seller-section-card"><div style="padding:1rem;color:var(--text-muted)">Loading canonical inventory…</div></div>';
};

window.confirmDeleteProduct=function(){
  showToast?.('ℹ️ Hard delete is intentionally not exposed in the canonical seller product lifecycle.','info');
};

async function loadAdminProducts(){
  const host=document.getElementById('adminContent'); if(!host)return;
  try{
    const r=await db().from('products').select('id,seller_id,name,category,price,original_price,stock,status,currency_code,created_at').order('created_at',{ascending:false});
    if(r.error)throw r.error;
    const rows=Array.isArray(r.data)?r.data:[];
    window.__VELORA_CANONICAL_ADMIN_PRODUCTS=rows;
    host.innerHTML=adminProductsHtml(rows);
  }catch(e){
    host.innerHTML='<div class="admin-section-card"><strong>Canonical product moderation unavailable</strong><div style="margin-top:.4rem;color:var(--text-muted)">'+esc(e.message||e)+'</div></div>';
  }
}
function adminProductsHtml(rows){
  const pending=rows.filter(p=>p.status==='pending');
  return '<div class="admin-tabs"><button class="admin-tab active">All ('+rows.length+')</button><button class="admin-tab">⏳ Pending ('+pending.length+')</button><button class="admin-tab">✅ Approved ('+rows.filter(p=>p.status==='approved').length+')</button><button class="admin-tab">❌ Rejected ('+rows.filter(p=>p.status==='rejected').length+')</button></div>'+
    '<div class="admin-section-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Seller</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
    (rows.length?rows.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong><div style="color:var(--text-muted);font-size:.78rem">'+esc(p.category||'')+'</div></td><td>'+esc(p.seller_id)+'</td><td>'+esc(money(p.price,p.currency_code||'EGP'))+'</td><td>'+esc(String(p.stock??0))+'</td><td>'+esc(p.status)+'</td><td>'+
      (p.status==='pending'?'<button class="admin-action-btn success velora-admin-approve" data-id="'+esc(p.id)+'">✅</button><button class="admin-action-btn danger velora-admin-reject" data-id="'+esc(p.id)+'">❌</button>':'—')+
      '</td></tr>').join(''):'<tr><td colspan="6">No canonical products.</td></tr>')+
    '</tbody></table></div></div>';
}
window.renderAdminProducts=function(){setTimeout(loadAdminProducts,0);return '<div class="admin-section-card"><div style="padding:1rem;color:var(--text-muted)">Loading canonical product moderation…</div></div>'};
window.approveProduct=async function(a,b){
  const id=b||a;
  try{
    const r=await db().rpc('velora_set_product_status',{p_product_id:id,p_status:'approved',p_reason:null});
    if(r.error)throw r.error;
    showToast?.('✅ Product approved','success');
    await loadAdminProducts();
  }catch(e){showToast?.('⚠️ '+(e.message||e),'warning');}
};
window.rejectProduct=async function(a,b){
  const id=b||a;
  const reason=prompt('Rejection reason (optional):');
  if(reason===null)return;
  try{
    const r=await db().rpc('velora_set_product_status',{p_product_id:id,p_status:'rejected',p_reason:reason||null});
    if(r.error)throw r.error;
    showToast?.('❌ Product rejected','info');
    await loadAdminProducts();
  }catch(e){showToast?.('⚠️ '+(e.message||e),'warning');}
};

setTimeout(()=>{try{
  if(typeof SELLER_STATE!=='undefined' && SELLER_STATE.currentSection==='products')loadSellerProducts();
  if(document.getElementById('adminContent') && document.querySelector('#adminPlatform')){ /* admin remains lazy */ }
}catch(e){}},0);
})();