# Velora — Phase C
## Quiz v2 UI Source Evidence — 2026-09-21

**Status:** **SOURCE READY / BROWSER PENDING**  
**Branch:** `sprint-2-s2d-admin`  
**Production:** **FROZEN**

## 1. Scope

This artifact covers only the customer-facing Quiz v2 source flow.

It does not implement:

- commerce;
- checkout;
- payment;
- subscription;
- shipping;
- seller economics;
- Routine Engine changes;
- production changes.

## 2. Source

Primary module:

`src/scripts/61-s1-c-quiz-v2.js`

Routine presentation remains isolated in:

`src/scripts/60-s1-c-routine-ux.js`

The legacy v1 module remains loaded for compatibility:

`src/scripts/58-s1-b1-beauty-passport.js`

No v1 function was rewritten.

## 3. Quiz Contract

Version:

`beauty-quiz.v2`

Minimum path = exactly three questions:

1. `بشرتك عاملة إزاي؟`
2. `إيه أكبر حاجة عايزة تحسّنيها؟`
3. `ميزانيتك للروتين؟`

Required persisted fields:

- `skin_type`
- `goal`
- `routine_budget`

## 4. Controlled Answer Mapping

### Q1 — skin_type

| UI | Value |
|---|---|
| دهنية / Oily | `oily` |
| جافة / Dry | `dry` |
| مختلطة / Combination | `combination` |
| عادية / Normal | `normal` |
| مش عارفة / I don't know | `unknown` |

### Q2 — goal

The UI uses a finite, catalog-aligned cosmetic goal set rather than free text:

| UI | Value |
|---|---|
| إشراقة وتوحيد مظهر البشرة / Brightening & even-looking skin | `brightening` |
| ترطيب البشرة / Hydration | `hydration` |
| العناية بالبشرة المعرضة للحبوب / Blemish-prone skin care | `acne` |
| تحسين مظهر الخطوط والعلامات / Improve the look of lines & signs of aging | `anti-aging` |
| تقليل اللمعان والزيوت الزائدة / Reduce excess oil & shine | `oil` |

These values are consumed as the existing `goal` field. The backend v2 RPC currently validates non-empty goal text but does not impose a database whitelist; the UI therefore enforces the controlled customer selection.

### Q3 — routine_budget

| UI | Value |
|---|---|
| أقل من 500 جنيه / Under EGP 500 | `under_500` |
| من 500 لـ 1000 جنيه / EGP 500–1,000 | `500_1000` |
| من 1000 لـ 2000 جنيه / EGP 1,000–2,000 | `1000_2000` |
| أكتر من 2000 جنيه / Over EGP 2,000 | `over_2000` |
| مش عارفة / I don't know | `unknown` |

## 5. Persistence

The source calls:

`public.velora_save_beauty_passport_v2(p_skin_type, p_goal, p_routine_budget)`

No `user_id` is sent by the browser as an ownership authority.

The UI checks for an authenticated session before save.

After a successful save, the UI hands off to:

`window.veloraRoutineUX.open()`

This preserves the sequence:

`Quiz v2 → Save → Routine RPC → Routine UI`

## 6. Legacy Compatibility

No bulk migration is triggered by the UI.

Existing v1 Passport rows remain untouched until that customer completes the v2 path.

The existing v1 module and its API remain separate.

## 7. Returning User UX

The primary home entry point is state-aware:

- no v2-complete Passport → **اعرفي روتينك / Build my routine** → Quiz v2;
- v2-complete Passport → **شوفي روتينك / See my routine** → Routine UX directly;
- v2 completeness means `beauty-quiz.v2` plus non-empty `skin_type`, `goal`, and `routine_budget`;
- `unknown` is a valid persisted value and therefore counts as complete;
- entry state is re-checked at click time, preventing stale client state from bypassing the current Passport state;
- Passport ownership is enforced through authenticated session + RLS; the frontend does not send a user UUID as an ownership authority.

The user can reach Quiz v2 again through the existing Quiz API when a profile update is needed.

## 8. UX Requirements Implemented

- Arabic and English visible copy.
- Mobile-first modal layout.
- One question at a time.
- Progress indicator.
- Back / Next navigation.
- Selection required before continuing.
- Save-and-build action on Q3.
- Authentication gate.
- Invalid backend value handling.
- No medical diagnosis or treatment language.
- No location/climate inference.
- No commercial logic.
- No checkout integration.
- No fabricated explanation generation.

## 9. Routine Boundary

The Quiz module does not calculate recommendations.

It only collects and persists the three approved v2 inputs.

The Routine module owns:

`velora_generate_beauty_routine()`

and consumes only:

`beauty-routine.v1`

## 10. Source Verification

Verified by repository inspection:

- Quiz v2 script is loaded exactly once.
- Routine UX script is loaded exactly once.
- Legacy v1 script remains loaded exactly once.
- Quiz v2 RPC call exists exactly once in the save path.
- Routine entrypoint is no longer owned by the Routine UI module.
- Routine entrypoint is owned by the Quiz v2 UI.
- Returning users have an active **عدّلي إجاباتك / Edit my answers** action from Routine back to Quiz v2.
- Question titles and subtitles have separate AR/EN source values.

## 11. Browser Gate

**Browser = PENDING.**

No browser PASS is claimed by this document.

The future unified browser gate should verify:

`Login → اعرفي روتينك → Q1 → Q2 → Q3 → Save → Routine`

plus:

- AR / EN;
- mobile;
- dark mode;
- incomplete/auth handling;
- persisted v2 profile;
- complete/partial/no_matches Routine states;
- product + variant presentation;
- no internal metadata exposure.

## 12. Status

**Quiz v2 UI Source = READY**

**Quiz v2 UI Browser = PENDING**

**Production = FROZEN**
