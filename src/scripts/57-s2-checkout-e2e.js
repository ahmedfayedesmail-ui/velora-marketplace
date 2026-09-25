/* Velora Checkout E2E adapter
 * Non-authoritative compatibility layer.
 * Canonical checkout business logic lives in scripts/13-payments.js.
 */
(function(){
  "use strict";

  var canonicalPlaceOrder=window.placeOrder;

  function isCheckoutSubmit(form){
    return !!(form && (
      form.id==="checkoutForm" ||
      form.querySelector("#custName")
    ));
  }

  document.addEventListener("submit",function(event){
    if(!isCheckoutSubmit(event.target))return;

    event.preventDefault();
    event.stopImmediatePropagation();

    var handler=canonicalPlaceOrder;
    if(typeof handler!=="function"){
      if(typeof showToast==="function")showToast("❌ Checkout handler is unavailable.","error");
      console.error("Velora checkout: canonical placeOrder handler unavailable");
      return;
    }

    Promise.resolve(handler(event)).catch(function(error){
      console.error("Velora checkout delegated handler failed:",error);
      if(typeof showToast==="function"){
        showToast("❌ Checkout failed: "+String(error?.message||error),"error");
      }
    });
  },true);

  window.__VELORA_CHECKOUT_E2E_LOADED=true;
  console.log("✅ Wave 2 Checkout compatibility adapter loaded");
})();