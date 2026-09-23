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
    const client = getClient();
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error('AUTH_REQUIRED');
    return data.user;
  }

  async function readServerCartKeys(userId) {
    const client = getClient();
    const { data, error } = await client
      .from('carts')
      .select('id,cart_items(product_id,product_variant_id,quantity)')
      .eq('customer_id', userId)
      .maybeSingle();

    if (error) throw error;

    const keys = new Set();
    const rows = Array.isArray(data?.cart_items) ? data.cart_items : [];
    rows.forEach((row) => {
      if (UUID_RE.test(String(row.product_id || ''))) {
        keys.add(lineKey(row.product_id, row.product_variant_id));
      }
    });
    return keys;
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
    const already = Number(result.alreadyInCart || 0);
    const added = Number(result.added || 0);

    const parts = [
      added ? t(added + ' item(s) added to your cart.', 'تمت إضافة ' + added + ' منتج للـCart.') : '',
      already ? t(already + ' item(s) were already in your cart.', already + ' منتج موجودين بالفعل في الـCart.') : '',
      skipped.length ? t(skipped.length + ' item(s) were skipped because they are not available now.', 'اتخطّينا ' + skipped.length + ' منتج لأنهم مش متاحين حاليًا.') : ''
    ].filter(Boolean);

    node.innerHTML =
      '<div class="velora-routine-cart-summary"><strong>' +
      escapeHtml(parts.join(' ' ) || t('No cart changes were needed.', 'مفيش تغيير مطلوب في الـCart.')) +
      '</strong>' +
      (skipped.length
        ? '<div class="velora-routine-cart-skipped"><div>' +
          escapeHtml(t('Skipped items:', 'المنتجات المتخطّية:')) +
          '</div><ul>' +
          skipped.map((item) =>
            '<li>' + escapeHtml(item.label) + ' — ' + escapeHtml(item.reason) + '</li>'
          ).join('') +
          '</ul></div>'
        : '') +
      '</div>';
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

      const serverKeys = await readServerCartKeys(user.id);
      const productIds = selectedSteps.map((step) => String(step.product.id));
      const catalog = await readLiveCatalog(productIds);

      for (const step of selectedSteps) {
        const productId = String(step.product.id);
        const requestedVariantId = step.variant?.id ? String(step.variant.id) : null;
        const key = lineKey(productId, requestedVariantId);
        const label = String(
          catalog.products.get(productId)?.name ||
          step.product.name ||
          'Product'
        );

        if (serverKeys.has(key)) {
          result.alreadyInCart += 1;
          continue;
        }

        const product = catalog.products.get(productId);
        if (!product || String(product.status || '') !== 'approved') {
          result.skipped.push({
            label,
            reason: t('Product is no longer available.', 'المنتج مبقاش متاح.')
          });
          continue;
        }

        const activeVariants = (catalog.variants.get(productId) || [])
          .filter((variant) => variant.is_active === true);

        let variant = null;
        if (requestedVariantId) {
          variant = activeVariants.find((candidate) => String(candidate.id) === requestedVariantId) || null;
          if (!variant) {
            result.skipped.push({
              label,
              reason: t('Selected variant is no longer available.', 'الـVariant المختار مبقاش متاح.')
            });
            continue;
          }
          if (Number(variant.stock_quantity || 0) < 1) {
            result.skipped.push({
              label + ' · ' + String(variant.name || t('Variant', 'الاختيار')),
              reason: t('This option is out of stock.', 'الاختيار ده خلص من المخزون.')
            });
            continue;
          }
        } else {
          if (activeVariants.length) {
            result.skipped.push({
              label,
              reason: t('A variant selection is required for this product.', 'المنتج ده محتاج اختيار Variant.')
            });
            continue;
          }
          if (Number(product.stock || 0) < 1) {
            result.skipped.push({
              label,
              reason: t('Product is out of stock.', 'المنتج خلص من المخزون.')
            });
            continue;
          }
        }

        try {
          const currency = String(product.currency_code || routine.currency || 'EGP').toUpperCase();
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
          serverKeys.add(key);
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

      if (typeof window.veloraSyncCloudCart === 'function') {
        // Cloud-cart refresh is useful but must never block the routine feedback.
        void window.veloraSyncCloudCart().catch((syncError) => {
          console.warn('[Routine→Cart] cloud cart sync failed', syncError);
        });
      }

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

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#veloraRoutineAddAll');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    void addAllRoutineItems();
  }, true);

  window.veloraRoutineCart = Object.freeze({
    addAll: addAllRoutineItems
  });
})();
