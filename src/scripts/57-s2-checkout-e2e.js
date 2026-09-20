/* Velora Sprint 2 - Wave 2 Checkout E2E hardening */
(function(){
  "use strict";

  var client=window.mahaSupabase;
  if(!client)return;

  var UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  function isUuid(v){return UUID_RE.test(String(v||""));}

  function cartItems(){
    return Array.isArray(window.STATE&&STATE.cart)?STATE.cart:[];
  }

  async function resolveCartCurrency(){
    var items=cartItems(),codes=[];
    items.forEach(function(item){
      var code=String(item.currency_code||item.currency||"").trim().toUpperCase();
      if(!code&&window.MAHA_DATA&&Array.isArray(MAHA_DATA.PRODUCTS)){
        var pid=item.canonicalId||item.productId||item.id;
        var p=MAHA_DATA.PRODUCTS.find(function(x){return String(x.id)===String(pid);});
        code=String(p?.currency_code||p?.currency||"").trim().toUpperCase();
      }
      if(code&&codes.indexOf(code)<0)codes.push(code);
    });
    if(codes.length===1)return codes[0];
    if(!codes.length){
      var ids=items.map(function(item){return item.canonicalId||item.productId||item.id;}).filter(isUuid);
      if(ids.length){
        try{
          var r=await client.from("products").select("id,currency_code").in("id",ids);
          if(!r.error){
            (r.data||[]).forEach(function(p){
              var code=String(p.currency_code||"").trim().toUpperCase();
              if(code&&codes.indexOf(code)<0)codes.push(code);
            });
          }
        }catch(_){}
      }
    }
    return codes.length===1?codes[0]:null;
  }

  async function applyCheckoutCurrency(){
    var code=await resolveCartCurrency();
    if(!code)return null;
    var select=document.getElementById("currencySelect");
    if(select){
      var option=Array.prototype.find.call(select.options||[],function(o){return String(o.value).toUpperCase()===code;});
      if(option)select.value=option.value;
    }
    if(typeof window.setVeloraCurrency==="function")window.setVeloraCurrency(code);
    window.VELORA_MARKET_CONTEXT=window.VELORA_MARKET_CONTEXT||{};
    window.VELORA_MARKET_CONTEXT.currencyCode=code;
    return code;
  }

  function ensureCheckoutFormForItems(){
    var items=cartItems();
    var form=document.getElementById("checkoutForm");
    if(!form||!items.length)return;
    if(form.querySelector("#custName"))return;
    if(window.__VELORA_CHECKOUT_CART_SYNCING===true)return;
    if(typeof originalRender==="function"){
      originalRender.apply(this,[]);
    }
  }

  async function renderCanonicalCheckoutSummary(){
    var container=document.getElementById("checkoutSummary");
    var items=cartItems();
    if(!container||!items.length)return;
    ensureCheckoutFormForItems();
    var code=await applyCheckoutCurrency()||String(document.getElementById("currencySelect")?.value||window.VELORA_CURRENCY||"USD").toUpperCase();
    var subtotal=items.reduce(function(sum,item){return sum+Number(item.price||0)*Number(item.quantity||0);},0);
    container.innerHTML=
      "<h3>Summary</h3>"+
      items.map(function(item){
        return "<div class=\"order-item\"><div class=\"order-item-emoji\">"+(item.emoji||"📦")+"</div><div class=\"order-item-info\"><div class=\"order-item-name\">"+(typeof escapeHtml==="function"?escapeHtml(item.name):String(item.name||""))+"</div><div class=\"order-item-qty\">Qty: "+Number(item.quantity||0)+"</div></div><div class=\"order-item-price\">"+formatPrice(Number(item.price||0)*Number(item.quantity||0))+"</div></div>";
      }).join("")+
      "<div class=\"order-total-row\" style=\"margin-top:1rem;padding-top:1rem;border-top:2px solid var(--border);\"><span>Subtotal</span><span>"+formatPrice(subtotal)+"</span></div>"+
      "<div class=\"order-total-row\"><span>Shipping</span><span>🎉 Free</span></div>"+
      "<div class=\"order-total-row grand\"><span>Total</span><span>"+formatPrice(subtotal)+"</span></div>"+
      "<div class=\"velora-op-muted\" style=\"margin-top:.5rem;font-size:.8rem;\">Checkout currency: "+code+"</div>";
  }

  function errorText(err){
    if(!err)return "Unknown checkout error";
    return String(err.message||err.code||err.details||err.hint||err);
  }

  var originalRender=window.renderCheckoutPage;
  window.renderCheckoutPage=function(){
    var result=originalRender?originalRender.apply(this,arguments):undefined;
    setTimeout(function(){applyCheckoutCurrency();renderCanonicalCheckoutSummary();},0);
    setTimeout(function(){applyCheckoutCurrency();renderCanonicalCheckoutSummary();},250);
    return result;
  };

  async function runCheckout(event){
    if(event&&typeof event.preventDefault==="function")event.preventDefault();
    if(event&&typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();

    if(event&&typeof event.preventDefault==="function")event.preventDefault();

    var items=cartItems();
    if(!items.length){
      showToast("⚠️ Your cart is empty. Add a product before checkout.","warning");
      return;
    }

    var canonicalItems=items.map(function(item){
      var productId=item.canonicalId||item.productId||item.id;
      var variantId=item.variantId||item.product_variant_id||null;
      return {
        product_id:productId,
        product_variant_id:variantId,
        quantity:Number(item.quantity||1)
      };
    });

    if(!canonicalItems.every(function(item){
      return isUuid(item.product_id)&&Number.isInteger(item.quantity)&&item.quantity>0;
    })){
      showToast("⚠️ This cart contains an item that is not linked to the canonical catalog. Please remove it and add the product again.","warning");
      console.error("Velora checkout blocked: non-canonical cart item",items);
      return;
    }

    var name=document.getElementById("custName")?.value.trim()||"";
    var phone=document.getElementById("custPhone")?.value.trim()||"";
    var email=document.getElementById("custEmail")?.value.trim()||"";
    var city=document.getElementById("custCity")?.value.trim()||"";
    var address=document.getElementById("custAddress")?.value.trim()||"";
    var notes=document.getElementById("custNotes")?.value.trim()||"";
    var country=document.getElementById("veloraCountryCode")?.value||window.VELORA_MARKET_CONTEXT?.countryCode||null;

    if(!name||!phone||!city||!address||!country){
      showToast("⚠️ Please complete your shipping information.","warning");
      return;
    }

    var resolvedCurrency=await applyCheckoutCurrency();
    var ctx=window.VELORA_MARKET_CONTEXT||{};
    var currency=(resolvedCurrency||document.getElementById("currencySelect")?.value||ctx.currencyCode||"USD").toUpperCase();
    var checkoutRef="VELORA-"+Date.now()+"-"+Math.random().toString(36).slice(2,10);

    try{
      var sessionResult=await client.auth.getSession();
      var session=sessionResult?.data?.session;
      if(!session?.user){
        showToast("🔐 Please sign in before placing an order.","warning");
        if(typeof handleAccountClick==="function")handleAccountClick();
        return;
      }

      var result=await client.rpc("velora_create_order",{
        p_items:canonicalItems,
        p_currency:currency,
        p_shipping:0,
        p_customer_name:name,
        p_customer_phone:phone,
        p_customer_email:email,
        p_customer_city:city,
        p_customer_address:address,
        p_customer_notes:JSON.stringify({notes:notes,country_code:country,payment_method:window.selectedPayment||"cod"}),
        p_checkout_reference:checkoutRef
      });

      if(result.error)throw result.error;
      if(!result.data?.ok)throw new Error("Order creation returned an unsuccessful response.");

      window.STATE.cart=[];
      if(typeof saveToStorage==="function")saveToStorage(KEYS.CART,STATE.cart);
      if(typeof updateCartBadge==="function")updateCartBadge();
      if(typeof renderCartSidebar==="function")renderCartSidebar();

      showToast("🎉 Order #"+String(result.data.order_number)+" created successfully.","success");
      setTimeout(function(){
        if(typeof navigateTo==="function")navigateTo("orders");
      },700);
    }catch(err){
      console.error("Velora Checkout E2E error:",{
        message:err?.message,
        code:err?.code,
        details:err?.details,
        hint:err?.hint
      });
      showToast("❌ Checkout failed: "+errorText(err),"error");
      var form=document.getElementById("checkoutForm");
      if(form){
        var old=document.getElementById("veloraCheckoutError");
        if(!old){
          old=document.createElement("div");
          old.id="veloraCheckoutError";
          old.style.cssText="margin-top:1rem;padding:.9rem 1rem;border-radius:10px;background:rgba(244,67,54,.08);color:var(--error);font-size:.9rem;";
          form.appendChild(old);
        }
        old.textContent="Checkout failed: "+errorText(err);
      }
    }
  }

  document.addEventListener("submit",function(event){
    var form=event.target;
    if(!form||form.id!=="checkoutForm"&& !form.querySelector("#custName"))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    runCheckout(event).catch(function(err){
      console.error("Velora Checkout E2E uncaught:",err);
      showToast("❌ Checkout failed: "+errorText(err),"error");
    });
  },true);

  window.__VELORA_CHECKOUT_E2E_LOADED=true;
  window.placeOrder=runCheckout;

  setTimeout(function(){
    if(document.getElementById("page-checkout")?.classList.contains("active")){
      applyCheckoutCurrency();
      renderCanonicalCheckoutSummary();
    }
  },1000);

  console.log("✅ Wave 2 Checkout E2E hardening loaded");
})();