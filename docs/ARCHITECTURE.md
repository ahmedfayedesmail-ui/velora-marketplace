# Velora architecture migration

## Current migration layer
The current code originated as one large RC9 HTML file. To avoid breaking working behavior, this first rebuild keeps all JavaScript in classic scripts with the original execution order.

### Source of truth
- `src/index.html`: document structure and page content
- `src/styles/velora.css`: all extracted styles, in original order
- `src/scripts/`: extracted JavaScript blocks, in original execution order
- `legacy/Velora_ROOT_RC9.html`: frozen rollback/reference copy

## Next refactor wave
1. Establish a single app bootstrap.
2. Move shared runtime/config into `src/scripts/core/`.
3. Group customer, seller, admin, owner, localization, marketplace, and payments code behind explicit module boundaries.
4. Replace implicit globals with a small application runtime API.
5. Keep Supabase/Paymob secrets server-side only.
6. Add automated smoke checks before each merge.
