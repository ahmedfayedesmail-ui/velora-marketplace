/* ============================================================
   VELORA STAGE 8 — CANONICAL SELLER + ADMIN CONTROLLER
   This is an additive authoritative UI adapter over the existing
   marketplace shell. Canonical Supabase data wins over local demo data.
   ============================================================ */
(function(){
  'use strict';
  const PLATFORM_TRACE_ON = (()=>{try{return new URLSearchParams(window.location.search).get('trace')==='1'}catch(_){return false}})();
  function platformTrace(label,payload){
    const prefix='[PLATFORM TRACE] '+label;
    try{console.log(prefix,payload||{});}catch(_){}
    if(!PLATFORM_TRACE_ON)return;
    try{
      let panel=document.getElementById('__veloraPlatformTrace');
      if(!panel){
        panel=document.createElement('pre');
        panel.id='__veloraPlatformTrace';
        panel.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;max-height:38vh;overflow:auto;margin:0;padding:10px;border:1px solid rgba(255,255,255,.28);border-radius:12px;background:#050505;color:#fff;font:11px/1.4 monospace;white-space:pre-wrap;box-shadow:0 8px 30px rgba(0,0,0,.45)';
        document.body?.appendChild(panel);
      }
      const stamp=new Date().toISOString().slice(11,23);
      panel.textContent+=stamp+' '+prefix+' '+JSON.stringify(payload||{},null,2)+'\\n';
      panel.scrollTop=panel.scrollHeight;
    }catch(_){}
  }
  window.__VELORA_PLATFORM_TRACE__=platformTrace;

  function scheduleAdminPostMountTrace(){
    [100,500,1500].forEach(delay=>{
      setTimeout(()=>{
        const el=document.getElementById('adminPlatform');
        if(!el){
          platformTrace('POST-MOUNT +'+delay+'ms',{
            exists:false,active:false,display:null,visibility:null,opacity:null,zIndex:null,
            boundingWidth:0,boundingHeight:0
          });
          return;
        }
        let computed=null,rect=null;
        try{computed=window.getComputedStyle(el);}catch(_){}
        try{rect=el.getBoundingClientRect();}catch(_){}
        platformTrace('POST-MOUNT +'+delay+'ms',{
          exists:true,
          active:el.classList.contains('active'),
          display:computed?.display||null,
          visibility:computed?.visibility||null,
          opacity:computed?.opacity||null,
          zIndex:computed?.zIndex||null,
          boundingWidth:Math.round(rect?.width||0),
          boundingHeight:Math.round(rect?.height||0)
        });
      },delay);
    });
  }

  const db = window.mahaSupabase;
  if(!db){ console.warn('Velora Stage 8: Supabase client unavailable'); return; }

  const esc = (v)=>escapeHtml(String(v ?? ''));
  const money = (n,c)=>{
    const amount=Number(n||0);
    try{return new Intl.NumberFormat(undefined,{style:'currency',currency:c||window.VELORA_CURRENCY||'USD'}).format(amount)}catch(_){return `${amount.toFixed(2)} ${c||''}`}
  };
  const cls = (s)=>String(s||'').toLowerCase().replace(/[^a-z0-9_-]/g,'');
  const toastErr = (e)=>{console.error(e);showToast('❌ '+(e?.message||'Operation failed. Please try again.'),'error');};

  async function authUser(){
    const {data,error}=await db.auth.getUser();
    if(error) throw error;
    if(!data?.user) throw new Error('Please login first');
    return data.user;
  }
  async function canonicalRoles(uid){
    const {data,error}=await db.from('user_roles').select('role').eq('user_id',uid);
    if(error) throw error;
    return (data||[]).map(r=>String(r.role).toLowerCase());
  }
  async function canonicalSeller(uid){
    const {data,error}=await db.rpc('velora_get_own_seller');
    if(error) throw error;
    const row=Array.isArray(data)?data[0]:data;
    if(row && uid && String(row.user_id||'')!==String(uid||'')) return null;
    return row||null;
  }
  async function canonicalStore(uid){
    const {data,error}=await db.from('stores').select('*').eq('owner_id',uid).order('created_at',{ascending:true}).limit(1).maybeSingle();
    if(error) throw error;
    return data;
  }
  async function sellerProducts(sellerId){
    const {data,error}=await db.from('products').select('*').eq('seller_id',sellerId).order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }
  async function sellerOrders(sellerId){
    const {data,error}=await db.rpc('velora_get_seller_orders',{p_seller_id:sellerId});
    if(error) throw error;
    return data||[];
  }
  async function countTable(table, filter){
    let q=db.from(table).select('*',{count:'exact',head:true});
    if(filter) q=filter(q);
    const {count,error}=await q;
    if(error) throw error;
    return count||0;
  }
  function setLoading(id,msg='Loading…'){const c=document.getElementById(id);if(c)c.innerHTML=`<div class="velora-op-card"><div style="font-size:1.8rem">⏳</div><div class="velora-op-muted">${esc(msg)}</div></div>`}

  /* ---------- SELLER ---------- */
  async function openCanonicalSeller(){
    try{
      const user=await authUser();
      const seller=await canonicalSeller(user.id);
      if(!seller){
        showToast('⚠️ Your seller account is not active yet. Please apply first.','warning');
        if(typeof openSellerRegistration==='function') return openSellerRegistration();
        return;
      }
      window.VELORA_CANONICAL_SELLER=seller;
      let platform=document.getElementById('sellerPlatform');
      if(!platform){platform=document.createElement('div');platform.id='sellerPlatform';platform.className='seller-platform';document.body.appendChild(platform)}
      platform.innerHTML=window.VeloraI18n.html(canonicalSellerLayout(seller));
      platform.classList.add('active');
      document.body.style.overflow='hidden';
      await canonicalSellerSection('dashboard');
    }catch(e){toastErr(e)}
  }
  function canonicalSellerLayout(s){
    const status=cls(s.status);
    return `<aside class="seller-sidebar" id="sellerSidebar">
      <div class="seller-sidebar-header"><div class="seller-store-logo">🏪</div><div class="seller-store-info"><div class="seller-store-name">${esc(s.store_name)}</div><div class="seller-store-sub">Canonical Seller Center</div></div><button class="seller-sidebar-close" type="button" onclick="closeSellerSidebar()" aria-label="Close seller navigation">✕</button></div>
      <nav class="seller-nav">
        <div class="seller-nav-section"><div class="seller-nav-title">Main</div>
          <div class="seller-nav-item active" data-section="dashboard" onclick="window.VELORA_CANONICAL_SELLER_SECTION('dashboard',this)"><span>📊</span><span>Dashboard</span></div>
          <div class="seller-nav-item" data-section="products" onclick="window.VELORA_CANONICAL_SELLER_SECTION('products',this)"><span>🛍️</span><span>Products</span></div>
          <div class="seller-nav-item" data-section="inventory" onclick="window.VELORA_CANONICAL_SELLER_SECTION('inventory',this)"><span>📦</span><span>Inventory</span></div>
          <div class="seller-nav-item" data-section="orders" onclick="window.VELORA_CANONICAL_SELLER_SECTION('orders',this)"><span>🧾</span><span>Orders</span></div>
        </div>
        <div class="seller-nav-section"><div class="seller-nav-title">Store</div>
          <div class="seller-nav-item" data-section="settings" onclick="window.VELORA_CANONICAL_SELLER_SECTION('settings',this)"><span>⚙️</span><span>Store Settings</span></div>
        </div>
      </nav>
      <button class="seller-back-btn" onclick="window.VELORA_CLOSE_SELLER()"><span>⬅️</span><span>Back to Store</span></button>
    </aside>
    <div class="seller-sidebar-backdrop" id="sellerSidebarBackdrop" onclick="closeSellerSidebar()" aria-hidden="true"></div>
    <main class="seller-main"><header class="seller-header"><button class="seller-menu-btn" onclick="toggleSellerSidebar()">☰</button><div class="seller-header-title" id="sellerHeaderTitle">Dashboard</div><div class="seller-header-actions"><div class="velora-op-status ${status}">${status==='approved'?'✅':'⏳'} ${esc(s.status)}</div><button class="seller-icon-btn" onclick="window.VELORA_CLOSE_SELLER()">🚪</button></div></header><div class="seller-content" id="sellerContent"></div></main>`;
  }
  async function canonicalSellerSection(section,btn){
    const c=document.getElementById('sellerContent');if(!c)return;
    if(typeof closeSellerSidebar==='function') closeSellerSidebar();
    document.querySelectorAll('.seller-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');
    const titles={dashboard:'Dashboard',products:'Products',inventory:'Inventory',orders:'Orders',settings:'Store Settings'};const h=document.getElementById('sellerHeaderTitle');if(h)h.textContent=titles[section]||section;
    try{
      const seller=window.VELORA_CANONICAL_SELLER||await canonicalSeller((await authUser()).id); window.VELORA_CANONICAL_SELLER=seller; window.VELORA_CANONICAL_STORE=window.VELORA_CANONICAL_STORE||await canonicalStore((await authUser()).id);
      setLoading('sellerContent','');
      if(section==='dashboard'){
        const [products,orders]=await Promise.all([sellerProducts(seller.id),sellerOrders(seller.id)]);
        const earnings=orders.reduce((s,o)=>s+Number(o.seller_earning||0),0);
        const pending=orders.filter(o=>['pending','confirmed'].includes(String(o.order_status))).length;
        c.innerHTML=window.VeloraI18n.html(`<div class="seller-welcome"><h1>Welcome back 👋</h1><p>Canonical Seller Center — live from Supabase.</p></div><div class="velora-op-grid"><div class="velora-op-kpi"><div style="font-size:1.5rem">🛍️</div><div class="kpi-value">${products.length}</div><div class="kpi-label">Products</div></div><div class="velora-op-kpi"><div style="font-size:1.5rem">🧾</div><div class="kpi-value">${new Set(orders.map(o=>o.order_id)).size}</div><div class="kpi-label">Orders</div></div><div class="velora-op-kpi"><div style="font-size:1.5rem">⏳</div><div class="kpi-value">${pending}</div><div class="kpi-label">Needs Attention</div></div><div class="velora-op-kpi"><div style="font-size:1.5rem">💰</div><div class="kpi-value" style="font-size:1.05rem">${money(earnings,(window.VELORA_CANONICAL_STORE&&window.VELORA_CANONICAL_STORE.currency_code)||window.VELORA_CURRENCY||'USD')}</div><div class="kpi-label">Seller Earnings</div></div></div><div class="seller-section-card"><h3>⚡ Seller Operations</h3><div class="velora-op-actions"><button onclick="window.VELORA_CANONICAL_SELLER_SECTION('products')">➕ Manage Products</button><button onclick="window.VELORA_CANONICAL_SELLER_SECTION('inventory')">📦 Inventory</button><button onclick="window.VELORA_CANONICAL_SELLER_SECTION('orders')">🧾 Orders</button><button onclick="window.VELORA_CANONICAL_SELLER_SECTION('settings')">⚙️ Store Settings</button></div></div>`);
      } else if(section==='products') await renderCanonicalProducts(seller);
      else if(section==='inventory') await renderCanonicalInventory(seller);
      else if(section==='orders') await renderCanonicalOrders(seller);
      else if(section==='settings') await renderCanonicalSellerSettings(seller);
    }catch(e){c.innerHTML=`<div class="velora-op-card"><b>Could not load this section.</b><div class="velora-op-muted">${esc(e?.message||e)}</div></div>`;console.error(e)}
  }
  async function renderCanonicalProducts(s){
    const c=document.getElementById('sellerContent');const products=await sellerProducts(s.id);
    c.innerHTML=window.VeloraI18n.html(`<div class="seller-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🛍️ Products (${products.length})</h3><div class="velora-op-muted">New products enter <b>pending</b> review and cannot self-approve.</div></div><button class="btn btn-primary" onclick="window.VELORA_OPEN_PRODUCT_MODAL()">➕ Add Product</button></div><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>${products.length?products.map(p=>`<tr><td><strong>${esc(p.emoji||'📦')} ${esc(p.name)}</strong><div class="velora-op-muted">${esc(p.sku||p.slug||'')}</div></td><td>${money(p.price,p.currency_code||s.currency_code||'USD')}</td><td>${Number(p.stock||0)}</td><td><span class="velora-op-status ${cls(p.status)}">${esc(p.status)}</span></td><td>${new Date(p.updated_at||p.created_at).toLocaleDateString()}</td><td><div class="velora-op-actions"><button onclick="window.VELORA_EDIT_PRODUCT('${p.id}')">✏️</button><button class="velora-op-danger" onclick="window.VELORA_DELETE_PRODUCT('${p.id}')">🗑️</button></div></td></tr>`).join(''):`<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No canonical products yet.</td></tr>`}</tbody></table></div></div>`);
  }
  async function renderCanonicalInventory(s){
    const c=document.getElementById('sellerContent');const products=await sellerProducts(s.id);const total=products.reduce((n,p)=>n+Number(p.stock||0),0);const low=products.filter(p=>Number(p.stock||0)>0&&Number(p.stock||0)<=5).length;const out=products.filter(p=>Number(p.stock||0)<=0).length;
    c.innerHTML=window.VeloraI18n.html(`<div class="velora-op-grid"><div class="velora-op-kpi"><div class="kpi-value">${total}</div><div class="kpi-label">Total Units</div></div><div class="velora-op-kpi"><div class="kpi-value">${low}</div><div class="kpi-label">Low Stock</div></div><div class="velora-op-kpi"><div class="kpi-value">${out}</div><div class="kpi-label">Out of Stock</div></div></div><div class="seller-section-card"><h3>📦 Inventory</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Product</th><th>Stock</th><th>Update</th><th>Status</th></tr></thead><tbody>${products.map(p=>`<tr><td>${esc(p.name)}</td><td><b>${Number(p.stock||0)}</b></td><td><div class="velora-op-actions"><button onclick="window.VELORA_CHANGE_STOCK('${p.id}',${Math.max(0,Number(p.stock||0)-1)})">−1</button><button onclick="window.VELORA_CHANGE_STOCK('${p.id}',${Number(p.stock||0)+1})">+1</button><button onclick="window.VELORA_SET_STOCK('${p.id}',${Number(p.stock||0)})">Set</button></div></td><td><span class="velora-op-status ${Number(p.stock||0)<=0?'out-of-stock':Number(p.stock||0)<=5?'processing':'active'}">${Number(p.stock||0)<=0?'out of stock':Number(p.stock||0)<=5?'low':'healthy'}</span></td></tr>`).join('')}</tbody></table></div></div>`);
  }
  async function renderCanonicalOrders(s){
    const c=document.getElementById('sellerContent');const rows=await sellerOrders(s.id);const orderIds=[...new Set(rows.map(r=>String(r.order_id)))];
    c.innerHTML=window.VeloraI18n.html(`<div class="seller-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🧾 Seller Orders (${orderIds.length})</h3><div class="velora-op-muted">Only order items belonging to this seller are returned by the canonical RPC.</div></div></div><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>${orderIds.length?orderIds.map(id=>{const rs=rows.filter(r=>String(r.order_id)===id);const first=rs[0];const subtotal=rs.reduce((n,r)=>n+Number(r.seller_earning||0),0);return `<tr><td><strong>#${esc(first.order_number)}</strong></td><td>${esc(first.customer_name||'Customer')}<div class="velora-op-muted">${esc(first.customer_city||'')}</div></td><td>${rs.reduce((n,r)=>n+Number(r.quantity||0),0)}</td><td>${money(subtotal,first.currency||s.currency_code||'USD')}</td><td><span class="velora-op-status ${cls(first.payment_status)}">${esc(first.payment_status)}</span></td><td><span class="velora-op-status ${cls(first.order_status)}">${esc(first.order_status)}</span></td></tr>`}).join(''):`<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No seller orders yet.</td></tr>`}</tbody></table></div></div>`);
  }
  async function renderCanonicalSellerSettings(s){
    const store=await canonicalStore(s.user_id);
    const c=document.getElementById('sellerContent');
    c.innerHTML=window.VeloraI18n.html(`<div class="seller-section-card"><h3>⚙️ Store Settings</h3><div class="velora-op-note">Your status, approval and performance metrics are protected server-side. This page only edits safe storefront profile fields.</div><form onsubmit="window.VELORA_SAVE_SELLER_SETTINGS(event,'${s.id}')" style="margin-top:1rem"><div class="form-row"><div class="form-group"><label>Store Name</label><input class="form-input" id="vsStoreName" value="${esc(s.store_name)}" required></div><div class="form-group"><label>Store Slug</label><input class="form-input" id="vsStoreSlug" value="${esc(s.store_slug)}" pattern="[a-z0-9-]+" required></div></div><div class="form-group"><label>Description</label><textarea class="form-textarea" id="vsDesc" rows="4">${esc(s.description||'')}</textarea></div><div class="form-row"><div class="form-group"><label>Phone</label><input class="form-input" id="vsPhone" value="${esc(s.phone||'')}"></div><div class="form-group"><label>Logo URL</label><input class="form-input" id="vsLogo" value="${esc(s.logo_url||'')}"></div></div><div class="form-row"><div class="form-group"><label>Category</label><input class="form-input" id="vsCategory" value="${esc(s.category||'')}"></div><div class="form-group"><label>Product Type</label><select class="form-select" id="vsType"><option value="physical" ${s.product_type==='physical'?'selected':''}>Physical</option><option value="digital" ${s.product_type==='digital'?'selected':''}>Digital</option><option value="services" ${s.product_type==='services'?'selected':''}>Services</option></select></div></div><div class="velora-op-note" style="margin-top:1rem">Store backend: <b>${esc(store?.name||s.store_name)}</b> · ${esc(store?.status||s.status)}</div><button class="btn btn-primary btn-block" style="margin-top:1rem">Save Store Profile</button></form></div>`);
  }
  async function saveSellerSettings(e,id){e.preventDefault();try{const payload={p_seller_id:id,p_store_name:document.getElementById('vsStoreName').value,p_store_slug:document.getElementById('vsStoreSlug').value,p_description:document.getElementById('vsDesc').value,p_phone:document.getElementById('vsPhone').value,p_logo_url:document.getElementById('vsLogo').value,p_category:document.getElementById('vsCategory').value,p_product_type:document.getElementById('vsType').value};const {error}=await db.rpc('velora_update_seller_profile',payload);if(error)throw error;window.VELORA_CANONICAL_SELLER=await canonicalSeller((await authUser()).id);showToast('✅ Seller profile updated','success');await canonicalSellerSection('settings')}catch(e){toastErr(e)}}
  async function openProductModal(productId){
    let p=null;const s=window.VELORA_CANONICAL_SELLER;if(productId){const {data,error}=await db.from('products').select('*').eq('id',productId).eq('seller_id',s.id).maybeSingle();if(error)throw error;p=data;if(!p)throw new Error('Product not found')}
    let translations={};
    if(productId){try{const r=await db.from('product_translations').select('language_code,name,description,seo_title,seo_description').eq('product_id',productId);(r.data||[]).forEach(x=>translations[x.language_code]=x)}catch(_){}
    }
    const localeMeta=(typeof meta==='function'?meta():{})||{};
    const localeCodes=Object.keys(localeMeta).filter(x=>x!=='en');
    let modal=document.getElementById('veloraCanonicalProductModal');if(!modal){modal=document.createElement('div');modal.id='veloraCanonicalProductModal';modal.className='modal';document.body.appendChild(modal)}
    const tRows=localeCodes.map(lang=>{const t=translations[lang]||{};const label=localeMeta[lang]?.name||lang;return `<details class="velora-loc-editor-item"><summary>🌐 ${esc(label)} <span class="velora-op-muted">(${esc(lang)})</span></summary><div class="form-row" style="margin-top:10px"><div class="form-group"><label>Name — ${esc(label)}</label><input class="form-input" id="vcTName_${esc(lang)}" value="${esc(t.name||'')}"></div><div class="form-group"><label>SEO title — ${esc(label)}</label><input class="form-input" id="vcTSeo_${esc(lang)}" value="${esc(t.seo_title||'')}"></div></div><div class="form-group"><label>Description — ${esc(label)}</label><textarea class="form-textarea" id="vcTDesc_${esc(lang)}" rows="3">${esc(t.description||'')}</textarea></div><div class="form-group"><label>SEO description — ${esc(label)}</label><textarea class="form-textarea" id="vcTSeoDesc_${esc(lang)}" rows="2">${esc(t.seo_description||'')}</textarea></div></details>`}).join('');
    modal.innerHTML=window.VeloraI18n.html(`<div class="modal-content velora-op-modal"><div class="modal-header"><h2>${p?'✏️ Edit Product':'➕ Add Product'}</h2><button class="modal-close" onclick="closeModal('veloraCanonicalProductModal')">✕</button></div><form onsubmit="window.VELORA_SAVE_PRODUCT(event,'${productId||''}')"><div class="form-row"><div class="form-group"><label>Product Name *</label><input class="form-input" id="vcName" value="${esc(p?.name||'')}" required minlength="2"></div><div class="form-group"><label>Brand</label><input class="form-input" id="vcBrand" value="${esc(p?.brand||'')}"></div></div><div class="form-row"><div class="form-group"><label>Price *</label><input class="form-input" id="vcPrice" type="number" step="0.01" min="0" value="${Number(p?.price||0)}" required></div><div class="form-group"><label>Stock *</label><input class="form-input" id="vcStock" type="number" step="1" min="0" value="${Number(p?.stock||0)}" required></div></div><div class="form-row"><div class="form-group"><label>Category</label><input class="form-input" id="vcCategory" value="${esc(p?.category||'')}"></div><div class="form-group"><label>Subcategory</label><input class="form-input" id="vcSubcategory" value="${esc(p?.subcategory||'')}"></div></div><div class="form-group"><label>Image URL</label><input class="form-input" id="vcImage" value="${esc(Array.isArray(p?.images)?(p.images[0]||''):'')}" placeholder="https://..."></div><div class="form-group"><label>Description</label><textarea class="form-textarea" id="vcDesc" rows="4">${esc(p?.description||'')}</textarea></div><div class="form-group"><label>Tags (comma-separated)</label><input class="form-input" id="vcTags" value="${esc(Array.isArray(p?.tags)?p.tags.join(', '):'')}"></div><div class="velora-loc-editor"><div class="velora-loc-editor-head"><strong>🌍 Localized Product Content</strong><span class="velora-op-muted">Add translated product names and descriptions. Blank languages remain on fallback.</span></div>${tRows||'<div class="velora-op-note">No additional locales configured.</div>'}</div><div class="velora-op-note">${p?'Product status stays controlled by Admin/Owner. Editing never self-approves it.':'New products will be submitted as <b>pending</b> for moderation. Add translations after creation.'}</div><button class="btn btn-primary btn-block" style="margin-top:1rem">${p?'Save Changes':'Create Product'}</button></form></div>`);
    modal.classList.add('active');document.body.style.overflow='hidden';
  }
  async function saveProduct(e,productId){e.preventDefault();try{const s=window.VELORA_CANONICAL_SELLER;const store=await canonicalStore(s.user_id);if(!store)throw new Error('Seller store not found');const image=(document.getElementById('vcImage').value||'').trim();const tags=(document.getElementById('vcTags').value||'').split(',').map(x=>x.trim()).filter(Boolean);const values={name:document.getElementById('vcName').value.trim(),brand:document.getElementById('vcBrand').value.trim()||null,category:document.getElementById('vcCategory').value.trim()||null,subcategory:document.getElementById('vcSubcategory').value.trim()||null,description:document.getElementById('vcDesc').value.trim()||null,price:Number(document.getElementById('vcPrice').value),stock:Math.max(0,Number(document.getElementById('vcStock').value)),images:image?[image]:[],tags};let savedId=productId;if(productId){const {error}=await db.from('products').update(values).eq('id',productId).eq('seller_id',s.id);if(error)throw error;showToast('✅ Product updated','success')}else{const {data,error}=await db.from('products').insert({...values,seller_id:s.id,store_id:store.id,currency_code:store.currency_code,status:'pending',rating:0,review_count:0,ingredients:[],benefits:[],skin_types:[],concerns:[],tax_exempt:false}).select('id').single();if(error)throw error;savedId=data?.id;showToast('✅ Product created and sent for review','success')}
      if(savedId){const localeMeta=(typeof meta==='function'?meta():{})||{};for(const lang of Object.keys(localeMeta).filter(x=>x!=='en')){const name=(document.getElementById('vcTName_'+lang)?.value||'').trim();if(!name)continue;const desc=(document.getElementById('vcTDesc_'+lang)?.value||'').trim()||null;const seo=(document.getElementById('vcTSeo_'+lang)?.value||'').trim()||null;const seoDesc=(document.getElementById('vcTSeoDesc_'+lang)?.value||'').trim()||null;const r=await db.rpc('velora_upsert_product_translation',{p_product_id:savedId,p_language_code:lang,p_name:name,p_description:desc,p_seo_title:seo,p_seo_description:seoDesc});if(r.error)throw r.error;}}
      closeModal('veloraCanonicalProductModal');await canonicalSellerSection('products')}catch(e){toastErr(e)}}
  async function deleteProduct(id){if(!confirm('Remove this product from your seller catalog?'))return;try{const s=window.VELORA_CANONICAL_SELLER;const {error}=await db.from('products').delete().eq('id',id).eq('seller_id',s.id);if(error)throw error;showToast('🗑️ Product removed','info');await canonicalSellerSection('products')}catch(e){toastErr(e)}}
  async function setStock(id,value){try{const s=window.VELORA_CANONICAL_SELLER;const q=Math.max(0,Number(value||0));const {error}=await db.from('products').update({stock:q,updated_at:new Date().toISOString()}).eq('id',id).eq('seller_id',s.id);if(error)throw error;await canonicalSellerSection('inventory')}catch(e){toastErr(e)}}

  /* ---------- ADMIN / OWNER ---------- */
  async function openCanonicalAdmin(){
    platformTrace('openCanonicalAdmin start',{
      locale:window.VELORA_GLOBAL_LOCALE,
      stateLocale:window.VELORA_GLOBAL_LOCALE_STATE?.locale,
      documentElementLang:document.documentElement.lang,
      languageSelect:document.getElementById('languageSelect')?.value||null,
      openAdminPlatform:typeof window.openAdminPlatform==='function' ? window.openAdminPlatform.toString().slice(0,180) : null,
      canonicalOpenAdmin:typeof window.VELORA_OPEN_ADMIN==='function' ? window.VELORA_OPEN_ADMIN.toString().slice(0,180) : null
    });
    try{
      platformTrace('openCanonicalAdmin auth begin');
      const user=await authUser();
      platformTrace('openCanonicalAdmin auth ok',{hasUser:!!user});
      const roles=await canonicalRoles(user.id);
      platformTrace('openCanonicalAdmin roles',{roles});
      if(!roles.includes('admin')&&!roles.includes('owner')){
        platformTrace('openCanonicalAdmin role denied',{roles});
        showToast('🔒 Admin/Owner access only','error');
        return;
      }
      window.VELORA_ADMIN_ROLES=roles;
      let p=document.getElementById('adminPlatform');
      platformTrace('openCanonicalAdmin container before',{
        exists:!!p,
        active:!!p?.classList.contains('active'),
        id:p?.id||null
      });
      if(!p){
        p=document.createElement('div');
        p.id='adminPlatform';
        p.className='admin-platform';
        document.body.appendChild(p);
        platformTrace('openCanonicalAdmin container created',{id:p.id});
      }
      const layout=canonicalAdminLayout();
      platformTrace('openCanonicalAdmin layout built',{
        layoutType:typeof layout,
        layoutLength:String(layout||'').length
      });
      p.innerHTML=layout;
      p.classList.add('active');
      document.body.style.overflow='hidden';
      try{window.VELORA_I18N_RENDER?.(p);}catch(_){}
      platformTrace('openCanonicalAdmin shell active',{
        exists:!!document.getElementById('adminPlatform'),
        active:!!document.getElementById('adminPlatform')?.classList.contains('active'),
        adminContent:!!document.getElementById('adminContent')
      });
      scheduleAdminPostMountTrace();
      platformTrace('openCanonicalAdmin before dashboard');
      await canonicalAdminSection('dashboard');
      platformTrace('openCanonicalAdmin dashboard complete',{
        adminPlatformExists:!!document.getElementById('adminPlatform'),
        adminActive:!!document.getElementById('adminPlatform')?.classList.contains('active'),
        adminContentExists:!!document.getElementById('adminContent'),
        adminContentChildren:document.getElementById('adminContent')?.children?.length||0,
        adminContentInnerLength:document.getElementById('adminContent')?.innerHTML?.length||0,
        localeSnapshot:{
          locale:window.VELORA_GLOBAL_LOCALE,
          stateLocale:window.VELORA_GLOBAL_LOCALE_STATE?.locale,
          documentElementLang:document.documentElement.lang,
          languageSelect:document.getElementById('languageSelect')?.value||null,
          dateLocale:window.VELORA_GLOBAL_LOCALE_STATE?.date_locale||null,
          country:window.VELORA_GLOBAL_LOCALE_STATE?.country_code||null,
          currency:window.VELORA_GLOBAL_LOCALE_STATE?.currency_code||null
        }
      });
    }catch(e){
      platformTrace('CRITICAL EXTRACTED ERROR inside openCanonicalAdmin',{
        message:e?.message||String(e),
        stack:e?.stack||null,
        name:e?.name||null
      });
      toastErr(e);
    }
  }
  function canonicalAdminLayout(){return `<aside class="admin-sidebar" id="adminSidebar"><div class="admin-sidebar-header"><div class="admin-logo">⚙️</div><div class="admin-store-info"><div class="admin-store-name">Velora Operations</div><div class="admin-store-sub">${(window.VELORA_ADMIN_ROLES||[]).includes('owner')?'Owner':'Admin'}</div></div><button class="admin-sidebar-close" type="button" onclick="closeAdminSidebar()" aria-label="Close admin navigation">✕</button></div><nav class="admin-nav"><div class="admin-nav-section"><div class="admin-nav-title">Overview</div><div class="admin-nav-item active" onclick="window.VELORA_CANONICAL_ADMIN_SECTION('dashboard',this)"><span>📊</span><span>Dashboard</span></div></div><div class="admin-nav-section"><div class="admin-nav-title">Operations</div><div class="admin-nav-item" onclick="window.VELORA_CANONICAL_ADMIN_SECTION('sellers',this)"><span>🏪</span><span>Sellers</span></div><div class="admin-nav-item" onclick="window.VELORA_CANONICAL_ADMIN_SECTION('products',this)"><span>📦</span><span>Products</span></div><div class="admin-nav-item" onclick="window.VELORA_CANONICAL_ADMIN_SECTION('orders',this)"><span>🧾</span><span>Orders</span></div><div class="admin-nav-item" onclick="window.VELORA_CANONICAL_ADMIN_SECTION('users',this)"><span>👥</span><span>Users</span></div><div class="admin-nav-item" onclick="window.VELORA_CANONICAL_ADMIN_SECTION('audit',this)"><span>🛡️</span><span>Audit Logs</span></div></div><div class="admin-nav-section"><div class="admin-nav-title">System</div><div class="admin-nav-item" onclick="window.VELORA_CANONICAL_ADMIN_SECTION('applications',this)"><span>📝</span><span>Seller Applications</span></div></div></nav><button class="admin-back-btn" onclick="window.VELORA_CLOSE_ADMIN()">⬅️ Back to Store</button></aside><div class="admin-sidebar-backdrop" id="adminSidebarBackdrop" onclick="closeAdminSidebar()" aria-hidden="true"></div><main class="admin-main"><header class="admin-header"><button class="admin-menu-btn" onclick="toggleAdminSidebar()">☰</button><div class="admin-header-title" id="adminHeaderTitle">Dashboard</div><div class="admin-header-actions"><div class="velora-op-status approved">🔐 Protected</div><button class="admin-icon-btn" onclick="window.VELORA_CLOSE_ADMIN()">🚪</button></div></header><div class="admin-content" id="adminContent"></div></main>`;}
  async function canonicalAdminSection(section,btn){const c=document.getElementById('adminContent');if(!c)return;if(typeof closeAdminSidebar==='function') closeAdminSidebar();document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');const t={dashboard:'Dashboard',sellers:'Sellers',products:'Products',orders:'Orders',users:'Users',audit:'Audit Logs',applications:'Seller Applications'};if(h)h.textContent=t[section]||section;try{setLoading('adminContent','');if(section==='dashboard')await renderCanonicalAdminDashboard();else if(section==='sellers')await renderCanonicalAdminSellers();else if(section==='products')await renderCanonicalAdminProducts();else if(section==='orders')await renderCanonicalAdminOrders();else if(section==='users')await renderCanonicalAdminUsers();else if(section==='audit')await renderCanonicalAudit();else if(section==='applications')await renderCanonicalApplications();try{window.VELORA_I18N_RENDER?.(c);}catch(_){};setTimeout(()=>{try{window.VELORA_I18N_RENDER?.(c);}catch(_){}},0)}catch(e){c.innerHTML=`<div class="velora-op-card"><b>Admin section failed.</b><div class="velora-op-muted">${esc(e?.message||e)}</div></div>`;console.error(e)}}
  async function renderCanonicalAdminDashboard(){const c=document.getElementById('adminContent');const [users,sellers,products,orders,pendingSellers,pendingProducts]=await Promise.all([countTable('profiles'),countTable('sellers'),countTable('products'),countTable('orders'),countTable('sellers',q=>q.eq('status','pending')),countTable('products',q=>q.eq('status','pending'))]);const [ordRows]=await Promise.all([db.from('orders').select('id,order_number,total,currency,payment_status,status,created_at,customer_name').order('created_at',{ascending:false}).limit(8)]);if(ordRows.error)throw ordRows.error;const revenue=(ordRows.data||[]).reduce((n,o)=>n+Number(o.total||0),0);c.innerHTML=window.VeloraI18n.html(`<div class="velora-op-grid"><div class="velora-op-kpi"><div class="kpi-value">${users}</div><div class="kpi-label">Users</div></div><div class="velora-op-kpi"><div class="kpi-value">${sellers}</div><div class="kpi-label">Sellers</div></div><div class="velora-op-kpi"><div class="kpi-value">${products}</div><div class="kpi-label">Products</div></div><div class="velora-op-kpi"><div class="kpi-value">${orders}</div><div class="kpi-label">Orders</div></div><div class="velora-op-kpi"><div class="kpi-value">${pendingSellers}</div><div class="kpi-label">Pending Sellers</div></div><div class="velora-op-kpi"><div class="kpi-value">${pendingProducts}</div><div class="kpi-label">Pending Products</div></div></div><div class="admin-section-card"><h3>🕐 Recent Orders</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead><tbody>${(ordRows.data||[]).map(o=>`<tr><td>#${esc(o.order_number)}</td><td>${esc(o.customer_name||'Customer')}</td><td>${money(o.total,o.currency)}</td><td><span class="velora-op-status ${cls(o.payment_status)}">${esc(o.payment_status)}</span></td><td><span class="velora-op-status ${cls(o.status)}">${esc(o.status)}</span></td><td>${new Date(o.created_at).toLocaleDateString()}</td></tr>`).join('')||'<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No orders yet.</td></tr>'}</tbody></table></div></div><div class="admin-section-card"><h3>⚡ Quick Actions</h3><div class="velora-op-actions"><button onclick="window.VELORA_CANONICAL_ADMIN_SECTION('applications')">📝 Review Applications</button><button onclick="window.VELORA_CANONICAL_ADMIN_SECTION('sellers')">🏪 Manage Sellers</button><button onclick="window.VELORA_CANONICAL_ADMIN_SECTION('products')">📦 Moderate Products</button><button onclick="window.VELORA_CANONICAL_ADMIN_SECTION('audit')">🛡️ Audit Logs</button></div></div>`);}
  async function renderCanonicalAdminSellers(){const c=document.getElementById('adminContent');const {data,error}=await db.from('sellers').select('id,user_id,store_name,store_slug,status,plan,rating,total_orders,total_products,total_sales,created_at,approved_at,rejection_reason').order('created_at',{ascending:false});if(error)throw error;c.innerHTML=window.VeloraI18n.html(`<div class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">🏪 Sellers</h3><div class="velora-op-muted">Actions use protected RPCs; sellers cannot self-approve.</div></div><input class="velora-op-search op-search" placeholder="Search stores…" oninput="window.VELORA_FILTER_TABLE(this.value,'veloraSellersTable')"></div><div class="velora-op-table-wrap"><table class="velora-op-table" id="veloraSellersTable"><thead><tr><th>Store</th><th>Plan</th><th>Rating</th><th>Orders</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead><tbody>${(data||[]).map(s=>`<tr><td><strong>🏪 ${esc(s.store_name)}</strong><div class="velora-op-muted">/${esc(s.store_slug)}</div></td><td>${esc(s.plan||'free')}</td><td>${Number(s.rating||0).toFixed(1)}</td><td>${Number(s.total_orders||0)}</td><td>${Number(s.total_products||0)}</td><td><span class="velora-op-status ${cls(s.status)}">${esc(s.status)}</span></td><td><div class="velora-op-actions">${s.status==='pending'?`<button onclick="window.VELORA_SET_SELLER_STATUS('${s.id}','approved')">✅ Approve</button><button class="velora-op-danger" onclick="window.VELORA_SET_SELLER_STATUS('${s.id}','rejected')">❌ Reject</button>`:''}${s.status==='approved'?`<button class="velora-op-danger" onclick="window.VELORA_SET_SELLER_STATUS('${s.id}','suspended')">🚫 Suspend</button>`:''}${s.status==='suspended'||s.status==='rejected'?`<button onclick="window.VELORA_SET_SELLER_STATUS('${s.id}','approved')">♻️ Restore</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="7" class="velora-op-muted" style="padding:2rem;text-align:center">No sellers.</td></tr>'}</tbody></table></div></div>`);}
  async function renderCanonicalAdminProducts(){const c=document.getElementById('adminContent');const {data,error}=await db.from('products').select('id,seller_id,store_id,name,brand,price,currency_code,stock,status,created_at,updated_at').order('created_at',{ascending:false}).limit(250);if(error)throw error;c.innerHTML=window.VeloraI18n.html(`<div class="admin-section-card"><div class="velora-op-toolbar"><div><h3 style="margin:0">📦 Product Moderation</h3><div class="velora-op-muted">Canonical products are seller-owned and status-controlled by Admin/Owner.</div></div><input class="velora-op-search op-search" placeholder="Search products…" oninput="window.VELORA_FILTER_TABLE(this.value,'veloraProductsTable')"></div><div class="velora-op-table-wrap"><table class="velora-op-table" id="veloraProductsTable"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>${(data||[]).map(p=>`<tr><td><strong>${esc(p.name)}</strong><div class="velora-op-muted">${esc(p.brand||'')}</div></td><td>${money(p.price,p.currency_code||'USD')}</td><td>${Number(p.stock||0)}</td><td><span class="velora-op-status ${cls(p.status)}">${esc(p.status)}</span></td><td><div class="velora-op-actions">${p.status==='pending'?`<button onclick="window.VELORA_SET_PRODUCT_STATUS('${p.id}','approved')">✅ Approve</button><button class="velora-op-danger" onclick="window.VELORA_SET_PRODUCT_STATUS('${p.id}','rejected')">❌ Reject</button>`:''}${p.status==='approved'?`<button class="velora-op-danger" onclick="window.VELORA_SET_PRODUCT_STATUS('${p.id}','inactive')">⏸️ Deactivate</button>`:''}${p.status==='inactive'||p.status==='rejected'?`<button onclick="window.VELORA_SET_PRODUCT_STATUS('${p.id}','approved')">♻️ Restore</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="5" class="velora-op-muted" style="padding:2rem;text-align:center">No products.</td></tr>'}</tbody></table></div></div>`);}
  const ADMIN_ORDER_TRANSITIONS = Object.freeze({
    pending: Object.freeze(['confirmed','cancelled']),
    confirmed: Object.freeze(['processing','cancelled']),
    processing: Object.freeze(['shipped','cancelled']),
    shipped: Object.freeze(['delivered','cancelled']),
    delivered: Object.freeze(['refunded']),
    cancelled: Object.freeze([]),
    refunded: Object.freeze([])
  });

  function adminOrderStatusLabel(status){
    const v=String(status||'pending').toLowerCase();
    return v.charAt(0).toUpperCase()+v.slice(1);
  }

  function adminOrderTransitionIcon(status){
    switch(String(status||'').toLowerCase()){
      case 'confirmed': return '✅';
      case 'processing': return '⚙️';
      case 'shipped': return '🚚';
      case 'delivered': return '📦';
      case 'cancelled': return '✕';
      case 'refunded': return '↩️';
      default: return '•';
    }
  }

  function adminOrderRpcCode(error){
    const raw=String(error?.message||error?.details||error?.hint||'');
    return ['INVALID_TRANSITION','FORBIDDEN','ORDER_NOT_FOUND','AUTH_REQUIRED','NOTE_TOO_LONG','ORDER_ID_REQUIRED','INVALID_STATUS']
      .find(code=>raw.includes(code))||'UNKNOWN';
  }

  function ensureAdminOrderModals(){
    if(document.getElementById('veloraAdminOrderDetailsModal')) return;
    document.body.insertAdjacentHTML('beforeend',`
      <div class="modal" id="veloraAdminOrderDetailsModal">
        <div class="modal-content modal-wide" style="max-width:900px;">
          <div class="modal-header">
            <h2 id="veloraAdminOrderDetailsTitle">🧾 Order Details</h2>
            <button class="modal-close" onclick="closeModal('veloraAdminOrderDetailsModal')">✕</button>
          </div>
          <div id="veloraAdminOrderDetailsContent"></div>
        </div>
      </div>
      <div class="modal" id="veloraAdminOrderConfirmModal">
        <div class="modal-content" style="max-width:520px;">
          <div class="modal-header">
            <h2>Confirm Status Change</h2>
            <button class="modal-close" onclick="closeModal('veloraAdminOrderConfirmModal')">✕</button>
          </div>
          <div id="veloraAdminOrderConfirmContent"></div>
        </div>
      </div>
    `);
  }

  async function loadCanonicalAdminOrder(orderId){
    const {data,error}=await db.from('orders')
      .select('id,order_number,customer_id,total,currency,status,payment_status,customer_name,customer_phone,customer_email,customer_city,customer_address,customer_notes,subtotal,discount,shipping,created_at,updated_at,checkout_reference')
      .eq('id',orderId)
      .maybeSingle();
    if(error) throw error;
    if(!data) throw new Error('ORDER_NOT_FOUND');

    const [{data:items,error:itemsError},{data:payments,error:paymentsError}]=await Promise.all([
      db.from('order_items')
        .select('id,product_id,product_name,quantity,unit_price,subtotal,store_name,product_variant_name,sku,product_variant_attributes')
        .eq('order_id',data.id)
        .order('created_at',{ascending:true}),
      db.from('payments')
        .select('id,method,provider,amount,currency,status,paid_at,created_at')
        .eq('order_id',data.id)
        .order('created_at',{ascending:false})
        .limit(1)
    ]);
    if(itemsError) throw itemsError;
    if(paymentsError) throw paymentsError;

    return {...data,items:items||[],payment_record:(payments||[])[0]||null};
  }

  function renderCanonicalAdminOrderDetails(order){
    const status=String(order.status||'pending').toLowerCase();
    const transitions=ADMIN_ORDER_TRANSITIONS[status]||[];
    const currency=order.currency||window.VELORA_CURRENCY||'EGP';
    const payment=order.payment_record;

    const itemHtml=order.items.length
      ? order.items.map(item=>`
          <div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:.8rem;align-items:center;padding:.75rem 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-weight:800;">${esc(item.product_name||'Product')}</div>
              ${item.product_variant_name?`<div class="velora-op-muted">Variant: ${esc(item.product_variant_name)}</div>`:''}
              ${item.sku?`<div class="velora-op-muted">SKU: ${esc(item.sku)}</div>`:''}
            </div>
            <div class="velora-op-muted">× ${Number(item.quantity||0)}</div>
            <strong>${money(item.subtotal??0,currency)}</strong>
          </div>
        `).join('')
      : '<div class="velora-op-muted" style="padding:1rem 0;">No items recorded.</div>';

    const actionHtml=transitions.length
      ? transitions.map(next=>`
          <button type="button"
            class="btn ${next==='cancelled'?'btn-outline':'btn-primary'}"
            onclick="window.VELORA_ADMIN_CONFIRM_ORDER_STATUS('${String(order.id)}','${next}')">
            ${adminOrderTransitionIcon(next)} ${esc(adminOrderStatusLabel(next))}
          </button>`).join(' ')
      : '<div class="velora-op-muted">No status changes available from this state.</div>';

    return `
      <div style="display:grid;gap:1rem;">
        <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1rem;border:1px solid var(--border);border-radius:14px;background:var(--bg-alt);">
          <div>
            <div class="velora-op-muted">Order</div>
            <div style="font-size:1.35rem;font-weight:900;color:var(--primary);">#${esc(String(order.order_number))}</div>
            <div class="velora-op-muted" style="margin-top:.25rem;">${esc(new Date(order.created_at).toLocaleString())}</div>
          </div>
          <div style="text-align:right;">
            <div class="velora-op-muted">Order Status</div>
            <span class="velora-op-status ${cls(status)}">${esc(status)}</span>
            <div class="velora-op-muted" style="margin-top:.35rem;">Payment: ${esc(order.payment_status||'pending')}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;">
          <section class="admin-section-card" style="margin:0;">
            <h3>👤 Customer</h3>
            <div style="display:grid;gap:.35rem;">
              <div><strong>Name:</strong> ${esc(order.customer_name||'N/A')}</div>
              <div><strong>Email:</strong> ${esc(order.customer_email||'N/A')}</div>
              <div><strong>Phone:</strong> ${esc(order.customer_phone||'N/A')}</div>
              <div><strong>City:</strong> ${esc(order.customer_city||'N/A')}</div>
              <div><strong>Address:</strong> ${esc(order.customer_address||'N/A')}</div>
            </div>
          </section>

          <section class="admin-section-card" style="margin:0;">
            <h3>💳 Payment</h3>
            <div style="display:grid;gap:.35rem;">
              <div><strong>Method:</strong> ${esc(payment?.method||'COD')}</div>
              <div><strong>Payment status:</strong> ${esc(order.payment_status||'pending')}</div>
              <div><strong>Total:</strong> ${money(order.total,currency)}</div>
            </div>
          </section>
        </div>

        <section class="admin-section-card" style="margin:0;">
          <h3>🛍️ Items (${order.items.length})</h3>
          ${itemHtml}
          <div style="display:flex;justify-content:flex-end;padding-top:.9rem;font-size:1.1rem;">
            <strong>Total: ${money(order.total,currency)}</strong>
          </div>
        </section>

        ${order.customer_notes?`
          <section class="admin-section-card" style="margin:0;">
            <h3>📝 Customer Notes</h3>
            <div class="velora-op-muted" style="white-space:pre-wrap;">${esc(order.customer_notes)}</div>
          </section>`:''}

        <section class="admin-section-card" style="margin:0;">
          <h3>🔄 Available Status Changes</h3>
          <div style="display:flex;gap:.6rem;flex-wrap:wrap;">${actionHtml}</div>
        </section>
      </div>
    `;
  }

  async function openCanonicalAdminOrderDetails(orderId){
    ensureAdminOrderModals();
    const modal=document.getElementById('veloraAdminOrderDetailsModal');
    const content=document.getElementById('veloraAdminOrderDetailsContent');
    if(!modal||!content)return;

    modal.classList.add('active');
    document.body.style.overflow='hidden';
    content.innerHTML='<div class="velora-op-card"><div style="font-size:1.8rem">⏳</div><div class="velora-op-muted">Loading order details…</div></div>';

    try{
      const order=await loadCanonicalAdminOrder(orderId);
      window.__VELORA_ADMIN_ORDER_CONTEXT={order};
      const title=document.getElementById('veloraAdminOrderDetailsTitle');
      if(title) title.textContent='🧾 Order #'+order.order_number;
      content.innerHTML=renderCanonicalAdminOrderDetails(order);
    }catch(error){
      closeModal('veloraAdminOrderDetailsModal');
      const code=adminOrderRpcCode(error);
      if(code==='AUTH_REQUIRED') showToast('Please login to continue.','warning');
      else if(code==='ORDER_NOT_FOUND') showToast('❌ ORDER_NOT_FOUND','error');
      else showToast('❌ Could not load order details.','error');
      console.error('Velora admin order details:',error);
    }
  }

  function openCanonicalAdminOrderStatusConfirmation(orderId,newStatus){
    ensureAdminOrderModals();
    const ctx=window.__VELORA_ADMIN_ORDER_CONTEXT;
    const order=ctx?.order;
    if(!order||String(order.id)!==String(orderId)){
      showToast('Please reopen the order details and try again.','warning');
      return;
    }

    const current=String(order.status||'pending').toLowerCase();
    const next=String(newStatus||'').toLowerCase();
    if(!(ADMIN_ORDER_TRANSITIONS[current]||[]).includes(next)){
      showToast('❌ INVALID_TRANSITION','error');
      return;
    }

    const modal=document.getElementById('veloraAdminOrderConfirmModal');
    const content=document.getElementById('veloraAdminOrderConfirmContent');
    if(!modal||!content)return;

    content.innerHTML=window.VeloraI18n.html(`
      <div style="display:grid;gap:1rem;">
        <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;background:var(--bg-alt);">
          Change status from <strong>${esc(adminOrderStatusLabel(current))}</strong>
          to <strong style="color:var(--primary);">${esc(adminOrderStatusLabel(next))}</strong>?
        </div>
        <div>
          <label for="veloraAdminOrderNote" style="display:block;font-weight:700;margin-bottom:.4rem;">Note (optional)</label>
          <textarea id="veloraAdminOrderNote" class="form-input" maxlength="500" rows="4" placeholder="Optional note (max 500 characters)"></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.6rem;">
          <button type="button" class="btn btn-outline" onclick="closeModal('veloraAdminOrderConfirmModal')">Cancel</button>
          <button type="button" class="btn btn-primary" id="veloraAdminOrderConfirmButton" onclick="window.VELORA_ADMIN_EXECUTE_ORDER_STATUS('${String(order.id)}','${next}')">Confirm</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow='hidden';
  }

  async function executeCanonicalAdminOrderStatus(orderId,newStatus){
    const sessionResult=await db.auth.getSession();
    if(sessionResult.error) throw sessionResult.error;
    if(!sessionResult.data?.session){
      closeModal('veloraAdminOrderConfirmModal');
      closeModal('veloraAdminOrderDetailsModal');
      showToast('Please login to continue.','warning');
      if(typeof openAuthModal==='function') setTimeout(()=>openAuthModal('login'),150);
      return;
    }

    const note=document.getElementById('veloraAdminOrderNote')?.value?.trim()||null;
    const button=document.getElementById('veloraAdminOrderConfirmButton');
    if(button){button.disabled=true;button.textContent='Saving…';}

    try{
      const {data,error}=await db.rpc('velora_admin_update_order_status',{
        p_order_id:orderId,
        p_new_status:newStatus,
        p_note:note
      });
      if(error) throw error;

      const result=data||{};
      showToast('✅ Order #'+String(window.__VELORA_ADMIN_ORDER_CONTEXT?.order?.order_number||'')+' → '+adminOrderStatusLabel(result.new_status||newStatus),'success');
      closeModal('veloraAdminOrderConfirmModal');
      await canonicalAdminSection('orders');
      await openCanonicalAdminOrderDetails(orderId);
    }catch(error){
      const code=adminOrderRpcCode(error);
      closeModal('veloraAdminOrderConfirmModal');
      if(code==='AUTH_REQUIRED'){
        closeModal('veloraAdminOrderDetailsModal');
        showToast('Please login to continue.','warning');
        if(typeof openAuthModal==='function') setTimeout(()=>openAuthModal('login'),150);
      }else if(code==='INVALID_TRANSITION'){
        showToast('❌ INVALID_TRANSITION','error');
      }else if(code==='FORBIDDEN'){
        showToast('❌ FORBIDDEN','error');
      }else if(code==='ORDER_NOT_FOUND'){
        showToast('❌ ORDER_NOT_FOUND','error');
        closeModal('veloraAdminOrderDetailsModal');
      }else if(code==='NOTE_TOO_LONG'){
        showToast('❌ NOTE_TOO_LONG','error');
      }else{
        showToast('❌ Could not update order status.','error');
      }
      console.error('Velora admin order status RPC:',error);
    }finally{
      if(button){button.disabled=false;button.textContent='Confirm';}
    }
  }

  async function renderCanonicalAdminOrders(){
    const c=document.getElementById('adminContent');
    const {data,error}=await db.from('orders')
      .select('id,order_number,customer_id,total,currency,status,payment_status,customer_name,customer_email,created_at')
      .order('created_at',{ascending:false})
      .limit(250);
    if(error)throw error;

    c.innerHTML=window.VeloraI18n.html(`<div class="admin-section-card">
      <h3>🧾 Orders</h3>
      <div class="velora-op-table-wrap">
        <table class="velora-op-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Order Status</th><th>Date</th></tr></thead>
          <tbody>${(data||[]).map(o=>`
            <tr
              data-order-id="${esc(o.id)}"
              role="button"
              tabindex="0"
              style="cursor:pointer;"
              onclick="window.VELORA_ADMIN_OPEN_ORDER('${String(o.id)}')"
              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.VELORA_ADMIN_OPEN_ORDER('${String(o.id)}')}"
            >
              <td><strong>#${esc(o.order_number)}</strong></td>
              <td>${esc(o.customer_name||o.customer_email||'Customer')}</td>
              <td>${money(o.total,o.currency)}</td>
              <td><span class="velora-op-status ${cls(o.payment_status)}">${esc(o.payment_status)}</span></td>
              <td><span class="velora-op-status ${cls(o.status)}">${esc(o.status)}</span></td>
              <td>${new Date(o.created_at).toLocaleDateString()}</td>
            </tr>`).join('')||'<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No orders.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`);
  }

  window.VELORA_ADMIN_OPEN_ORDER=openCanonicalAdminOrderDetails;
  window.VELORA_ADMIN_CONFIRM_ORDER_STATUS=openCanonicalAdminOrderStatusConfirmation;
  window.VELORA_ADMIN_EXECUTE_ORDER_STATUS=executeCanonicalAdminOrderStatus;

  async function renderCanonicalAdminUsers(){const c=document.getElementById('adminContent');const {data,error}=await db.from('profiles').select('id,full_name,email,country_code,preferred_language,preferred_currency,status,created_at').order('created_at',{ascending:false}).limit(250);if(error)throw error;c.innerHTML=window.VeloraI18n.html(`<div class="admin-section-card"><h3>👥 Users</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>User</th><th>Country</th><th>Currency</th><th>Status</th><th>Created</th></tr></thead><tbody>${(data||[]).map(u=>`<tr><td><strong>${esc(u.full_name||'Unnamed')}</strong><div class="velora-op-muted">${esc(u.email||'')}</div></td><td>${esc(u.country_code||'—')}</td><td>${esc(u.preferred_currency||'—')}</td><td><span class="velora-op-status ${cls(u.status)}">${esc(u.status)}</span></td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`).join('')||'<tr><td colspan="5" class="velora-op-muted" style="padding:2rem;text-align:center">No users.</td></tr>'}</tbody></table></div></div>`);}
  async function renderCanonicalAudit(){const c=document.getElementById('adminContent');const {data,error}=await db.from('audit_logs').select('id,actor_id,action,entity_type,entity_id,metadata,created_at').order('created_at',{ascending:false}).limit(200);if(error)throw error;c.innerHTML=window.VeloraI18n.html(`<div class="admin-section-card"><h3>🛡️ Audit Logs</h3><div class="velora-op-note">Audit history is read-only here. Only trusted backend operations create operational events.</div><div class="velora-op-table-wrap" style="margin-top:1rem"><table class="velora-op-table"><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Actor</th></tr></thead><tbody>${(data||[]).map(a=>`<tr><td>${new Date(a.created_at).toLocaleString()}</td><td><strong>${esc(a.action)}</strong></td><td>${esc(a.entity_type)} ${a.entity_id?`<code>${esc(a.entity_id)}</code>`:''}</td><td><code>${esc(a.actor_id||'system')}</code></td></tr>`).join('')||'<tr><td colspan="4" class="velora-op-muted" style="padding:2rem;text-align:center">No audit events.</td></tr>'}</tbody></table></div></div>`);}
  async function renderCanonicalApplications(){const c=document.getElementById('adminContent');const {data,error}=await db.from('seller_applications').select('id,user_id,requested_store_name,requested_store_slug,business_name,business_country_code,business_description,status,rejection_reason,created_at').order('created_at',{ascending:false});if(error)throw error;c.innerHTML=window.VeloraI18n.html(`<div class="admin-section-card"><h3>📝 Seller Applications</h3><div class="velora-op-table-wrap"><table class="velora-op-table"><thead><tr><th>Store</th><th>Business</th><th>Country</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>${(data||[]).map(a=>`<tr><td><strong>${esc(a.requested_store_name)}</strong><div class="velora-op-muted">/${esc(a.requested_store_slug)}</div></td><td>${esc(a.business_name||'—')}</td><td>${esc(a.business_country_code||'—')}</td><td><span class="velora-op-status ${cls(a.status)}">${esc(a.status)}</span></td><td>${new Date(a.created_at).toLocaleDateString()}</td><td><div class="velora-op-actions">${['pending','under_review'].includes(a.status)?`<button onclick="window.VELORA_REVIEW_APPLICATION('${a.id}','approve')">✅ Approve</button><button class="velora-op-danger" onclick="window.VELORA_REVIEW_APPLICATION('${a.id}','reject')">❌ Reject</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6" class="velora-op-muted" style="padding:2rem;text-align:center">No applications.</td></tr>'}</tbody></table></div></div>`);}
  async function setSellerStatus(id,status){try{let reason=null;if(status==='rejected')reason=prompt('Reason for rejection (optional):')||null;if(status==='suspended')reason=prompt('Suspension reason (optional):')||null;const {error}=await db.rpc('velora_set_seller_status',{p_seller_id:id,p_status:status,p_reason:reason});if(error)throw error;showToast('✅ Seller status updated','success');await canonicalAdminSection('sellers')}catch(e){toastErr(e)}}
  async function setProductStatus(id,status){try{const reason=(status==='rejected'||status==='inactive')?(prompt('Reason (optional):')||null):null;const {error}=await db.rpc('velora_set_product_status',{p_product_id:id,p_status:status,p_reason:reason});if(error)throw error;showToast('✅ Product status updated','success');await canonicalAdminSection('products')}catch(e){toastErr(e)}}
  async function reviewApplication(id,decision){try{let reason=null;if(decision==='reject')reason=prompt('Rejection reason (optional):')||null;const {error}=await db.rpc('velora_review_seller_application',{p_application_id:id,p_decision:decision,p_rejection_reason:reason});if(error)throw error;showToast(decision==='approve'?'✅ Seller approved and canonical store created':'✅ Application rejected','success');await canonicalAdminSection('applications')}catch(e){toastErr(e)}}
  async function setSellerOrderStatus(orderId,status){try{const note=status==='confirmed'?'Seller confirmed order':'Seller started order processing';const {error}=await db.rpc('velora_set_seller_order_status',{p_order_id:orderId,p_status:status,p_note:note});if(error)throw error;showToast('✅ Order status updated','success');await canonicalSellerSection('orders')}catch(e){toastErr(e)}}
  function filterTable(term,id){const q=String(term||'').toLowerCase();document.querySelectorAll('#'+id+' tbody tr').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'':'none')}

  window.VELORA_CANONICAL_SELLER_SECTION=canonicalSellerSection;
  window.VELORA_OPEN_PRODUCT_MODAL=()=>openProductModal('');
  window.VELORA_EDIT_PRODUCT=(id)=>openProductModal(id).catch(toastErr);
  window.VELORA_SAVE_PRODUCT=saveProduct;
  window.VELORA_DELETE_PRODUCT=deleteProduct;
  window.VELORA_CHANGE_STOCK=(id,v)=>setStock(id,v);
  window.VELORA_SET_STOCK=(id,current)=>{const v=prompt('Enter new stock quantity:',String(current));if(v!==null)setStock(id,v)};
  window.VELORA_SET_SELLER_ORDER_STATUS=setSellerOrderStatus;
  window.VELORA_SAVE_SELLER_SETTINGS=saveSellerSettings;
  window.VELORA_CLOSE_SELLER=()=>{const p=document.getElementById('sellerPlatform');if(p)p.classList.remove('active');document.body.style.overflow=''};
  window.VELORA_OPEN_SELLER=openCanonicalSeller;

  window.VELORA_CANONICAL_ADMIN_SECTION=canonicalAdminSection;
  window.VELORA_SET_SELLER_STATUS=setSellerStatus;
  window.VELORA_SET_PRODUCT_STATUS=setProductStatus;
  window.VELORA_REVIEW_APPLICATION=reviewApplication;
  window.VELORA_FILTER_TABLE=filterTable;
  window.VELORA_CLOSE_ADMIN=()=>{const p=document.getElementById('adminPlatform');if(p)p.classList.remove('active');document.body.style.overflow=''};
  window.VELORA_OPEN_ADMIN=openCanonicalAdmin;

  /* Canonical registration: use the existing RPC instead of localStorage seller objects. */
  window.handleSellerRegistration=async function(event){
    event.preventDefault();
    try{
      const user=await authUser();
      const storeName=document.getElementById('srStoreName').value.trim();
      const storeSlug=document.getElementById('srStoreSlug').value.trim().toLowerCase();
      const phone=document.getElementById('srPhone').value.trim();
      const license=document.getElementById('srLicense').value.trim();
      const description=document.getElementById('srDescription').value.trim();
      const category=document.getElementById('srCategory').value||null;
      const productType=document.getElementById('srProductType').value||'physical';
      const plan=document.querySelector('input[name="sellerPlan"]:checked')?.value||'free';
      const country=(window.VELORA_MARKET_CONTEXT?.countryCode||localStorage.getItem('velora_country')||'EG').toUpperCase();
      const {error}=await db.rpc('velora_apply_as_seller',{p_store_name:storeName,p_store_slug:storeSlug,p_business_name:storeName,p_business_country_code:country,p_business_category_id:null,p_contact_phone:phone,p_business_description:description,p_verification_data:{license,product_type:productType,plan}});
      if(error)throw error;
      closeModal('sellerRegModal');
      showToast('✅ Seller application submitted to Velora','success');
    }catch(e){toastErr(e)}
  };

  /* Route the existing platform switcher to the canonical experiences. */
  const previousSwitchPlatform=window.switchPlatform;
  window.switchPlatform=function(platformId){
    if(platformId==='seller')return openCanonicalSeller();
    if(platformId==='admin'||platformId==='owner')return openCanonicalAdmin();
    if(typeof previousSwitchPlatform==='function')return previousSwitchPlatform(platformId);
  };
  window.openSellerPanel=openCanonicalSeller;
  window.openSellerPlatform=openCanonicalSeller;
  window.openAdminPanel=openCanonicalAdmin;
  window.openAdminPlatform=openCanonicalAdmin;

  /* Keep the account UI aware of canonical seller roles on login/refresh. */
  db.auth.onAuthStateChange(async (_event,session)=>{
    if(!session?.user)return;
    try{
      const roles=await canonicalRoles(session.user.id);
      if(window.STATE?.user){
        STATE.user.roles=roles;STATE.user.role=roles.includes('owner')?'owner':roles.includes('admin')?'admin':roles.includes('seller')?'seller':'customer';STATE.user.isSeller=roles.includes('seller');
        try{saveToStorage('maha_user',STATE.user)}catch(_){ }
      }
      if(typeof updatePlatformSwitcher==='function')updatePlatformSwitcher();
    }catch(e){console.warn('Stage 8 auth sync',e)}
  });

  console.log('✅ Velora Stage 8 canonical Seller/Admin controller loaded');
})();
