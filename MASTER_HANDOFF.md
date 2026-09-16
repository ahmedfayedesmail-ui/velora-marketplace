# Velora Master Handoff

## Runtime localization authority

- Before v1.0, `10-localization.js` must export the authoritative runtime language registry as `window.LANGUAGE_META`.
- CI localization checks must read `window.LANGUAGE_META` directly from the browser runtime.
- DOM-derived locale discovery is diagnostic only and must not be used as a source of truth.
- The localization modules (`00`, `10`, `50`, `51`) must keep their responsibilities explicit; metadata ownership belongs to `10-localization.js` unless architecture is intentionally revised.
