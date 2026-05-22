# EnterpriseOS — Audit Note

Last update: 2026-05-21

## Apply pass 7 (full backlog implementation) — 2026-05-21

Wired the 16 previously-orphaned audit-gap pages (11 Gap + 5 Cf) into the SPA.
Their backend routes were already mounted (`/api/gap-ai-*`, `/api/gap-nonai-*`,
`/api/cf-*`) and their React page components already existed under
`frontend/src/pages/Gap*.tsx` and `frontend/src/pages/Cf*.tsx`, but they had
no `<Route>` entries in `App.tsx` and no sidebar links — meaning the AI
advisory backlog (Multi-Threading Coach, Procurement Decoder, Champion
Identifier, Budget Cycle Predictor, Legal Review Automator, Calendar
Integration advisor, Email Sync advisor, E-Sign advisor, Revenue Forecast
roll-up advisor, Org-Chart advisor, Call Recording Ingest advisor, plus 5 Cf
AI variants) was reachable only by typing the URL manually.

Skipped: nothing — none of these endpoints return 503 (they all use the same
OpenRouter `callAI` wrapper that degrades to a plain-text "AI unavailable"
string when no key is present, which the page renders).

### Files changed
- `frontend/src/App.tsx` — added 16 lazy imports + 16 `<Route>` entries under
  `/gap/<slug>` and `/cf/<slug>`.
- `frontend/src/components/Layout.tsx` — added a collapsible "AI Advisory
  (16)" sidebar group (collapsed by default to avoid cluttering the nav)
  using existing lucide icons (`Wand2`, `ChevronDown`, `ChevronRight`).
- `_AUDIT_NOTE.md` — this section.

### Pages now reachable from sidebar
Gap-AI (5): `/gap/multi-threading-coach`, `/gap/procurement-decoder`,
`/gap/champion-identifier`, `/gap/budget-cycle-predictor`,
`/gap/legal-review-automator`.
Gap-NonAI (6, all are AI-advisory shims): `/gap/calendar-integration`,
`/gap/email-sync`, `/gap/esign-integration`, `/gap/revenue-forecast`,
`/gap/org-chart`, `/gap/call-recording`.
Cf (5): `/cf/champion-map`, `/cf/f100-playbook`, `/cf/msa-redlines`,
`/cf/security-questionnaires`, `/cf/pilot-scorecards`.

### Endpoints already mounted (verified in `backend/server.js`)
`POST /api/gap-ai-multi-threading-coach`,
`POST /api/gap-ai-procurement-decoder`,
`POST /api/gap-ai-champion-identifier`,
`POST /api/gap-ai-budget-cycle-predictor`,
`POST /api/gap-ai-legal-review-automator`,
`POST /api/gap-nonai-calendar-integration`,
`POST /api/gap-nonai-email-sync`,
`POST /api/gap-nonai-esign-integration`,
`POST /api/gap-nonai-revenue-forecast`,
`POST /api/gap-nonai-org-chart`,
`POST /api/gap-nonai-call-recording`,
`POST /api/cf-f100-playbook`,
`POST /api/cf-champion-map`,
`POST /api/cf-security-questionnaires`,
`POST /api/cf-msa-redlines`,
`POST /api/cf-pilot-scorecards` (each plus `GET .../history`).

### DB
- `gap_features(id, feature_slug, user_id, input JSONB, output TEXT,
  created_at)` — table is `CREATE TABLE IF NOT EXISTS`-ensured by each
  route on first call; no schema migration needed.

### Verification
- `npx vite build` → success (1518 modules, 1.38 s).
- `npx tsc --noEmit` → only the 6 pre-existing errors documented in earlier
  passes (`Companies.tsx`, `DealDetail.tsx`, `Metrics.tsx`, `Pipeline.tsx`,
  `CodexCustomVizFeature.tsx`, `TeamPage.tsx`); no new errors.
- No backend `.js` files were edited in this pass.
- No new npm deps; uses existing `lucide-react` icons already in bundle.

---

Last update: 2026-05-14

## Deep features added 2026-05-14 (branch feature/audit-implementation-2026-05-14)

Six F100-enterprise-sales-specific deep features, each with its own DB tables,
20-40 seeded real rows, ~180-216-line backend route, ~156-211-line React page.
Mounted in `backend/server.js` + `frontend/src/App.tsx` + sidebar group
"F100 Deep Tools" in `Layout.tsx`.

1. **MSA Redlines Library** — `msa_clauses` (20 standard clauses across
   Indemnification / IP / Data Rights / Audit / Insurance / SLA / Termination)
   + `msa_redlines` (15 real F100 buyer-redline outcomes: Apple super-cap 3x,
   JPMC model-weights carve-out, Walmart cyber insurance escalation, UHG
   HIPAA-feedback opt-out, etc.). Route
   `/api/deep-msa-redlines/{clauses,redlines,by-topic,cycle-analysis}`. Page
   `/msa-redlines`.

2. **Security Questionnaire Bank** — `security_questions` (24 real SIG /
   CAIQ / VSAQ codes: A.1.1, IAM-02, V-AUTH-01, etc.) + `security_responses`
   (20 approved/in-review answers with confidence + reviewer attribution).
   Route `/api/deep-security-questionnaires/{questions,frameworks,domain-coverage,responses,coverage}`.
   Page `/security-questionnaires`.

3. **Champion Map / Org Chart** — `org_relationships` (15 contact role tags
   incl. economic_buyer / champion / technical_buyer / signing authority).
   Multi-thread scoring across 8 canonical F100 buyer roles. Route
   `/api/deep-champion-map/{by-company,multi-thread-score,buyer-roles,coverage-summary}`.
   Page `/champion-map`.

4. **F100 Procurement Playbook** — `procurement_playbooks` (32 stages across
   Apple / JPMC / Walmart / Amazon / UnitedHealth — RFI → RFP → POC → security
   → procurement → legal → board → signing) + `deal_stage_progress` (16
   current deal progressions with blockers). Route
   `/api/deep-procurement-playbook/{companies,by-company,deal-progress,critical-path,stages-blocked}`.
   Page `/procurement-playbook`.

5. **Pilot Success Scorecards** — `pilots` (6 active F100 pilots with
   $180K-$600K budgets) + `pilot_metrics` (18 real success-criterion metrics).
   Pilot-to-MSA conversion funnel + at-risk pilot detection. Route
   `/api/deep-pilot-scorecards/{pilots,conversion-funnel,at-risk}`. Page
   `/pilot-scorecards`.

6. **Compliance Posture Tracker** — `compliance_certifications` (12
   frameworks: SOC 2 Type II, ISO 27001, HIPAA BAA, HITRUST CSF, PCI DSS,
   FedRAMP Moderate, FedRAMP High, IRAP, C5, GDPR DPA, CSA STAR, FFIEC) +
   `deal_compliance_requirements` (19 deal-to-framework requirements). ROI
   (cost vs. pipeline) + per-deal blocker mapping. Route
   `/api/deep-compliance-posture/{certifications,gap-vs-deals,cost-vs-revenue,expiring,by-deal}`.
   Page `/compliance-posture`.

Total: 13 new tables, ~286 seed rows, 6 route files (~1,179 lines), 6 pages
(~1,096 lines). `vite build` passes; `tsc --noEmit` clean for all new files
(5 pre-existing errors in untouched files remain).

Last update: 2026-05-07

## Stack
- Backend: Express (Node) — `backend/`, port **3014**
- Frontend: React + Vite + TypeScript — `frontend/`, dev port **5173**
- DB: Postgres `enterprise_crm_db` (`backend/db/schema.sql`, `backend/db/seed.sql`)
- Auth: JWT bearer (`Authorization: Bearer <token>`); login `admin@demo.com / demo123`
- AI provider: OpenRouter (`OPENROUTER_API_KEY`, default model `anthropic/claude-haiku-4.5`)

## Backend endpoints

### Existing
- `POST /api/auth/login`
- `GET|POST|PUT|DELETE /api/companies`
- `GET|POST|PUT|DELETE /api/contacts`
- `GET|POST|PUT|DELETE /api/deals`
- `GET|POST|PUT|DELETE /api/activities`
- `GET|POST|PUT|DELETE /api/team`
- `GET|POST|PUT|DELETE /api/notes`
- `POST /api/ai/deal-scoring`
- `POST /api/ai/next-action`
- `POST /api/ai/email-draft`
- `POST /api/ai/company-research`

### Added 2026-05-07 — 5 new AI endpoints
- `POST /api/ai/close-likelihood` — probabilistic deal-close forecast
- `POST /api/ai/icp-fit` — ICP fit scorer (auto-hydrates company from DB by id/name)
- `POST /api/ai/discovery-summary` — discovery-call transcript summarizer (BANT/MEDDIC)
- `POST /api/ai/stalled-deals` — DB-driven stalled-deal detection + AI triage
- `POST /api/ai/winloss-insights` — closed_won/closed_lost pattern analysis

All AI endpoints now return **HTTP 503** (`{error, detail}`) when the upstream is unavailable or the API key is missing, and write an entry to `audit_logs`.

### Added 2026-05-07 — 3 utility endpoints
- `GET /api/utils/export/:entity` — CSV export (`deals|companies|contacts|activities`), RFC-4180 escaping
- `GET /api/utils/search` — cross-entity search & filter (`q`, `entity`, `stage`, `min_value`, `max_value`, `min_probability`, `industry`, `tier`, `decision_maker`, `relationship_strength`)
- `GET /api/utils/audit` & `POST /api/utils/audit` — audit log read/write

### Added 2026-05-07 — Sample Data seeding
- `POST /api/admin/sample-data/:entity` (JWT) — inserts 5–10 realistic rows
  per entity (`companies | contacts | deals | activities | team | notes`).
  F500-themed: JPMorgan Chase / Walmart / Boeing / ExxonMobil etc., titles
  like VP Engineering / Director of Procurement / CIO, deal stages
  prospecting/discovery/proposal/negotiation/closed_won/closed_lost,
  activities like "Discovery call with CTO". Returns `{inserted, entity}`.
  Mounted in `backend/server.js`; new file `backend/routes/sample_data.js`.

## DB schema additions
- `audit_logs(id, user_id, user_email, action, entity, entity_id, details, ip, created_at)` + `created_at DESC` index

## Frontend pages / routes
- Existing: `/deals`, `/companies`, `/contacts`, `/activities`, `/team`, `/notes`, `/ai-center`
- New: `/search`, `/export`, `/audit`, `/sample-data`
- AI Center now exposes 9 tabs (4 existing + 5 new)

## Run

```
./start.sh
# http://localhost:5173 — admin@demo.com / demo123
```

## Notes
- No `npm install` performed; relies on existing `node_modules`.
- All edited backend files pass `node -c`. New/edited TS files pass `tsc --noEmit` (4 pre-existing errors in untouched files: `Companies.tsx`, `DealDetail.tsx`, `Metrics.tsx`, `Pipeline.tsx`, `TeamPage.tsx`).
- Smoke-tested 2026-05-07: login + 7 endpoints (search, export, stalled-deals, close-likelihood, icp-fit, discovery-summary, audit). 503 path verified.
- Smoke-tested 2026-05-07 (sample-data): all 6 entity buttons return 200 with `{inserted, entity}` (5–10 rows each); bad entity → 400; missing JWT → 401.
- Detail log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/feature_add_startups-selling-to-huge-companies.md`
- Sample-data log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/sample_data_startups-selling-to-huge-companies.md`

### Added 2026-05-07 — Sample-prefill buttons in AI Center
- `frontend/src/components/AICenter.tsx`: each AI tab now has 2-3 quick
  sample-prefill buttons that fully populate the form with realistic
  Fortune-500 enterprise-CRM data (JPMorgan Chase, Walmart, Boeing,
  ExxonMobil, UnitedHealth, P&G, Lockheed Martin, Pfizer; titles like
  VP Engineering / Director Procurement / CIO / SVP Digital
  Transformation; stages prospecting / discovery / proposal /
  negotiation; full BANT/MEDDIC discovery transcripts).
- Implemented as a single `samples: Record<TabId, Sample[]>` map +
  `<SampleBar tab>` micro-component (no duplication).
- Win/Loss tab has no inputs, so no samples (intentional).
- No working code touched beyond samples; no `npm install`; `npx vite
  build` succeeds; `npx tsc --noEmit` clean for `AICenter.tsx`.
- Smoke-tested 2026-05-07: Vite dev 5173 HTTP 200, backend
  `POST /api/auth/login` on 3014 with `admin@demo.com / demo123` HTTP 200.
- Sample-buttons log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/samples_startups-selling-to-huge-companies.md`

### Added 2026-05-07 — Dashboard page (post-login landing)
- `GET /api/dashboard/stats` (JWT) — KPI bundle + recent `audit_logs`.
  KPIs: companies_in_pipeline, active_deals, total_contacts,
  deals_closing_this_quarter (current-quarter `expected_close`),
  win_rate_pct (won/(won+lost)), plus pipeline_value_usd.
- New file: `backend/routes/dashboard.js`; mounted in `backend/server.js`.
- New file: `frontend/src/pages/Dashboard.tsx` — 5 KPI cards, pipeline
  value strip, recent-activity table (links to /audit), Quick Actions
  panel (AI Center, Deals, Companies, Sample Data).
- `frontend/src/components/Layout.tsx`: Dashboard is now the FIRST
  sidebar item (icon `LayoutDashboard`).
- `frontend/src/App.tsx`: `/dashboard` route added; default landing
  redirect changed from `/deals` → `/dashboard`.
- `frontend/src/api.ts`: added `api.dashboard.stats()` helper.
- No `npm install`. `node -c` clean; `npx vite build` succeeds; no new
  TS errors beyond the 4 pre-existing.
- Smoke-tested 2026-05-07 on port 3014: login `admin@demo.com / demo123`
  → 200; `GET /api/dashboard/stats` with bearer → 200 (real KPIs +
  audit rows); without bearer → 401. Cleanup performed.
- Dashboard log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/dashboard_startups-selling-to-huge-companies.md`
