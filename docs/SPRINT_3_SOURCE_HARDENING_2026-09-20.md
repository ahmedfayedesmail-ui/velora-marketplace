# Velora — Sprint 3 Source Hardening Log
## 2026-09-20 — No-browser engineering window

**Branch:** `sprint-2-s2d-admin`  
**Production:** FROZEN

### F-003 — Desktop Scroll

**Source investigation**
- The checkout layout uses a secondary fixed `400px` grid track.
- Cart rendering contains inline two-column grid styles, making the layout harder to constrain from the stylesheet.
- Global pages already use `overflow-x:hidden`, but that alone does not prevent child layout overflow.

**Minimal source fix**
- Constrain checkout tracks with `minmax(0, ...)`.
- Constrain Cart's inline grid to `minmax(0,1fr) minmax(0,400px)`.
- Add `min-width:0` / `max-width:100%` to relevant page/container children.

**Status:** Source fix applied. Browser verification pending.

### F-004 — Screen Consistency

**Source investigation**
- Several generated sections use fixed-width or intrinsic child sizing.
- The hardening above establishes a consistent containment rule for page containers, checkout columns, and Cart content.

**Status:** Source hardening applied. Browser verification pending.

### FIND-BE-020 — Dark Mode

**Source investigation**
- Dark theme variables are defined centrally.
- Several form controls did not explicitly inherit the dark theme background/text/color-scheme.
- Native `select` options can retain browser-default colors.

**Minimal source fix**
- Explicit dark-mode styling for `input`, `select`, `textarea`, sort/compare controls.
- Explicit dark `option` colors.
- `color-scheme: dark` for form controls.

**Status:** Source fix applied. Browser verification pending.

### FIND-BE-023 — Console Errors (400/401)

**Source investigation**
Reviewed the current frontend request surface, including:
- global locale RPCs
- i18n catalog RPCs
- authenticated profile/seller lookups
- marketplace catalog RPC
- checkout RPC
- cloud cart reads/writes
- wishlist RPCs
- customer order reads
- admin order reads/status RPC

The source contains both authenticated and public request paths. Some 401 responses can legitimately occur when authenticated paths execute before a session exists; the source generally guards these calls with `STATE.user` / session checks. The current source also contains explicit UUID filtering for localized-content RPC inputs.

A browser Network trace with the exact failing request is still required to identify whether a remaining 400/401 is:
1. an invalid request payload,
2. an RLS/authentication rejection,
3. a missing/incorrect RPC contract, or
4. an expected anonymous request.

**Decision:** Do not suppress console errors or broadly catch-and-ignore the failing request. Keep FIND-BE-023 OPEN until the exact request can be correlated.

### Language scope hardening

Phase 1 exposes only:
- EN
- AR

The localization code for future languages remains in the repository, but:
- the main selector exposes only EN/AR;
- the Global Preferences selector exposes only EN/AR;
- the runtime rejects non-EN/AR language changes during Phase 1;
- invalid legacy stored language values fall back to EN.

### Browser gate

The following remain pending:
- desktop scroll regression
- screen-size consistency regression
- dark-mode visual regression
- exact 400/401 Network correlation
- authenticated end-to-end order/browser flow
