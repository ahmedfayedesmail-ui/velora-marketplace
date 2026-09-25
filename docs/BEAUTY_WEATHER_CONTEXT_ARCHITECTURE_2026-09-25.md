# Velora — Beauty Weather Context Architecture
## 2026-09-25

Environment: Restore-Test / staging  
Production: FROZEN

## Current state

Velora has an active **calendar season engine** for Egypt.

The authoritative context is:
- market: EG
- hemisphere: north
- timezone: Africa/Cairo
- season basis: meteorological/calendar month
- server-local date is authoritative

The Routine Engine can use structured `products.seasonal_fit` data to adjust deterministic ranking.

## Explicit boundary

Live weather is **not currently active**.

The system must not claim that temperature, humidity, UV, rain, or live weather is currently used to personalize a routine.

## Future weather layer

A future `weather_context` layer may contain:
- observed/fetched timestamp
- coarse city
- temperature
- humidity
- UV index when available
- rain/precipitation context
- provider name/version
- freshness/expiry
- request/reference id

The weather layer must be **separate** from the stable season field.

Example:

`calendar season = autumn`

while:

`weather conditions = unusually hot/high humidity`

The latter may influence contextual fit without changing the former.

## Privacy boundary

Do not use precise device geolocation for this layer.

Prefer:
1. self-provided city;
2. existing coarse shipping/customer city where lawful and appropriate;
3. provider geocoding only transiently when necessary.

Do not persist precise coordinates merely to improve cosmetic recommendations.

## Failure behavior

Weather provider failure, stale data, rate-limit, or unavailable city must never break the routine engine.

Fallback:
`calendar context → seasonal catalog ranking → normal routine`

## Safety / product language

The Beauty Passport is an informational cosmetic personalization system. It is not a diagnosis or medical treatment recommendation.

Any future weather-driven wording must avoid medical certainty or guaranteed outcomes.

## Launch gate

Weather personalization is not a launch prerequisite for the current Egypt-first MVP. When introduced, provider contract, privacy review, retention rules, and customer disclosure must be approved before production use.
