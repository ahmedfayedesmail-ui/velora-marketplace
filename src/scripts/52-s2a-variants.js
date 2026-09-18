/* Velora Sprint 2 - S2-A Variants runtime adapter */
(function(){
  "use strict";
  var db=window.mahaSupabase||null;
  if(!db)return;

  var variantCache=window.__VELORA_VARIANTS_S2A=window.__VELORA_VARIANTS_S2A||new Map();
  var selectionCache=window.__VELORA_VARIANT_SELECTIONS_S2A=window.__VELORA_VARIANT_SELECTIONS_S2A||new Map();

  function token(v){return encodeURIComponent(String(v==null?"":v));}
  function decode(v){try{return decodeURIComponent(String(v||""));}catch(e){return String(v||"");}}
  function esc(v){
    var s=String(v==null?"":v);
    if(typeof escapeHtml==="function")return escapeHtml(s);
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function jsonObject(raw){
    var x=JSON.parse(String(raw||"{}"));
    if(!x||Array.isArray(x)||typeof x!=="object")throw new Error("Attributes must be a JSON object.");
    return x;
  }
  function attrsText(v){
    var a=v&&typeof v==="object"?v:{};
    return Object.keys(a).filter(function(k){return String(a[k]==null?"":a[k]).trim();}).map(function(k){return esc(k)+": "+esc(a[k]);}).join(" · ");
  }
  async function loadVariants(productId,force){
    if(!force&&variantCache.has(productId))return variantCache.get(productId)||[];
    try{
      var r=await db.rpc("velora_get_product_variants",{p_product_id:productId});
      if(r.error)throw r.error;
      var rows=Array.isArray(r.data)?r.data:[];
      variantCache.set(productId,rows);
      return rows;
    }catch(e){
      console.error("S2-A variant read failed:",e);
      variantCache.delete(productId);
      throw e;
    }
  }
  function attrValue(v,key){
    if(key==="__name")return String(v&&v.name||"");
    var a=v&&v.attributes&&typeof v.attributes==="object"?v.attributes:{};
    return String(a[key]==null?"":a[key]);
  }
  function groups(variants){
    var keys=[];
    (variants||[]).forEach(function(v){
      var a=v&&v.attributes&&typeof v.attributes==="object"?v.attributes:{};
      Object.keys(a).forEach(function(k){if(String(k).trim()&&keys.indexOf(k)<0)keys.push(k);});
    });
    if(!keys.length)keys=["__name"];
    return keys.map(function(key){
      var values=[];
      (variants||[]).forEach(function(v){
        var x=attrValue(v,key);
        if(x&&values.every(function(y){return y.toLowerCase()!==x.toLowerCase();}))values.push(x);
      });
      return {key:key,values:values};
    }).filter(function(g){return g.values.length;});
  }
  function matches(v,selected){
    return Object.keys(selected||{}).every(function(k){return attrValue(v,k)===String(selected[k]);});
  }
  function optionAvailable(variants,selected,key,value){
    var next=Object.assign({},selected||{});next[key]=value;
    return (variants||[]).some(function(v){return Number(v.stock_quantity||0)>0&&matches(v,next);});
  }
  function selectedVariant(productId,variants){
    var sel=selectionCache.get(productId)||{};
    return (variants||[]).find(function(v){return matches(v,sel);})
      ||(variants||[]).find(function(v){return Number(v.stock_quantity||0)>0;})
      ||(variants||[])[0]||null;
  }
  function seedSelection(productId,variants){
    if(selectionCache.has(productId))return selectionCache.get(productId)||{};
    var chosen=(variants||[]).find(function(v){return Number(v.stock_quantity||0)>0;})||(variants||[])[0]||null;
    var sel={};
    if(chosen)groups(variants).forEach(function(g){var val=attrValue(chosen,g.key);if(val)sel[g.key]=val;});
    selectionCache.set(productId,sel);
    return sel;
  }
  function normalizeSelection(variants,selected){
    var sel=Object.assign({},selected||{});
    var exact=(variants||[]).find(function(v){return matches(v,sel);});
    if(exact)return sel;
    var candidate=(variants||[]).find(function(v){return Number(v.stock_quantity||0)>0&&matches(v,sel);});
    if(candidate)return sel;
    var fallback=(variants||[]).find(function(v){
      return Number(v.stock_quantity||0)>0 && Object.keys(sel).every(function(k){return attrValue(v,k)===String(sel[k]);});
    }) || (variants||[]).find(function(v){return Number(v.stock_quantity||0)>0;}) || (variants||[])[0];
    if(!fallback)return sel;
    groups(variants).forEach(function(g){var val=attrValue(fallback,g.key);if(val)sel[g.key]=val;});
    return sel;
  }
  function selectVariant(productId,key,value){
    productId=decode(productId);key=decode(key);value=decode(value);
    var variants=variantCache.get(productId)||[];if(!variants.length)return;
    var sel=Object.assign({},selectionCache.get(productId)||{});sel[key]=value;
    sel=normalizeSelection(variants,sel);selectionCache.set(productId,sel);
    var p=(window.MAHA_DATA&&Array.isArray(MAHA_DATA.PRODUCTS))?MAHA_DATA.PRODUCTS.find(function(x){return x.id===productId;}):null;
    if(p)renderProduct(p,variants,sel);
  }
  window.VELORA_SELECT_VARIANT_S2A=selectVariant;

  function pickerHtml(product,variants,selected){
    if(!variants.length)return "";
    var out="<div class=\"velora-variant-picker\"><div class=\"velora-variant-picker-title\">Choose options</div>";
    groups(variants).forEach(function(g){
      var current=String(selected&&selected[g.key]||"");
      out+="<div class=\"velora-variant-group\"><div class=\"velora-variant-group-label\">"+esc(g.key==="__name"?"Variant":g.key)+" <span class=\"velora-variant-selected\">"+esc(current||"Select")+"</span></div>";
      if(g.values.length>8){
        out+="<select class=\"form-select velora-variant-select\" onchange=\"window.VELORA_SELECT_VARIANT_S2A('"+token(product.id)+"','"+token(g.key)+"',this.value)\"><option value=\"\">Select...</option>";
        g.values.forEach(function(v){var ok=optionAvailable(variants,selected,g.key,v);out+="<option value=\""+esc(v)+"\" "+(v===current?"selected ":"")+(ok?"":"disabled ")+" >"+esc(v)+(ok?"":" - Sold out")+"</option>";});
        out+="</select>";
      }else{
        out+="<div class=\"velora-variant-options\">";
        g.values.forEach(function(v){var ok=optionAvailable(variants,selected,g.key,v);out+="<button type=\"button\" class=\"velora-variant-option "+(v===current?"selected":"")+"\" "+(ok?"":"disabled ")+"onclick=\"window.VELORA_SELECT_VARIANT_S2A('"+token(product.id)+"','"+token(g.key)+"','"+token(v)+"')\">"+esc(v)+(ok?"":"<span class=\"velora-variant-oos\">Sold out</span>")+"</button>";});
        out+="</div>";
      }
      out+="</div>";
    });
    return out+"</div>";
  }

  function renderProduct(product,variants,selected){
    if(typeof veloraLocalizedProduct!=="function")return;
    var p=veloraLocalizedProduct(product);
    var modal=document.getElementById("productModal"),content=document.getElementById("productModalContent");
    if(!modal||!content)return;
    var v=selectedVariant(p.id,variants);
    var price=v?(v.price==null?p.price:v.price):p.price;
    var stock=v?Number(v.stock_quantity||0):Number(p.stock||0);
    var fav=Array.isArray(STATE.favorites)&&STATE.favorites.some(function(x){return x.id===p.id;});
    var variantMeta=v?"<div class=\"velora-variant-current\"><strong>"+esc(v.name)+"</strong>"+(attrsText(v.attributes)?"<span>"+attrsText(v.attributes)+"</span>":"")+"</div>":"";
    var details="";
    if(Array.isArray(p.ingredients)&&p.ingredients.length)details+="<section class=\"velora-detail-section\"><h4>🧪 Ingredients</h4><div class=\"velora-detail-chips\">"+p.ingredients.map(function(x){return "<span>"+esc(x)+"</span>";}).join("")+"</div></section>";
    if(Array.isArray(p.pros)&&p.pros.length)details+="<section class=\"velora-detail-section\"><h4>✅ Pros</h4><ul>"+p.pros.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ul></section>";
    if(Array.isArray(p.cons)&&p.cons.length)details+="<section class=\"velora-detail-section\"><h4>⚠️ Cons</h4><ul class=\"velora-muted-list\">"+p.cons.map(function(x){return "<li>"+esc(x)+"</li>";}).join("")+"</ul></section>";
    var use=p.usage||p.howToUse;
    if(use)details+="<section class=\"velora-detail-section\"><h4>🧴 How to Use</h4><p>"+esc(use)+"</p></section>";
    var best=p.bestFor||p.skinTypes||p.skinType;
    if(Array.isArray(best)&&best.length)details+="<section class=\"velora-detail-section\"><h4>🎯 Best For</h4><div class=\"velora-detail-chips\">"+best.map(function(x){return "<span>"+esc(x)+"</span>";}).join("")+"</div></section>";
    content.innerHTML="<div class=\"velora-product-detail-grid\"><div class=\"velora-product-detail-media\">"+esc(p.emoji||"📦")+"</div><div><div class=\"velora-product-subcategory\">"+esc(p.subcategory||"")+"</div><h2>"+esc(p.name)+"</h2><div class=\"velora-product-brand\">"+esc(p.brand||"")+"</div><div class=\"velora-product-rating\">"+(typeof renderStars==="function"?renderStars(p.rating):"")+" <span>"+esc(p.rating)+" ("+esc(p.reviewsCount||0)+" reviews)</span></div>"+pickerHtml(p,variants,selected)+variantMeta+"<div class=\"velora-price-row\"><span class=\"velora-effective-price\">"+formatPrice(price)+"</span></div><div class=\"velora-variant-stock\">"+(variants.length?(stock>0?stock+" available":"Out of stock"):"")+"</div><p class=\"velora-product-description\">"+esc(p.description||"")+"</p><div class=\"velora-product-actions\"><button class=\"btn btn-primary btn-lg\" "+(variants.length&&(!v||stock<=0)?"disabled":"")+" onclick=\"window.addToCartS2A('"+token(p.id)+"',1,"+(v?"'"+token(v.id)+"'":"null")+");closeModal('productModal')\">🛒 Add to Cart</button><button class=\"btn btn-outline btn-lg\" onclick=\"toggleFavorite('"+token(p.id)+"',this)\">"+(fav?"❤️":"🤍")+"</button></div></div></div>";
    modal.classList.add("active");document.body.style.overflow="hidden";
  }
  window.__VELORA_S2A_RENDER_PRODUCT=renderProduct;

  var originalOpenProductDetail=window.openProductDetail;
  window.openProductDetail=async function(productId){
    productId=decode(productId);
    var p=(window.MAHA_DATA&&Array.isArray(MAHA_DATA.PRODUCTS))?MAHA_DATA.PRODUCTS.find(function(x){return x.id===productId;}):null;
    if(!p&&typeof originalOpenProductDetail==="function")return originalOpenProductDetail(productId);
    if(!p)return;
    var modal=document.getElementById("productModal"),content=document.getElementById("productModalContent");
    if(modal&&content){modal.classList.add("active");document.body.style.overflow="hidden";content.innerHTML="<div class=\"velora-variant-loading\">Loading product options...</div>";}
    try{
      var variants=await loadVariants(productId,true);
      var selected=seedSelection(productId,variants);
      renderProduct(p,variants,selected);
    }catch(e){
      if(content)content.innerHTML="<div class=\"velora-variant-loading\">Unable to load product options. Please try again.</div>";
      if(typeof showToast==="function")showToast("❌ Unable to load product options","error");
    }
  };

  function lineKey(id,variantId){return String(id)+"::"+String(variantId||"base");}
  async function hasSession(){try{var r=await db.auth.getSession();return !!(r&&r.data&&r.data.session&&r.data.session.user);}catch(e){return false;}}
  async function addToCartS2A(productId,quantity,variantId){
    productId=decode(productId);variantId=variantId?decode(variantId):null;
    var product=(window.MAHA_DATA&&MAHA_DATA.PRODUCTS||[]).find(function(x){return x.id===productId;});if(!product)return;
    var variants=await loadVariants(productId,false);
    var v=variantId?variants.find(function(x){return x.id===variantId;})||null:null;
    if(variants.length&&!v){showToast("⚠️ Choose the product options first","warning");openProductDetail(productId);return;}
    if(v&&Number(v.stock_quantity||0)<Number(quantity||1)){showToast("⚠️ This option is out of stock","warning");return;}
    try{
      if(await hasSession()){
        var r=v
          ?await db.rpc("velora_upsert_cart_item_variant",{p_product_id:productId,p_product_variant_id:variantId,p_quantity:Number(quantity||1),p_currency:product.currency_code||window.VELORA_CURRENCY||"USD"})
          :await db.rpc("velora_upsert_cart_item",{p_product_id:productId,p_quantity:Number(quantity||1),p_currency:product.currency_code||window.VELORA_CURRENCY||"USD"});
        if(r.error)throw r.error;
      }
    }catch(e){showToast("❌ Could not update your cart: "+(e.message||"Cart error"),"error");return;}
    var key=lineKey(productId,variantId),item=STATE.cart.find(function(x){return lineKey(x.id,x.variantId)===key;});
    var price=v?(v.price==null?product.price:v.price):product.price;
    if(item){item.quantity+=Number(quantity||1);item.price=price;item.variantId=variantId;item.variantName=v?v.name:null;item.variantAttributes=v?v.attributes||{}:{};item.sku=v?v.sku||null:null;}
    else STATE.cart.push({id:product.id,name:product.name,price:price,emoji:product.emoji,quantity:Number(quantity||1),variantId:variantId,variantName:v?v.name:null,variantAttributes:v?v.attributes||{}:{},sku:v?v.sku||null:null});
    saveToStorage(KEYS.CART,STATE.cart);updateCartBadge();renderCartSidebar();showToast("✅ Added to cart","success");
  }
  window.addToCartS2A=addToCartS2A;
  window.addToCart=addToCartS2A;

  async function removeCart(productId,variantId){
    productId=decode(productId);variantId=variantId?decode(variantId):null;
    try{
      if(await hasSession()){
        var r=variantId?await db.rpc("velora_remove_cart_item_variant",{p_product_id:productId,p_product_variant_id:variantId}):await db.rpc("velora_remove_cart_item",{p_product_id:productId});
        if(r.error)throw r.error;
      }
    }catch(e){showToast("❌ Could not update your cart: "+(e.message||"Cart error"),"error");return;}
    STATE.cart=STATE.cart.filter(function(x){return lineKey(x.id,x.variantId)!==lineKey(productId,variantId);});
    saveToStorage(KEYS.CART,STATE.cart);updateCartBadge();renderCartSidebar();renderCartPage();showToast("🗑️ Removed from cart","info");
  }
  async function changeQuantity(productId,delta,variantId){
    productId=decode(productId);variantId=variantId?decode(variantId):null;
    var key=lineKey(productId,variantId),item=STATE.cart.find(function(x){return lineKey(x.id,x.variantId)===key;});if(!item)return;
    var next=Number(item.quantity||0)+Number(delta||0);if(next<=0){await removeCart(productId,variantId);return;}
    try{
      if(await hasSession()){
        var r=variantId?await db.rpc("velora_set_cart_quantity_variant",{p_product_id:productId,p_product_variant_id:variantId,p_quantity:next}):await db.rpc("velora_set_cart_quantity",{p_product_id:productId,p_quantity:next});
        if(r.error)throw r.error;
      }
    }catch(e){showToast("❌ Could not update your cart: "+(e.message||"Cart error"),"error");return;}
    item.quantity=next;saveToStorage(KEYS.CART,STATE.cart);updateCartBadge();renderCartSidebar();renderCartPage();
  }
  window.updateQuantity=changeQuantity;
  window.removeFromCart=removeCart;

  function cartVariantMeta(item){
    var a=attrsText(item.variantAttributes||{});
    if(!item.variantName&&!a&&!item.sku)return "";
    return "<div class=\"velora-cart-variant\">"+esc(item.variantName||"")+(a?" · "+a:"")+(item.sku?" · SKU "+esc(item.sku):"")+"</div>";
  }
  var originalSidebar=window.renderCartSidebar;
  window.renderCartSidebar=function(){
    var body=document.getElementById("cartSidebarBody"),footer=document.getElementById("cartSidebarFooter");
    if(!body||!footer)return originalSidebar&&originalSidebar();
    if(!STATE.cart.length)return originalSidebar&&originalSidebar();
    body.innerHTML=STATE.cart.map(function(item){
      return "<div class=\"cart-item\"><div class=\"cart-item-image\">"+esc(item.emoji||"📦")+"</div><div class=\"cart-item-info\"><div class=\"cart-item-name\">"+esc(item.name)+"</div>"+cartVariantMeta(item)+"<div class=\"cart-item-price\">"+formatPrice(Number(item.price||0)*Number(item.quantity||0))+"</div></div><div class=\"cart-item-controls\"><div class=\"qty-control\"><button class=\"qty-btn\" onclick=\"updateQuantity('"+token(item.id)+"',-1,'"+token(item.variantId||"")+"')\">−</button><span class=\"qty-value\">"+item.quantity+"</span><button class=\"qty-btn\" onclick=\"updateQuantity('"+token(item.id)+"',1,'"+token(item.variantId||"")+"')\">+</button></div><button class=\"cart-remove\" onclick=\"removeFromCart('"+token(item.id)+"','"+token(item.variantId||"")+"')\">✕</button></div></div>";
    }).join("");
    var subtotal=getCartTotal(),shipping=subtotal>=500?0:30,total=subtotal+shipping;
    footer.innerHTML="<div class=\"cart-summary-row\"><span>Subtotal</span><span>"+formatPrice(subtotal)+"</span></div><div class=\"cart-summary-row\"><span>Shipping</span><span>"+(shipping===0?"🎉 Free":formatPrice(shipping))+"</span></div><div class=\"cart-summary-row total\"><span>Total</span><span>"+formatPrice(total)+"</span></div><div class=\"cart-actions\"><button class=\"btn btn-primary btn-block\" onclick=\"closeCart();navigateTo('checkout')\">💳 Checkout</button><button class=\"btn btn-outline btn-block\" onclick=\"closeCart();navigateTo('cart')\">View Cart</button></div>";
  };

  var originalCartPage=window.renderCartPage;
  window.renderCartPage=function(){
    var c=document.getElementById("cartContent");if(!c)return originalCartPage&&originalCartPage();
    if(!STATE.cart.length)return originalCartPage&&originalCartPage();
    var subtotal=getCartTotal(),shipping=subtotal>=500?0:30,total=subtotal+shipping;
    c.innerHTML="<div style=\"display:grid;grid-template-columns:1fr 400px;gap:2rem;\"><div class=\"form-section\"><h3>🛒 Cart Items ("+getCartCount()+")</h3>"+STATE.cart.map(function(item){
      return "<div class=\"cart-item\" style=\"background:var(--bg);\"><div class=\"cart-item-image\">"+esc(item.emoji||"📦")+"</div><div class=\"cart-item-info\"><div class=\"cart-item-name\">"+esc(item.name)+"</div>"+cartVariantMeta(item)+"<div class=\"cart-item-price\">"+formatPrice(Number(item.price||0)*Number(item.quantity||0))+"</div></div><div class=\"cart-item-controls\"><div class=\"qty-control\"><button class=\"qty-btn\" onclick=\"updateQuantity('"+token(item.id)+"',-1,'"+token(item.variantId||"")+"')\">−</button><span class=\"qty-value\">"+item.quantity+"</span><button class=\"qty-btn\" onclick=\"updateQuantity('"+token(item.id)+"',1,'"+token(item.variantId||"")+"')\">+</button></div><button class=\"cart-remove\" onclick=\"removeFromCart('"+token(item.id)+"','"+token(item.variantId||"")+"')\">✕</button></div></div>";
    }).join("")+"</div><div class=\"order-summary\"><h3>Summary</h3><div class=\"order-total-row\"><span>Subtotal</span><span>"+formatPrice(subtotal)+"</span></div><div class=\"order-total-row\"><span>Shipping</span><span>"+(shipping===0?"Free":formatPrice(shipping))+"</span></div><div class=\"order-total-row grand\"><span>Total</span><span>"+formatPrice(total)+"</span></div><button class=\"btn btn-primary btn-block btn-lg\" style=\"margin-top:1.5rem;\" onclick=\"navigateTo('checkout')\">💳 Checkout</button></div></div>";
  };

  /* Seller variant CRUD: preserve the canonical product modal and append a secure variant editor. */
  var originalOpenSeller=window.VELORA_OPEN_PRODUCT_MODAL;
  var originalEditSeller=window.VELORA_EDIT_PRODUCT;
  var originalSellerSave=window.VELORA_SAVE_PRODUCT;

  function sellerVariantRow(v){
    v=v||{};
    return "<div class=\"velora-seller-variant-row\" data-variant-id=\""+esc(v.id||"")+"\"><input type=\"hidden\" class=\"s2aVariantId\" value=\""+esc(v.id||"")+"\"><div class=\"form-group\"><label>Name *</label><input class=\"form-input s2aVariantName\" required value=\""+esc(v.name||"")+"\"></div><div class=\"form-group\"><label>SKU *</label><input class=\"form-input s2aVariantSku\" required value=\""+esc(v.sku||"")+"\"></div><div class=\"form-group\"><label>Price</label><input class=\"form-input s2aVariantPrice\" type=\"number\" step=\"0.01\" min=\"0\" value=\""+(v.price==null?"":esc(v.price))+"\"></div><div class=\"form-group\"><label>Stock *</label><input class=\"form-input s2aVariantStock\" type=\"number\" step=\"1\" min=\"0\" value=\""+Number(v.stock_quantity||0)+"\" required></div><div class=\"form-group\"><label>Attributes JSON</label><textarea class=\"form-textarea s2aVariantAttrs\" rows=\"2\">"+esc(JSON.stringify(v.attributes||{}))+"</textarea></div><button type=\"button\" class=\"btn btn-outline s2aRemoveVariant\">Retire</button></div>";
  }
  function collectSellerRows(host){
    return Array.prototype.slice.call(host.querySelectorAll(".velora-seller-variant-row")).map(function(row){
      return {
        id:row.querySelector(".s2aVariantId")?.value||null,
        name:row.querySelector(".s2aVariantName")?.value.trim()||"",
        sku:row.querySelector(".s2aVariantSku")?.value.trim()||"",
        price:(row.querySelector(".s2aVariantPrice")?.value||"").trim()===""?null:Number(row.querySelector(".s2aVariantPrice")?.value),
        stock_quantity:Math.max(0,Number(row.querySelector(".s2aVariantStock")?.value||0)),
        attributes:jsonObject(row.querySelector(".s2aVariantAttrs")?.value||"{}")
      };
    });
  }
  async function saveSellerVariants(productId,rows){
    if(!productId)return;
    var existing=(await loadVariants(productId,true)).slice(),seen=new Set();
    for(var i=0;i<rows.length;i++){
      var x=rows[i];
      if(!x.name||!x.sku)throw new Error("Each variant needs a name and SKU.");
      if(x.price!==null&&!Number.isFinite(x.price))throw new Error("Variant price must be a valid number.");
      var r=await db.rpc("velora_upsert_product_variant",{p_product_id:productId,p_variant_id:x.id||null,p_name:x.name,p_sku:x.sku,p_price:x.price,p_stock_quantity:x.stock_quantity,p_attributes:x.attributes});
      if(r.error)throw r.error;
      seen.add(x.id||r.data);
    }
    for(var j=0;j<existing.length;j++){
      if(!seen.has(existing[j].id)){
        var rr=await db.rpc("velora_retire_product_variant",{p_variant_id:existing[j].id});
        if(rr.error)throw rr.error;
      }
    }
    if(rows.length){
      var totalStock=rows.reduce(function(n,x){return n+Number(x.stock_quantity||0);},0);
      var seller=window.VELORA_CANONICAL_SELLER;
      var ur=await db.from("products").update({stock:totalStock,updated_at:new Date().toISOString()}).eq("id",productId).eq("seller_id",seller.id);
      if(ur.error)throw ur.error;
    }
    variantCache.delete(productId);
  }
  async function enhanceSellerModal(productId){
    var modal=document.getElementById("veloraCanonicalProductModal"),form=modal&&modal.querySelector("form");if(!modal||!form)return;
    var old=modal.querySelector("#s2aVariantEditor");if(old)old.remove();
    var variants=productId?await loadVariants(productId,true):[];
    var host=document.createElement("div");host.id="s2aVariantEditor";host.className="velora-variant-editor";
    host.innerHTML="<div class=\"velora-variant-editor-head\"><div><strong>Variants (optional)</strong><div class=\"velora-op-muted\">One row per purchasable combination. Attributes are free-form JSON such as {color:red, size:M}.</div></div><button type=\"button\" class=\"btn btn-outline\" id=\"s2aAddVariant\">+ Add Variant</button></div><div id=\"s2aVariantRows\">"+variants.map(sellerVariantRow).join("")+"</div><div class=\"velora-op-note\">Saved variants are retired, not hard-deleted, so historical order links remain safe.</div>";
    var loc=modal.querySelector(".velora-loc-editor");form.insertBefore(host,loc||form.lastElementChild);
    host.querySelector("#s2aAddVariant").onclick=function(){document.getElementById("s2aVariantRows").insertAdjacentHTML("beforeend",sellerVariantRow(null));};
    host.addEventListener("click",function(e){if(e.target.closest(".s2aRemoveVariant")){var row=e.target.closest(".velora-seller-variant-row");if(row)row.remove();}});
    modal.dataset.s2aProductId=productId||"";
  }

  window.VELORA_OPEN_PRODUCT_MODAL=async function(){await originalOpenSeller();await enhanceSellerModal("");};
  window.VELORA_EDIT_PRODUCT=async function(id){await originalEditSeller(id);await enhanceSellerModal(id);};

  window.VELORA_SAVE_PRODUCT=async function(e,productId){
    var host=document.getElementById("s2aVariantEditor");
    if(!host)return originalSellerSave(e,productId);
    var rows=[];
    try{rows=collectSellerRows(host);}catch(err){if(e)e.preventDefault();showToast("❌ "+(err.message||"Invalid variant data"),"error");return;}
    if(!rows.length)return originalSellerSave(e,productId);

    if(!productId){
      /* The canonical create handler owns translations and moderation. Create the parent first, then attach staged variants to the freshly-created seller product. */
      var snapshot=JSON.stringify(rows);
      var stagedName=(document.getElementById("vcName")?.value||"").trim();
      var stagedSeller=window.VELORA_CANONICAL_SELLER;
      var result;
      try{ result=await originalSellerSave(e,productId); }catch(createErr){
        throw createErr;
      }
      try{
        if(stagedSeller&&stagedName){
          var vr=await db.from("products").select("id,name,created_at").eq("seller_id",stagedSeller.id).eq("name",stagedName).order("created_at",{ascending:false}).limit(5);
          var target=(vr.data||[]).sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);})[0];
          if(target){
            await saveSellerVariants(target.id,JSON.parse(snapshot));
          }else{
            throw new Error("Freshly-created product could not be resolved for variant attachment.");
          }
        }
      }catch(err2){if(typeof toastErr==="function")toastErr(err2);else showToast("⚠️ Product created, but variants were not attached: "+(err2.message||err2),"warning");}
      return result;
    }

    if(e)e.preventDefault();
    try{
      await originalSellerSave({preventDefault:function(){},currentTarget:e.currentTarget},productId);
      /* The original handler closes the modal, but the row nodes remain readable after the call. */
      await saveSellerVariants(productId,rows);
    }catch(err3){
      if(typeof toastErr==="function")toastErr(err3);else showToast("❌ "+(err3.message||err3),"error");
    }
  };
})();