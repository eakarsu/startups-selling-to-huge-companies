# EnterpriseOS — Audit Note

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
