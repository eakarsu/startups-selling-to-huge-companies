CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'seller',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  revenue_billions DECIMAL,
  employee_count INTEGER,
  tier VARCHAR(20),
  website VARCHAR(2048),
  hq_city VARCHAR(100),
  hq_country VARCHAR(100),
  stock_symbol VARCHAR(20),
  founded_year INTEGER,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  company_id INTEGER,
  title VARCHAR(500) NOT NULL,
  value_usd DECIMAL,
  stage VARCHAR(50) NOT NULL DEFAULT 'prospecting',
  probability INTEGER NOT NULL DEFAULT 10,
  expected_close DATE,
  owner_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  next_action TEXT,
  arr_usd DECIMAL,
  version INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO organizations (slug, name)
SELECT 'legacy-migrated', 'Legacy migrated workspace'
WHERE EXISTS (SELECT 1 FROM users) OR EXISTS (SELECT 1 FROM companies) OR EXISTS (SELECT 1 FROM deals)
ON CONFLICT (slug) DO NOTHING;

UPDATE users
SET tenant_id = (SELECT id FROM organizations WHERE slug = 'legacy-migrated')
WHERE tenant_id IS NULL;
UPDATE companies
SET tenant_id = (SELECT id FROM organizations WHERE slug = 'legacy-migrated')
WHERE tenant_id IS NULL;
UPDATE deals d
SET tenant_id = COALESCE(c.tenant_id, (SELECT id FROM organizations WHERE slug = 'legacy-migrated'))
FROM companies c
WHERE d.company_id = c.id AND d.tenant_id IS NULL;
UPDATE deals
SET tenant_id = (SELECT id FROM organizations WHERE slug = 'legacy-migrated')
WHERE tenant_id IS NULL;

UPDATE users SET role = CASE
  WHEN role = 'admin' THEN 'admin'
  WHEN role IN ('user', 'sales', 'seller') THEN 'seller'
  ELSE 'viewer'
END;
UPDATE deals SET probability = LEAST(100, GREATEST(0, COALESCE(probability, 10)));
UPDATE deals SET stage = 'prospecting'
WHERE stage IS NULL OR stage NOT IN ('prospecting', 'qualification', 'discovery', 'proposal', 'negotiation', 'legal_review', 'closed_won', 'closed_lost');

ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'seller';
ALTER TABLE companies ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE deals ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE deals ALTER COLUMN stage SET NOT NULL;
ALTER TABLE deals ALTER COLUMN probability SET NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_key ON users (tenant_id, LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_identity_key ON users (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS companies_tenant_identity_key ON companies (tenant_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS deals_tenant_identity_key ON deals (tenant_id, id);
CREATE INDEX IF NOT EXISTS companies_tenant_active_idx ON companies (tenant_id, archived_at, updated_at DESC);
CREATE INDEX IF NOT EXISTS deals_tenant_active_idx ON deals (tenant_id, archived_at, updated_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_slug_check') THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'seller', 'viewer'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_version_check') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_version_check CHECK (version >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_stage_check') THEN
    ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN ('prospecting', 'qualification', 'discovery', 'proposal', 'negotiation', 'legal_review', 'closed_won', 'closed_lost'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_probability_check') THEN
    ALTER TABLE deals ADD CONSTRAINT deals_probability_check CHECK (probability BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_version_check') THEN
    ALTER TABLE deals ADD CONSTRAINT deals_version_check CHECK (version >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_tenant_fk') THEN
    ALTER TABLE users ADD CONSTRAINT users_tenant_fk FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_tenant_fk') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_tenant_fk FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_tenant_fk') THEN
    ALTER TABLE deals ADD CONSTRAINT deals_tenant_fk FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_company_tenant_fk') THEN
    ALTER TABLE deals ADD CONSTRAINT deals_company_tenant_fk FOREIGN KEY (tenant_id, company_id) REFERENCES companies(tenant_id, id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deals_owner_tenant_fk') THEN
    ALTER TABLE deals ADD CONSTRAINT deals_owner_tenant_fk FOREIGN KEY (tenant_id, owner_id) REFERENCES users(tenant_id, id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS deal_stage_transitions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  deal_id INTEGER NOT NULL,
  actor_id INTEGER NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  note TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(200) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  resulting_version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT deal_stage_deal_tenant_fk FOREIGN KEY (tenant_id, deal_id) REFERENCES deals(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT deal_stage_actor_tenant_fk FOREIGN KEY (tenant_id, actor_id) REFERENCES users(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT deal_stage_to_check CHECK (to_stage IN ('prospecting', 'qualification', 'discovery', 'proposal', 'negotiation', 'legal_review', 'closed_won', 'closed_lost')),
  CONSTRAINT deal_stage_version_check CHECK (resulting_version >= 0),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS deal_stage_history_idx ON deal_stage_transitions (tenant_id, deal_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  actor_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(80) NOT NULL,
  entity_id INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash VARCHAR(64) NOT NULL,
  hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_actor_tenant_fk FOREIGN KEY (tenant_id, actor_id) REFERENCES users(tenant_id, id) ON DELETE RESTRICT,
  UNIQUE (tenant_id, sequence)
);
CREATE INDEX IF NOT EXISTS audit_events_tenant_created_idx ON audit_events (tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION reject_enterpriseos_evidence_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'EnterpriseOS workflow evidence is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_append_only ON audit_events;
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION reject_enterpriseos_evidence_mutation();

DROP TRIGGER IF EXISTS deal_stage_transitions_append_only ON deal_stage_transitions;
CREATE TRIGGER deal_stage_transitions_append_only BEFORE UPDATE OR DELETE ON deal_stage_transitions
FOR EACH ROW EXECUTE FUNCTION reject_enterpriseos_evidence_mutation();
