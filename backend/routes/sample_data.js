const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

// Domain-realistic Fortune 500 sample data factories.
// Each entity factory returns 5-10 rows. Inserts are best-effort:
// e.g. contacts/deals/activities/notes link to existing parent rows
// fetched at insert time so we don't violate FKs.

const F500_COMPANIES = [
  { name: 'JPMorgan Chase', industry: 'Financial Services', revenue_billions: 158.10, employee_count: 309000, tier: 'F10',  website: 'jpmorganchase.com',  hq_city: 'New York',     hq_country: 'USA', stock_symbol: 'JPM',  founded_year: 2000, notes: 'Largest US bank by assets.' },
  { name: 'Walmart',         industry: 'Retail',             revenue_billions: 648.10, employee_count: 2100000,tier: 'F10',  website: 'walmart.com',         hq_city: 'Bentonville',  hq_country: 'USA', stock_symbol: 'WMT',  founded_year: 1962, notes: 'Largest retailer worldwide.' },
  { name: 'Boeing',          industry: 'Aerospace & Defense',revenue_billions: 77.79,  employee_count: 170000, tier: 'F50',  website: 'boeing.com',          hq_city: 'Arlington',    hq_country: 'USA', stock_symbol: 'BA',   founded_year: 1916, notes: 'Major aircraft manufacturer.' },
  { name: 'ExxonMobil',      industry: 'Energy',             revenue_billions: 344.58, employee_count: 62000,  tier: 'F10',  website: 'exxonmobil.com',      hq_city: 'Spring',       hq_country: 'USA', stock_symbol: 'XOM',  founded_year: 1999, notes: 'Integrated oil & gas.' },
  { name: 'UnitedHealth Group', industry: 'Healthcare',      revenue_billions: 371.62, employee_count: 400000, tier: 'F10',  website: 'unitedhealthgroup.com', hq_city: 'Minnetonka', hq_country: 'USA', stock_symbol: 'UNH',  founded_year: 1977, notes: 'Largest US health insurer.' },
  { name: 'Procter & Gamble', industry: 'Consumer Goods',    revenue_billions: 82.01,  employee_count: 107000, tier: 'F50',  website: 'pg.com',              hq_city: 'Cincinnati',   hq_country: 'USA', stock_symbol: 'PG',   founded_year: 1837, notes: 'CPG portfolio leader.' },
  { name: 'Lockheed Martin', industry: 'Aerospace & Defense',revenue_billions: 67.57,  employee_count: 122000, tier: 'F100', website: 'lockheedmartin.com',  hq_city: 'Bethesda',     hq_country: 'USA', stock_symbol: 'LMT',  founded_year: 1995, notes: 'Top US defense contractor.' },
  { name: 'Pfizer',          industry: 'Pharmaceuticals',    revenue_billions: 58.49,  employee_count: 88000,  tier: 'F100', website: 'pfizer.com',          hq_city: 'New York',     hq_country: 'USA', stock_symbol: 'PFE',  founded_year: 1849, notes: 'Global pharma R&D.' }
];

const CONTACT_FIRST = ['Sarah','Michael','Priya','Daniel','Aisha','Ethan','Olivia','Carlos','Mei','James'];
const CONTACT_LAST  = ['Thompson','Rodriguez','Patel','Nguyen','Johnson','Schmidt','Kim','Brown','Garcia','Anderson'];
const TITLES = [
  'VP Engineering','Director of Procurement','Chief Information Officer','SVP Digital Transformation',
  'Head of IT Infrastructure','VP Cloud Platforms','Director of Enterprise Architecture',
  'Chief Technology Officer','Senior Director Strategic Sourcing','VP Data & Analytics'
];
const RELATIONSHIPS = ['cold','warm','hot','champion'];

const DEAL_STAGES = ['prospecting','discovery','proposal','negotiation','closed_won','closed_lost'];
const DEAL_TITLES = [
  'Enterprise SaaS Platform — Pilot to Production',
  'Multi-Region Cloud Migration',
  'Data Lakehouse & ML Platform',
  'Procurement Automation Rollout',
  'Cybersecurity Posture Upgrade',
  'Customer 360 Initiative',
  'AI Copilot for Operations',
  'Global ERP Modernization',
  'Field Service IoT Platform',
  'Supply Chain Visibility Suite'
];
const NEXT_ACTIONS = [
  'Send security questionnaire response',
  'Schedule technical deep dive with platform team',
  'Confirm pricing with procurement',
  'Share reference customer in same vertical',
  'Submit RFP final response',
  'Align on success criteria for pilot',
  'Walk through MSA redlines with legal'
];

const ACTIVITY_TYPES = ['call','email','meeting','demo','followup'];
const ACTIVITY_SUBJECTS = [
  'Discovery call with CTO',
  'Solution demo for platform team',
  'Procurement pricing review',
  'Executive briefing with CIO',
  'Security & compliance walkthrough',
  'Kickoff meeting for pilot scope',
  'Quarterly business review',
  'Reference call with peer customer',
  'Technical deep dive on integration',
  'Follow-up on RFP response'
];
const OUTCOMES = ['positive','neutral','needs_followup','no_show','closed'];

const TEAM_FIRST = ['Alex','Jordan','Morgan','Taylor','Casey','Riley','Quinn','Sydney','Avery','Drew'];
const TEAM_LAST  = ['Walker','Hayes','Carter','Brooks','Reeves','Bennett','Foster','Hughes','Sullivan','Marshall'];
const TEAM_ROLES = ['Account Executive','Enterprise AE','Strategic Account Director','SDR','Solutions Engineer','Sales Manager','RVP Sales'];

const NOTE_TYPES = ['general','meeting','call','strategy','competitive'];
const NOTE_CONTENTS = [
  'CIO confirmed budget approved for FY pilot. Procurement will run a 3-vendor bake-off.',
  'Champion sees clear ROI in first 90 days. Concerned about change management at scale.',
  'Competitor is incumbent on legacy stack — switching cost is the main objection.',
  'Security review passed; pen-test artifacts shared. Legal wants MSA redlines next.',
  'Discovery surfaced strong pain on manual reconciliation; quantified at $4M/yr.',
  'Decision committee includes CIO, CFO, and Head of Ops. CFO is gatekeeper on TCO.',
  'Pilot scope locked: 3 BUs, 200 seats, 90 days, success = 25% cycle-time reduction.',
  'Negotiation: pushing for multi-year with annual ramp; expansion clause to be added.'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}
function pastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
function futureTimestamp(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

async function insertCompanies(count) {
  const rows = shuffle(F500_COMPANIES).slice(0, count);
  let inserted = 0;
  for (const c of rows) {
    // Avoid dup-name explosion: append a short suffix so re-running adds new rows.
    const suffix = ` (Sample ${Date.now().toString().slice(-5)}-${rand(10, 99)})`;
    await db.query(
      `INSERT INTO companies (name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [c.name + suffix, c.industry, c.revenue_billions, c.employee_count, c.tier, c.website, c.hq_city, c.hq_country, c.stock_symbol, c.founded_year, c.notes]
    );
    inserted++;
  }
  return inserted;
}

async function getCompanyIds(limit) {
  const r = await db.query('SELECT id FROM companies ORDER BY id DESC LIMIT $1', [limit]);
  return r.rows.map(x => x.id);
}
async function getDealIds(limit) {
  const r = await db.query('SELECT id FROM deals ORDER BY id DESC LIMIT $1', [limit]);
  return r.rows.map(x => x.id);
}
async function getContactIds(limit) {
  const r = await db.query('SELECT id FROM contacts ORDER BY id DESC LIMIT $1', [limit]);
  return r.rows.map(x => x.id);
}

async function insertContacts(count, userId) {
  const companyIds = await getCompanyIds(50);
  if (!companyIds.length) {
    // Bootstrap with one company so contacts have a parent.
    const c = pick(F500_COMPANIES);
    const r = await db.query(
      `INSERT INTO companies (name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [c.name + ' (Sample)', c.industry, c.revenue_billions, c.employee_count, c.tier, c.website, c.hq_city, c.hq_country, c.stock_symbol, c.founded_year, c.notes]
    );
    companyIds.push(r.rows[0].id);
  }
  let inserted = 0;
  for (let i = 0; i < count; i++) {
    const first = pick(CONTACT_FIRST);
    const last = pick(CONTACT_LAST);
    const title = pick(TITLES);
    const companyId = pick(companyIds);
    const handle = `${first}.${last}.${Date.now().toString().slice(-4)}${i}`.toLowerCase();
    await db.query(
      `INSERT INTO contacts (company_id, name, title, email, phone, linkedin, decision_maker, relationship_strength, last_contacted, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        companyId,
        `${first} ${last}`,
        title,
        `${handle}@example.com`,
        `+1-${rand(200, 999)}-${rand(200, 999)}-${rand(1000, 9999)}`,
        `linkedin.com/in/${handle}`,
        /VP|Chief|SVP|Director/.test(title),
        pick(RELATIONSHIPS),
        pastDate(rand(1, 60)),
        `Met at ${pick(['Gartner Symposium','AWS re:Invent','Dreamforce','industry roundtable'])}.`
      ]
    );
    inserted++;
  }
  return inserted;
}

async function insertDeals(count, userId) {
  const companyIds = await getCompanyIds(50);
  if (!companyIds.length) {
    await insertCompanies(3);
    companyIds.push(...(await getCompanyIds(3)));
  }
  let inserted = 0;
  for (let i = 0; i < count; i++) {
    const stage = pick(DEAL_STAGES);
    const probability = stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0
                      : stage === 'negotiation' ? rand(60, 85)
                      : stage === 'proposal' ? rand(40, 65)
                      : stage === 'discovery' ? rand(20, 45)
                      : rand(5, 20);
    const value = rand(50, 2500) * 1000; // $50K – $2.5M
    const arr = Math.round(value * (rand(60, 100) / 100));
    await db.query(
      `INSERT INTO deals (company_id, title, value_usd, stage, probability, expected_close, owner_id, last_activity_at, next_action, arr_usd)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        pick(companyIds),
        pick(DEAL_TITLES),
        value,
        stage,
        probability,
        futureDate(rand(15, 180)),
        userId || null,
        new Date(Date.now() - rand(0, 14) * 86400000),
        pick(NEXT_ACTIONS),
        arr
      ]
    );
    inserted++;
  }
  return inserted;
}

async function insertActivities(count, userId) {
  let dealIds = await getDealIds(50);
  if (!dealIds.length) {
    await insertDeals(3, userId);
    dealIds = await getDealIds(3);
  }
  const contactIds = await getContactIds(50);
  let inserted = 0;
  for (let i = 0; i < count; i++) {
    const completed = Math.random() < 0.6;
    await db.query(
      `INSERT INTO activities (deal_id, contact_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, duration_mins, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        pick(dealIds),
        contactIds.length ? pick(contactIds) : null,
        pick(ACTIVITY_TYPES),
        pick(ACTIVITY_SUBJECTS),
        'Auto-generated sample activity for demo seeding.',
        completed ? pick(OUTCOMES) : null,
        completed ? new Date(Date.now() - rand(1, 21) * 86400000) : futureTimestamp(rand(1, 14)),
        completed ? new Date(Date.now() - rand(0, 21) * 86400000) : null,
        pick([15, 30, 45, 60]),
        userId || null
      ]
    );
    inserted++;
  }
  return inserted;
}

async function insertTeam(count) {
  let inserted = 0;
  for (let i = 0; i < count; i++) {
    const first = pick(TEAM_FIRST);
    const last = pick(TEAM_LAST);
    const handle = `${first}.${last}.${Date.now().toString().slice(-4)}${i}`.toLowerCase();
    const dealsWon = rand(2, 30);
    const avgDeal = rand(80, 600) * 1000;
    await db.query(
      `INSERT INTO sales_team (name, email, role, quota_usd, deals_won, revenue_closed, win_rate, avg_deal_size, active_deals, joined_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        `${first} ${last}`,
        `${handle}@example.com`,
        pick(TEAM_ROLES),
        rand(800, 3000) * 1000,
        dealsWon,
        dealsWon * avgDeal,
        (rand(20, 70) / 100).toFixed(2),
        avgDeal,
        rand(3, 18),
        pastDate(rand(60, 1500))
      ]
    );
    inserted++;
  }
  return inserted;
}

async function insertNotes(count, userId) {
  let dealIds = await getDealIds(50);
  if (!dealIds.length) {
    await insertDeals(3, userId);
    dealIds = await getDealIds(3);
  }
  let inserted = 0;
  for (let i = 0; i < count; i++) {
    await db.query(
      `INSERT INTO notes (deal_id, user_id, content, note_type, is_pinned)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        pick(dealIds),
        userId || null,
        pick(NOTE_CONTENTS),
        pick(NOTE_TYPES),
        Math.random() < 0.2
      ]
    );
    inserted++;
  }
  return inserted;
}

const HANDLERS = {
  companies:  ({ count })            => insertCompanies(count),
  contacts:   ({ count, userId })    => insertContacts(count, userId),
  deals:      ({ count, userId })    => insertDeals(count, userId),
  activities: ({ count, userId })    => insertActivities(count, userId),
  team:       ({ count })            => insertTeam(count),
  notes:      ({ count, userId })    => insertNotes(count, userId)
};

router.post('/sample-data/:entity', auth, async (req, res) => {
  const { entity } = req.params;
  const handler = HANDLERS[entity];
  if (!handler) {
    return res.status(400).json({
      error: `Unknown entity '${entity}'`,
      supported: Object.keys(HANDLERS)
    });
  }
  const count = rand(5, 10);
  try {
    const inserted = await handler({ count, userId: req.user && req.user.id });
    return res.json({ inserted, entity });
  } catch (err) {
    return res.status(500).json({ error: err.message, entity });
  }
});

module.exports = router;
