CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(email);

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  revenue_billions DECIMAL,
  employee_count INTEGER,
  tier VARCHAR(10),
  website VARCHAR(255),
  hq_city VARCHAR(100),
  hq_country VARCHAR(100),
  stock_symbol VARCHAR(10),
  founded_year INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  company_id INT REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin VARCHAR(255),
  decision_maker BOOLEAN DEFAULT FALSE,
  relationship_strength VARCHAR(20) DEFAULT 'cold',
  last_contacted DATE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  company_id INT REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  value_usd DECIMAL,
  stage VARCHAR(50) DEFAULT 'prospecting',
  probability INTEGER DEFAULT 10,
  expected_close DATE,
  owner_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP,
  next_action TEXT,
  arr_usd DECIMAL
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  deal_id INT REFERENCES deals(id) ON DELETE CASCADE,
  contact_id INT REFERENCES contacts(id),
  activity_type VARCHAR(30),
  subject VARCHAR(500),
  notes TEXT,
  outcome VARCHAR(100),
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_mins INTEGER,
  created_by INT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sales_team (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(100),
  quota_usd DECIMAL,
  deals_won INTEGER DEFAULT 0,
  revenue_closed DECIMAL DEFAULT 0,
  win_rate DECIMAL DEFAULT 0,
  avg_deal_size DECIMAL DEFAULT 0,
  active_deals INTEGER DEFAULT 0,
  joined_date DATE
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  deal_id INT REFERENCES deals(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id),
  content TEXT NOT NULL,
  note_type VARCHAR(30) DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- ============================================================================
-- Deep feature: MSA Redlines Library
-- Catalog of standard MSA clause variants and per-F100 redlines / negotiation history.
-- ============================================================================
CREATE TABLE IF NOT EXISTS msa_clauses (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(80) NOT NULL,
  clause_name VARCHAR(200) NOT NULL,
  default_text TEXT,
  startup_position VARCHAR(20) DEFAULT 'standard',
  risk_level VARCHAR(20) DEFAULT 'medium',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS msa_redlines (
  id SERIAL PRIMARY KEY,
  clause_id INT REFERENCES msa_clauses(id) ON DELETE CASCADE,
  company_id INT REFERENCES companies(id) ON DELETE CASCADE,
  buyer_position TEXT,
  startup_counter TEXT,
  outcome VARCHAR(30) DEFAULT 'open',
  negotiated_value VARCHAR(255),
  cycle_days INT,
  closed_at DATE,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_msa_redlines_company ON msa_redlines(company_id);
CREATE INDEX IF NOT EXISTS idx_msa_redlines_clause ON msa_redlines(clause_id);

-- ============================================================================
-- Deep feature: Security Questionnaire Bank
-- Real SIG / CAIQ / VSAQ questions with cached responses and review status.
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_questions (
  id SERIAL PRIMARY KEY,
  framework VARCHAR(20) NOT NULL,
  question_code VARCHAR(40),
  domain VARCHAR(80),
  question_text TEXT NOT NULL,
  expected_artifact VARCHAR(200)
);
CREATE INDEX IF NOT EXISTS idx_security_questions_framework ON security_questions(framework);
CREATE INDEX IF NOT EXISTS idx_security_questions_domain ON security_questions(domain);

CREATE TABLE IF NOT EXISTS security_responses (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES security_questions(id) ON DELETE CASCADE,
  company_id INT REFERENCES companies(id) ON DELETE SET NULL,
  response TEXT,
  evidence_link VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft',
  confidence INT,
  reviewer VARCHAR(120),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_security_responses_question ON security_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_security_responses_company ON security_responses(company_id);

-- ============================================================================
-- Deep feature: Org Chart / Champion Map
-- contact-to-contact relationships + role tagging for multi-thread coverage.
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_relationships (
  id SERIAL PRIMARY KEY,
  contact_id INT REFERENCES contacts(id) ON DELETE CASCADE,
  reports_to_id INT REFERENCES contacts(id) ON DELETE SET NULL,
  function_area VARCHAR(60),
  is_line BOOLEAN DEFAULT TRUE,
  signing_authority_usd DECIMAL,
  buyer_role VARCHAR(40)
);
CREATE INDEX IF NOT EXISTS idx_org_rel_contact ON org_relationships(contact_id);
CREATE INDEX IF NOT EXISTS idx_org_rel_reports_to ON org_relationships(reports_to_id);

-- ============================================================================
-- Deep feature: F100 Procurement Playbook
-- Buyer-specific procurement stage definitions and signing thresholds.
-- ============================================================================
CREATE TABLE IF NOT EXISTS procurement_playbooks (
  id SERIAL PRIMARY KEY,
  company_id INT REFERENCES companies(id) ON DELETE CASCADE,
  stage_order INT NOT NULL,
  stage_name VARCHAR(60),
  owner_role VARCHAR(80),
  typical_duration_days INT,
  required_artifacts TEXT,
  signing_threshold_usd DECIMAL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_proc_playbook_company ON procurement_playbooks(company_id);

CREATE TABLE IF NOT EXISTS deal_stage_progress (
  id SERIAL PRIMARY KEY,
  deal_id INT REFERENCES deals(id) ON DELETE CASCADE,
  playbook_id INT REFERENCES procurement_playbooks(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'not_started',
  entered_at TIMESTAMP,
  completed_at TIMESTAMP,
  blocker TEXT
);
CREATE INDEX IF NOT EXISTS idx_deal_stage_progress_deal ON deal_stage_progress(deal_id);

-- ============================================================================
-- Deep feature: Pilot Success Scorecards
-- Pilot definitions + per-pilot metric tracking for MSA conversion.
-- ============================================================================
CREATE TABLE IF NOT EXISTS pilots (
  id SERIAL PRIMARY KEY,
  deal_id INT REFERENCES deals(id) ON DELETE CASCADE,
  company_id INT REFERENCES companies(id) ON DELETE CASCADE,
  pilot_name VARCHAR(255),
  start_date DATE,
  end_date DATE,
  budget_usd DECIMAL,
  exec_sponsor VARCHAR(120),
  status VARCHAR(20) DEFAULT 'active',
  conversion_target_arr_usd DECIMAL,
  success_criteria TEXT
);
CREATE INDEX IF NOT EXISTS idx_pilots_deal ON pilots(deal_id);
CREATE INDEX IF NOT EXISTS idx_pilots_company ON pilots(company_id);

CREATE TABLE IF NOT EXISTS pilot_metrics (
  id SERIAL PRIMARY KEY,
  pilot_id INT REFERENCES pilots(id) ON DELETE CASCADE,
  metric_name VARCHAR(120),
  target_value DECIMAL,
  current_value DECIMAL,
  unit VARCHAR(40),
  threshold_pct DECIMAL DEFAULT 100,
  recorded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pilot_metrics_pilot ON pilot_metrics(pilot_id);

-- ============================================================================
-- Deep feature: Compliance Posture Tracker
-- Startup compliance certifications + per-deal compliance requirements.
-- ============================================================================
CREATE TABLE IF NOT EXISTS compliance_certifications (
  id SERIAL PRIMARY KEY,
  framework VARCHAR(40) NOT NULL,
  status VARCHAR(20) DEFAULT 'planned',
  auditor VARCHAR(120),
  issued_date DATE,
  expires_date DATE,
  scope TEXT,
  evidence_link VARCHAR(500),
  cost_usd DECIMAL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_compliance_certs_framework ON compliance_certifications(framework);

CREATE TABLE IF NOT EXISTS deal_compliance_requirements (
  id SERIAL PRIMARY KEY,
  deal_id INT REFERENCES deals(id) ON DELETE CASCADE,
  framework VARCHAR(40) NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  is_blocker BOOLEAN DEFAULT FALSE,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_deal_comp_req_deal ON deal_compliance_requirements(deal_id);
