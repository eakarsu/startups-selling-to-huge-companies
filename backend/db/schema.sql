CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

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
