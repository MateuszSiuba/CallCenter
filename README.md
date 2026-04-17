 # CallCenter - Support Hub

Lightweight knowledge base UI for call center agents (TV-focused currently), powered by static frontend files and local data sources.

## Tech Stack
- `index.html` + `style.css` + `app.js` (vanilla JS, Tailwind CDN)
- Data files in `data/` loaded directly in browser:
	- `data/models.js`
	- `data/policies.js`
	- `data/knowledge.js`

## Run Locally
Open `index.html` directly in browser or use any static server.

## Repository Structure
- `app.js`: UI state, rendering, filtering, search, modals
- `data/`: data sources consumed by UI
- `scripts/`: maintenance and data quality scripts
	- `scripts/migrate-models.js`
	- `scripts/normalize-models-data.js`
	- `scripts/validate-models-data.js`
	- `scripts/audit-models-language.js`
	- `scripts/check-data-quality.js`
	- `scripts/lib/models-io.js`

## Data Maintenance Workflow
Run from project root.

1. Normalize dataset (canonical labels + cleanup artifacts):

```bash
node scripts/normalize-models-data.js
```

2. Validate structure and canonical conventions:

```bash
node scripts/validate-models-data.js
```

3. Audit potentially non-English strings:

```bash
node scripts/audit-models-language.js
```

4. Run combined quality check:

```bash
node scripts/check-data-quality.js
```

## Conventions
- Canonical OS labels:
	- `Titan OS`
	- `Google TV`
- Keep generated/tmp artifacts out of git (see `.gitignore`).
- Before commit, run at least:
	- `node scripts/validate-models-data.js`

## Evidence Policy (Source-First)
- Do not add or modify factual model data without evidence from a source.
- If data is missing, keep it empty and flag it in validation output instead of guessing.
- Normalization scripts may only apply explicit, predefined alias mappings.
- Any enrichment from web pages should be based on fetched source content and reproducible scripts.
- No assumptions, no inferred placeholders presented as facts.

## Current Improvement Backlog
- Expand knowledge articles and procedure coverage
- Add more model pictures and richer gallery metadata
- Add more cross-links between model specs and KB/policies

## Next Plan

### P1 - Data Quality (must-do)
- [ ] Close all 12 validation warnings from `scripts/validate-models-data.js`.
- [ ] Fill missing `osProfileId` for listed models and missing `panelType` for HFL entries.
- [ ] Re-run `node scripts/check-data-quality.js` and target: `errors=0`, `warnings=0`.

### P1 - Ports Consistency (must-do)
- [ ] Enforce one canonical naming style for ports across all models (example groups: `Headphone Out`, `Optical Audio Out`, `TV Antenna`).
- [ ] Keep HDMI-first ordering for every model with ports.
- [ ] Add validator checks for port-name consistency and HDMI-first so regressions are caught automatically.

### P2 - Data Completeness (high value)
- [ ] Audit `data/model-media.js` for missing `remoteImageUrl` or `portsImageUrl` and prepare a short gap list.
- [ ] Add/refresh media for highest-priority models used most often by agents.

### P2 - UX Regression Smoke (high value)
- [ ] Quick manual test of session restore flow (browse/detail/article after refresh).
- [ ] Quick manual test of spec-details modal and image zoom on desktop and mobile viewport.

### P1 - Articles and Feature Translations (focus)
- [ ] Review all KB articles and mark top-priority procedures for agents (quick-win list).
- [ ] Prepare one canonical EN <-> PL glossary for TV features (single naming standard).
- [ ] Normalize feature naming in `data/models.js` to glossary terms (remove duplicates/synonyms).
- [ ] Add/refresh article tags so feature search maps to correct KB article more reliably.
- [ ] Add missing high-impact KB articles for most common support scenarios.

### P3 - Documentation Sync (nice-to-have)
- [ ] Update README tech stack section to include `data/model-media.js` explicitly.
- [ ] Add a short "pre-commit checklist" block (`check-data-quality`, manual smoke, changed models list).
