# Completeness Review: startups-selling-to-huge-companies

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 108 project files (92 source files), 3 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Prototype-demo**

This is a prototype/demo for application workflow. Generated gap/demo patterns are present: it contains 92 source files and visible routes/pages in `frontend/`, `backend/`, but those surfaces are not evidence of durable domain execution, verified integrations, or operational completion.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Define the primary user and acceptance criteria, then complete one end-to-end workflow against persistent data instead of demo fixtures.
2. Replace mocks, placeholders, and generic AI responses with validated domain services and explicit failure/retry behavior.
3. Implement secure identity, role/tenant boundaries, input validation, secrets handling, and auditable state changes.
4. Add representative automated tests, CI quality gates, environment documentation, migrations, observability, backup, and deployment configuration.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `frontend/src/App.tsx:24`
- `backend/routes/sample_data.js:5`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Stop adding generated pages; prove one application workflow workflow against real services and persistent state, with tests and measurable acceptance criteria.

## Runtime acceptance verification (2026-07-20)

The shared non-suite validator applied the checked-in PostgreSQL migration to a fresh disposable database, provisioned a tenant administrator through the explicit `create-admin` command, and launched `start.sh` on the project's unique loopback triple (`55702` database, `6204` API, `6205` UI). The real tenant-aware `/api/auth/login` route returned HTTP 200 and the bearer session was verified through `/api/auth/me`, recording `API_VERIFIED startup_login_session_api` on the first attempt.

The provisioning adapter is restricted to `NODE_ENV=test`, `ALLOW_DISPOSABLE_SEED=YES`, and a loopback `DATABASE_URL`; the existing production bootstrap acknowledgement remains unchanged. Backend syntax validation covered 48 files, launcher syntax passed, and the TypeScript/Vite production build passed after stale legacy component types and unused imports were corrected. The assigned ports were released after verification.
