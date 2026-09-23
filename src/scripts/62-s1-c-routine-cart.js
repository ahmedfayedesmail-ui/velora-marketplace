/* ============================================================
   VELORA — Sprint 1 Routine → Cart Adapter
   Routine = selection. Cart = collection. Checkout = final authority.
   ============================================================ */
(function () {
  'use strict';

  function getClient() {
    const client = window.mahaSupabase || window.supabaseClient || window.sb || null;
    if (!client || typeof client.rpc !== 'function' || !client.from || !client.auth) {
      throw new Error('SUPABASE_UNAVAILABLE');
    }
    return client;
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function t(en, ar) {
    const language = document.getElementById('languageSelect')?.value || document.documentElement.lang || 'en';
    return language === 'ar' ? ar : en;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function lineKey(productId, variantId) {
    return String(productId) + '::' + String(variantId || 'base');
  }

  function errorCode(error) {
    return String(error?.message || error?.details || '').trim();
  }

  function isUnavailableCode(code) {
    return new Set([
      'PRODUCT_NOT_AVAILABLE',
      'INSUFFICIENT_STOCK',
      'VARIANT_NOT_AVAILABLE',
      'INSUFFICIENT_VARIANT_STOCK',
      'VARIANT_SELECTION_REQUIRED'
    ]).has(code);
  }

  async function getAuthenticatedUser() {
    if (typeof STATE !== 'undefined' && STATE?.user?.id) {
      return STATE.user;
    }

    const client = getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data?.session?.user) throw new Error('AUTH_REQUIRED');
    return data.session.user;
  }

  async function readServerCartKeys(userId) {
    const client = getClient();
    const { data, error } = await client
      .from('carts')
      .select('id,cart_items(product_id,product_variant_id,quantity)')
      .eq('customer_id', userId)
      .maybeSingle();

    if (error) throw error;

    const quantities = new Map();
    const rows = Array.isArray(data?.cart_items) ? data.cart_items : [];
    rows.forEach((row) => {
      if (UUID_RE.test(String(row.product_id || ''))) {
        quantities.set(
          lineKey(row.product_id, row.product_variant_id),
          Math.max(0, Number(row.quantity || 0))
        );
      }
    });
    return quantities;
  }

  function syncLocalCartLine(product, variant, quantity) {
    if (typeof STATE === 'undefined' || !Array.isArray(STATE.cart)) return;

    const productId = String(product?.id || '');
    if (!UUID_RE.test(productId)) return;

    const variantId = variant?.id ? String(variant.id) : null;
    const existing = STATE.cart.find((item) => {
      const itemProductId = item?.canonicalId || item?.productId || item?.id;
      const itemVariantId = item?.variantId || item?.product_variant_id || null;
      return String(itemProductId || '') === productId &&
        String(itemVariantId || '') === String(variantId || '');
    });

    const normalizedQuantity = Math.max(1, Number(quantity || 1));
    const nextItem = {
      id: productId,
      canonicalId: productId,
      productId,
      variantId,
      product_variant_id: variantId,
      name: String(product.name || 'Product'),
      brand: String(product.brand || ''),
      price: Number(variant?.price ?? product.price ?? 0),
      emoji: String(product.emoji || '✨'),
      currency_code: String(product.currency_code || 'EGP').toUpperCase(),
      quantity: normalizedQuantity
    };

    if (existing) Object.assign(existing, nextItem);
    else STATE.cart.push(nextItem);

    if (typeof saveToStorage === 'function' && typeof KEYS !== 'undefined') {
      saveToStorage(KEYS.CART, STATE.cart);
    }
    if (typeof updateCartBadge === 'function') updateCartBadge();
    if (typeof renderCartSidebar === 'function') renderCartSidebar();
    if (typeof renderCartPage === 'function') renderCartPage();
  }

  async function readLiveCatalog(productIds) {
    const client = getClient();
    const ids = Array.from(new Set(productIds.filter((id) => UUID_RE.test(String(id || '')))));
    if (!ids.length) return { products: new Map(), variants: new Map() };

    const [productsResult, variantsResult] = await Promise.all([
      client
        .from('products')
        .select('id,name,brand,price,original_price,emoji,images,currency_code,seller_id,stock,status')
        .in('id', ids),
      client
        .from('product_variants')
        .select('id,product_id,name,price,sku,attributes,stock_quantity,is_active')
        .in('product_id', ids)
    ]);

    if (productsResult.error) throw productsResult.error;
    if (variantsResult.error) throw variantsResult.error;

    const products = new Map((productsResult.data || []).map((product) => [String(product.id), product]));
    const variants = new Map();

    (variantsResult.data || []).forEach((variant) => {
      const productId = String(variant.product_id || '');
      if (!variants.has(productId)) variants.set(productId, []);
      variants.get(productId).push(variant);
    });

    return { products, variants };
  }

  function renderFeedback(result) {
    const body = document.getElementById('veloraRoutineBody');
    if (!body) return;

    let node = document.getElementById('veloraRoutineCartFeedback');
    if (!node) {
      node = document.createElement('div');
      node.id = 'veloraRoutineCartFeedback';
      node.className = 'velora-routine-cart-feedback';
      const actions = body.querySelector('.velora-routine-actions');
      if (actions) actions.parentNode.insertBefore(node, actions);
      else body.appendChild(node);
    }

    const skipped = Array.isArray(result.skipped) ? result.skipped : [];
    const failed = Array.isArray(result.failed) ? result.failed : [];
    const already = Number(result.alreadyInCart || 0);
    const added = Number(result.added || 0);

    const parts = [
      added ? t(added + ' item(s) added to your cart.', 'تمت إضافة ' + added + ' منتج للـCart.') : '',
      already ? t(already + ' item(s) were already in your cart.', already + ' منتج موجودين بالفعل في الـCart.') : '',
      skipped.length ? t(skipped.length + ' item(s) were skipped because they are not available now.', 'اتخطّينا ' + skipped.length + ' منتج لأنهم مش متاحين حاليًا.') : '',
      failed.length ? t(failed.length + ' item(s) could not be added. Please try again.', failed.length + ' منتج ماقدرتش أضيفهم. جرّبي تاني.') : ''
    ].filter(Boolean);

    node.innerHTML =
      '<div class="velora-routine-cart-summary"><strong>' +
      escapeHtml(parts.join(' ') || t('No cart changes were needed.', 'مفيش تغيير مطلوب في الـCart.')) +
      '</strong>' +
      (failed.length
        ? '<div class="velora-routine-cart-skipped"><div>' +
          escapeHtml(t('Could not add:', 'تعذرت إضافة:')) +
          '</div><ul>' +
          failed.map((item) =>
            '<li>' + escapeHtml(item.label || 'Product') + '</li>'
          ).join('') +
          '</ul></div>'
        : '') +
      (skipped.length
        ? '<div class="velora-routine-cart-skipped"><div>' +
          escapeHtml(t('Skipped items:', 'المنتجات المتخطّية:')) +
          '</div><ul>' +
          skipped.map((item) =>
            '<li>' + escapeHtml(item.label) + ' — ' + escapeHtml(item.reason) + '</li>'
          ).join('') +
          '</ul></div>'
        : '') +
      ((added || already) && typeof navigateTo === 'function'
        ? '<button type="button" class="btn btn-outline" id="veloraRoutineOpenCart" style="margin-top:.75rem;width:100%;">' +
          escapeHtml(t('Open my cart', 'افتحي الـCart')) +
          '</button>'
        : '') +
      '</div>';

    const openCartButton = document.getElementById('veloraRoutineOpenCart');
    if (openCartButton) {
      openCartButton.addEventListener('click', () => {
        navigateTo('cart');
      }, { once: true });
    }
  }

  function bindStyles() {
    if (document.getElementById('veloraRoutineCartStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraRoutineCartStyle';
    style.textContent = [
      '#veloraRoutineCartFeedback{margin-top:1rem;border:1px solid var(--border);background:var(--bg-alt);border-radius:16px;padding:.85rem 1rem;}',
      '#veloraRoutineCartFeedback strong{display:block;line-height:1.5;}',
      '#veloraRoutineCartFeedback ul{margin:.55rem 0 0;padding-inline-start:1.2rem;}',
      '#veloraRoutineCartFeedback li{margin:.25rem 0;font-size:.82rem;color:var(--text-muted);}',
      '#veloraRoutineAddAll:disabled{opacity:.65;cursor:wait;}'
    ].join('');
    document.head.appendChild(style);
  }

  async function addAllRoutineItems() {
    const button = document.getElementById('veloraRoutineAddAll');
    const routine = window.__VELORA_CURRENT_ROUTINE;
    if (!button || !routine || button.disabled) return;

    bindStyles();
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = t('Adding…', 'بنضيف…');

    const result = {
      added: 0,
      alreadyInCart: 0,
      skipped: [],
      failed: []
    };

    try {
      const user = await getAuthenticatedUser();
      const client = getClient();
      const selectedSteps = (Array.isArray(routine.steps) ? routine.steps : [])
        .filter((step) => step?.selection_status === 'selected' && UUID_RE.test(String(step?.product?.id || '')) && step?.product);

      if (!selectedSteps.length) {
        renderFeedback(result);
        return result;
      }

      for (const step of selectedSteps) {
        const product = step.product;
        const variant = step.variant?.id ? step.variant : null;
        const productId = String(product.id);
        const requestedVariantId = variant ? String(variant.id) : null;
        const label = String(product.name || 'Product');

        // The routine engine has already selected these products. Cart RPCs are
        // the final authority for approval, seller state, stock and variant validity.
        try {
          const currency = String(
            product.currency_code ||
            product.currency ||
            routine.currency ||
            'EGP'
          ).toUpperCase();

          const rpcResult = variant
            ? await client.rpc('velora_upsert_cart_item_variant', {
                p_product_id: productId,
                p_product_variant_id: requestedVariantId,
                p_quantity: 1,
                p_currency: currency
              })
            : await client.rpc('velora_upsert_cart_item', {
                p_product_id: productId,
                p_quantity: 1,
                p_currency: currency
              });

          if (rpcResult.error) throw rpcResult.error;

          result.added += 1;
          syncLocalCartLine(product, variant, 1);
        } catch (error) {
          const code = errorCode(error);
          if (isUnavailableCode(code)) {
            result.skipped.push({
              label: variant ? label + ' · ' + String(variant.name || t('Variant', 'الاختيار')) : label,
              reason: code === 'INSUFFICIENT_STOCK' || code === 'INSUFFICIENT_VARIANT_STOCK'
                ? t('Stock changed before the item could be added.', 'المخزون اتغيّر قبل الإضافة.')
                : t('Item is no longer available.', 'المنتج مبقاش متاح.')
            });
          } else {
            result.failed.push({
              label,
              error
            });
          }
        }
      }

      renderFeedback(result);

      // The authenticated server cart is updated by the RPCs above.
      // Keep the legacy local UI cart synchronized so badge, sidebar, cart page,
      // and checkout all see the same newly-added canonical lines.

      if (result.failed.length) {
        result.failed.forEach((item) => console.error('[Routine→Cart] add failed', item.error));
        if (typeof showToast === 'function') {
          showToast(
            t('Some routine items could not be added. Please try again.', 'في منتجات من الروتين ماقدرتش أضيفها. جرّبي تاني.'),
            'error'
          );
        }
      } else if (result.added || result.alreadyInCart || result.skipped.length) {
        if (typeof showToast === 'function') {
          showToast(
            result.skipped.length
              ? t('Routine added with some unavailable items skipped.', 'اتضاف الروتين مع تخطي المنتجات غير المتاحة.')
              : t('Routine added to cart.', 'تمت إضافة الروتين للـCart.'),
            result.skipped.length ? 'warning' : 'success'
          );
        }
      }

      return result;
    } catch (error) {
      console.error('[Routine→Cart] adapter failed', error);
      if (typeof showToast === 'function') {
        const message = errorCode(error) === 'AUTH_REQUIRED'
          ? t('Please sign in first.', 'سجّلي الدخول الأول.')
          : t('We could not add the routine to your cart.', 'ماقدرناش نضيف الروتين للـCart.');
        showToast(message, 'error');
      }
      result.failed.push({ label: 'Routine', error });
      renderFeedback(result);
      return result;
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  window.veloraRoutineCart = Object.freeze({
    addAll: addAllRoutineItems
  });
})();
