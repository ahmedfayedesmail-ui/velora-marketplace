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

  function cartCurrency(){
    var items=cartItems(),codes=[];
    items.forEach(function(item){
      var code=String(item.currency_code||item.currency||"").trim().toUpperCase();
      if(code&&codes.indexOf(code)<0)codes.push(code);
    });
    return codes.length===1?codes[0]:null;
  }

  function applyCheckoutCurrency(){
    var code=cartCurrency();
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

  function renderCanonicalCheckoutSummary(){
    var container=document.getElementById("checkoutSummary");
    var items=cartItems();
    if(!container||!items.length)return;
    var code=applyCheckoutCurrency()||String(document.getElementById("currencySelect")?.value||window.VELORA_CURRENCY||"USD").toUpperCase();
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

  window.placeOrder=async function(event){
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

    applyCheckoutCurrency();
    var ctx=window.VELORA_MARKET_CONTEXT||{};
    var currency=(cartCurrency()||document.getElementById("currencySelect")?.value||ctx.currencyCode||"USD").toUpperCase();
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
  };

  setTimeout(function(){
    if(document.getElementById("page-checkout")?.classList.contains("active")){
      applyCheckoutCurrency();
      renderCanonicalCheckoutSummary();
    }
  },1000);

  console.log("✅ Wave 2 Checkout E2E hardening loaded");
})();