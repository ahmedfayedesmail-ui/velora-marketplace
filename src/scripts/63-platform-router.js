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
        try { if (typeof originalCloseSeller === 'function') originalCloseSeller(); } catch (e) {}
        try { if (typeof originalCloseAdmin === 'function') originalCloseAdmin(); } catch (e) {}
        try { if (typeof originalCloseOwner === 'function') originalCloseOwner(); } catch (e) {}
    }

    function activatePlatform(route) {
        if (!PLATFORM_ROUTES.has(route)) return false;

        syncing = true;
        try {
            closeAllPlatforms();

            if (route === 'seller' && typeof originalOpenSeller === 'function') {
                originalOpenSeller();
                return true;
            }

            if (route === 'admin' && typeof originalOpenAdmin === 'function') {
                originalOpenAdmin();
                return true;
            }

            if (route === 'owner' && typeof originalOpenOwner === 'function') {
                originalOpenOwner();
                return true;
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

    function goPlatform(route) {
        if (!PLATFORM_ROUTES.has(route)) return;

        if (!PLATFORM_ROUTES.has(normalizeHash(window.location.hash))) {
            returnHash = currentMarketplaceHash();
        }

        // Platform switching is an application action, not a navigation event.
        // Do not depend on hashchange here: locale re-renders can replace the
        // switcher DOM while an async i18n pass is running, which could leave
        // the Arabic switcher changing the hash without activating the panel.
        // Activate the platform synchronously, then mirror the route in history.
        const current = normalizeHash(window.location.hash);
        const activate = () => activatePlatform(route);

        if (current !== route) {
            const url = new URL(window.location.href);
            url.hash = route;
            window.history.pushState({}, '', url);
        }

        activate();
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
        goPlatform('seller');
    };

    window.openAdminPlatform = function () {
        goPlatform('admin');
    };

    window.openAdminPanel = window.openAdminPlatform;

    window.openOwnerPlatform = function () {
        goPlatform('owner');
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
        const menu = document.getElementById('platformSwitcherMenu');
        if (menu) menu.classList.remove('open');

        switch (platformId) {
            case 'marketplace':
                goMarketplace();
                break;
            case 'seller':
                goPlatform('seller');
                break;
            case 'admin':
                goPlatform('admin');
                break;
            case 'owner':
                goPlatform('owner');
                break;
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
