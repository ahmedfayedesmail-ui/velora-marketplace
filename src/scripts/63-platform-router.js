/* ============================================
   VELORA - Platform Route Controller
   Keeps Marketplace / Seller / Admin in browser
   history without requiring separate deployments.
   ============================================ */

(function () {
    'use strict';

    if (window.__VELORA_PLATFORM_ROUTER__) return;
    window.__VELORA_PLATFORM_ROUTER__ = true;

    const PLATFORM_ROUTES = new Set(['seller', 'admin', 'owner']);
    const MARKETPLACE_PAGES = new Set([
        'home', 'shop', 'guide', 'blog', 'compare', 'reviews',
        'favorites', 'cart', 'checkout', 'orders', 'account'
    ]);

    const originalOpenSeller = window.openSellerPlatform;
    const originalCloseSeller = window.closeSellerPlatform;
    const originalOpenAdmin = window.openAdminPlatform;
    const originalCloseAdmin = window.closeAdminPlatform;
    const originalOpenOwner = window.openOwnerPlatform;
    const originalCloseOwner = window.closeOwnerPlatform;
    const originalNavigateTo = window.navigateTo;
    const canonicalOpenSeller = window.VELORA_OPEN_SELLER;
    const canonicalCloseSeller = window.VELORA_CLOSE_SELLER;
    const canonicalOpenAdmin = window.__VELORA_OPEN_ADMIN_CORE || window.VELORA_OPEN_ADMIN;
    const canonicalCloseAdmin = window.VELORA_CLOSE_ADMIN;
    const canonicalOpenOwner = window.VELORA_OPEN_OWNER;
    const canonicalCloseOwner = window.VELORA_CLOSE_OWNER;

    let returnHash = normalizeHash(window.location.hash);
    let syncing = false;

    function normalizeHash(hash) {
        return String(hash || '').replace(/^#/, '').split('?')[0] || '';
    }

    function currentMarketplaceHash() {
        const hash = normalizeHash(window.location.hash);
        return MARKETPLACE_PAGES.has(hash) ? hash : 'home';
    }

    function closeAllPlatforms() {
        try { if (typeof canonicalCloseSeller === 'function') canonicalCloseSeller(); else if (typeof originalCloseSeller === 'function') originalCloseSeller(); } catch (e) {}
        try { if (typeof canonicalCloseAdmin === 'function') canonicalCloseAdmin(); else if (typeof originalCloseAdmin === 'function') originalCloseAdmin(); } catch (e) {}
        try { if (typeof canonicalCloseOwner === 'function') canonicalCloseOwner(); else if (typeof originalCloseOwner === 'function') originalCloseOwner(); } catch (e) {}
    }

    async function activatePlatform(route) {
        if (!PLATFORM_ROUTES.has(route)) return false;

        syncing = true;
        try {
            closeAllPlatforms();

            if (route === 'seller') {
                const opener = typeof canonicalOpenSeller === 'function' ? canonicalOpenSeller : originalOpenSeller;
                if (typeof opener === 'function') { await opener(); return true; }
            }

            if (route === 'admin') {
                const opener = typeof canonicalOpenAdmin === 'function' ? canonicalOpenAdmin : originalOpenAdmin;
                if (typeof opener === 'function') { await opener(); return true; }
            }

            if (route === 'owner') {
                const opener = typeof canonicalOpenOwner === 'function' ? canonicalOpenOwner : originalOpenOwner;
                if (typeof opener === 'function') { await opener(); return true; }
            }
        } finally {
            syncing = false;
        }

        return false;
    }

    function activateMarketplace(page) {
        closeAllPlatforms();

        if (!MARKETPLACE_PAGES.has(page)) page = 'home';

        if (typeof originalNavigateTo === 'function') {
            originalNavigateTo(page);
        }
    }

    async function goPlatform(route) {
        if (!PLATFORM_ROUTES.has(route)) return false;

        if (!PLATFORM_ROUTES.has(normalizeHash(window.location.hash))) {
            returnHash = currentMarketplaceHash();
        }

        // Platform activation is canonical and independent from hashchange.
        // The hash mirrors the current platform for refresh/back navigation only.
        const current = normalizeHash(window.location.hash);
        if (current !== route) {
            const url = new URL(window.location.href);
            url.hash = route;
            window.history.pushState({}, '', url);
        }

        return await activatePlatform(route);
    }

    function goMarketplace() {
        const target = returnHash || 'home';
        returnHash = target;
        closeAllPlatforms();

        const url = new URL(window.location.href);
        url.hash = target === 'home' ? '' : target;
        window.history.replaceState({}, '', url);
        activateMarketplace(target);
    }

    function syncRoute() {
        if (syncing) return;

        const route = normalizeHash(window.location.hash);

        if (PLATFORM_ROUTES.has(route)) {
            activatePlatform(route);
            return;
        }

        activateMarketplace(route || 'home');
    }

    window.openSellerPlatform = function () {
        return goPlatform('seller');
    };

    window.openAdminPlatform = function () {
        return goPlatform('admin');
    };

    window.openAdminPanel = window.openAdminPlatform;

    window.openOwnerPlatform = function () {
        return goPlatform('owner');
    };

    window.closeSellerPlatform = function () {
        if (PLATFORM_ROUTES.has(normalizeHash(window.location.hash))) {
            goMarketplace();
        } else if (typeof originalCloseSeller === 'function') {
            originalCloseSeller();
        }
    };

    window.closeAdminPlatform = function () {
        if (PLATFORM_ROUTES.has(normalizeHash(window.location.hash))) {
            goMarketplace();
        } else if (typeof originalCloseAdmin === 'function') {
            originalCloseAdmin();
        }
    };

    window.closeOwnerPlatform = function () {
        if (PLATFORM_ROUTES.has(normalizeHash(window.location.hash))) {
            goMarketplace();
        } else if (typeof originalCloseOwner === 'function') {
            originalCloseOwner();
        }
    };

    window.switchPlatform = function (platformId) {
        if (platformId === 'admin') {
            window.__VELORA_PLATFORM_TRACE__?.('switchPlatform admin',{
                locale:window.VELORA_GLOBAL_LOCALE||null,
                stateLocale:window.VELORA_GLOBAL_LOCALE_STATE?.locale||null,
                documentElementLang:document.documentElement.lang||null,
                setVeloraLanguage:typeof window.setVeloraLanguage==='function' ? window.setVeloraLanguage.toString().slice(0,180) : null,
                v5SetLanguage:typeof window.VELORA_V5_SET_LANGUAGE==='function' ? window.VELORA_V5_SET_LANGUAGE.toString().slice(0,180) : null,
                setLanguageIsV5:window.setVeloraLanguage===window.VELORA_V5_SET_LANGUAGE,
                windowOpenAdmin:typeof window.openAdminPlatform==='function' ? window.openAdminPlatform.toString().slice(0,180) : null,
                capturedOriginalOpenAdmin:typeof originalOpenAdmin==='function' ? originalOpenAdmin.toString().slice(0,180) : null,
                canonicalOpenAdmin:typeof canonicalOpenAdmin==='function' ? canonicalOpenAdmin.toString().slice(0,180) : null,
                switchPlatform:window.switchPlatform.toString().slice(0,180)
            });
        }

        const menu = document.getElementById('platformSwitcherMenu');
        if (menu) menu.classList.remove('open');

        if (platformId === 'marketplace') {
            goMarketplace();
            return;
        }

        // Direct UI action: use the stable canonical core opener for Admin.
        // Feature modules may decorate public globals, but they must not sit on
        // the critical platform-entry path.
        const entry = platformId === 'seller'
            ? (window.__VELORA_OPEN_SELLER_CORE || originalOpenSeller)
            : platformId === 'admin'
                ? (window.__VELORA_OPEN_ADMIN_CORE || originalOpenAdmin)
                : platformId === 'owner'
                    ? originalOpenOwner
                    : null;

        if (typeof entry !== 'function') {
            window.__VELORA_PLATFORM_TRACE__?.('switchPlatform admin entry missing',{
                platformId,
                originalOpenAdminType:typeof originalOpenAdmin
            });
            return;
        }

        if (platformId === 'admin') {
            window.__VELORA_PLATFORM_TRACE__?.('switchPlatform admin invoking entry',{
                entry:entry.toString().slice(0,180),
                sameAsWindowOpenAdmin:entry===window.openAdminPlatform,
                sameAsCanonicalOpenAdmin:entry===window.VELORA_OPEN_ADMIN
            });
        }

        try {
            if (platformId !== 'seller' && typeof originalCloseSeller === 'function') originalCloseSeller();
            if (platformId !== 'admin' && typeof originalCloseAdmin === 'function') originalCloseAdmin();
            if (platformId !== 'owner' && typeof originalCloseOwner === 'function') originalCloseOwner();

            const result = entry();
            if (platformId === 'admin') {
                window.__VELORA_PLATFORM_TRACE__?.('switchPlatform admin entry returned',{
                    resultType:typeof result,
                    isPromiseLike:!!(result&&typeof result.then==='function')
                });
            }
            if (result && typeof result.catch === 'function') {
                result.catch((error) => {
                    window.__VELORA_PLATFORM_TRACE__?.('switchPlatform admin async rejection',{
                        message:error?.message||String(error),
                        stack:error?.stack||null,
                        name:error?.name||null
                    });
                    console.error('[Velora platform switch]', error);
                });
            }

            if (!PLATFORM_ROUTES.has(normalizeHash(window.location.hash))) {
                returnHash = currentMarketplaceHash();
            }
            const url = new URL(window.location.href);
            url.hash = platformId;
            window.history.pushState({}, '', url);
            return result;
        } catch (error) {
            window.__VELORA_PLATFORM_TRACE__?.('switchPlatform admin sync exception',{
                message:error?.message||String(error),
                stack:error?.stack||null,
                name:error?.name||null
            });
            console.error('[Velora platform switch]', error);
        }
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);

    function initialSync() {
        const route = normalizeHash(window.location.hash);

        if (PLATFORM_ROUTES.has(route)) {
            let tries = 0;
            const timer = setInterval(function () {
                tries += 1;
                if ((typeof STATE !== 'undefined' && STATE.user) || tries >= 40) {
                    clearInterval(timer);
                    if (typeof STATE !== 'undefined' && STATE.user) syncRoute();
                }
            }, 250);
            return;
        }

        syncRoute();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialSync, { once: true });
    } else {
        initialSync();
    }

    console.log('✅ Velora platform routing active');
})();
