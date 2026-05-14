const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

class AIUnavailableError extends Error {
  constructor(msg) { super(msg); this.code = 'AI_UNAVAILABLE'; }
}

async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AIUnavailableError('OPENROUTER_API_KEY not configured');
  }
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'EnterpriseOS'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ]
    })
  });
  if (!r.ok) {
    throw new AIUnavailableError(`AI provider error: ${r.status}`);
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

function aiHandle(res, err) {
  if (err && err.code === 'AI_UNAVAILABLE') {
    return res.status(503).json({ error: 'AI service unavailable', detail: err.message });
  }
  return res.status(500).json({ error: err.message });
}

async function logAudit(req, action, entity, entity_id, details) {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, details, ip) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user?.id || null, req.user?.email || null, action, entity, entity_id, details, req.ip || null]
    );
  } catch (e) { /* don't break primary action on audit failure */ }
}

router.post('/deal-scoring', auth, async (req, res) => {
  try {
    const { deal, company, activities } = req.body;
    const prompt = `Analyze this enterprise deal and provide a comprehensive health score and win probability analysis:\n\nDeal: ${JSON.stringify(deal)}\nCompany: ${JSON.stringify(company)}\nRecent Activities: ${JSON.stringify(activities)}\n\nProvide:\n1. Overall deal health score (0-100) with breakdown\n2. Win probability estimate with reasoning\n3. Key risk factors\n4. Deal strengths\n5. Critical next steps`;
    const result = await callAI(prompt, 'You are an enterprise sales AI expert specializing in Fortune 500 deals. Provide data-driven deal scoring and win probability analysis.');
    await logAudit(req, 'ai_call', 'ai', null, 'deal-scoring');
    res.json({ result });
  } catch (err) { aiHandle(res, err); }
});

router.post('/next-action', auth, async (req, res) => {
  try {
    const { deal, recent_activities } = req.body;
    const prompt = `Based on this enterprise deal and recent activities, recommend the next best actions to advance the deal:\n\nDeal Stage: ${deal?.stage || 'unknown'}\nDeal Value: $${deal?.value_usd?.toLocaleString() || 0}\nProbability: ${deal?.probability || 0}%\nNext Action: ${deal?.next_action || 'none set'}\n\nRecent Activities:\n${JSON.stringify(recent_activities)}\n\nProvide 3-5 specific, actionable next steps with rationale, timing recommendations, and expected outcomes.`;
    const result = await callAI(prompt, 'You are an enterprise sales coach specializing in complex B2B sales cycles with Fortune 500 companies. Provide tactical, specific guidance.');
    await logAudit(req, 'ai_call', 'ai', null, 'next-action');
    res.json({ result });
  } catch (err) { aiHandle(res, err); }
});

router.post('/email-draft', auth, async (req, res) => {
  try {
    const { deal, contact, purpose } = req.body;
    const prompt = `Draft a highly personalized, professional email for this enterprise sales scenario:\n\nContact: ${contact?.name}, ${contact?.title} at company\nRelationship: ${contact?.relationship_strength || 'warm'}\nDecision Maker: ${contact?.decision_maker ? 'Yes' : 'No'}\nDeal: ${deal?.title}\nDeal Stage: ${deal?.stage}\nPurpose: ${purpose}\n\nWrite a concise, compelling email that:\n- Is personalized to their role and relationship\n- Has a clear value proposition\n- Includes a specific call to action\n- Is appropriate for Fortune 500 enterprise sales`;
    const result = await callAI(prompt, 'You are an expert enterprise sales copywriter. Write persuasive, professional emails for Fortune 500 account executives.');
    await logAudit(req, 'ai_call', 'ai', null, 'email-draft');
    res.json({ result });
  } catch (err) { aiHandle(res, err); }
});

router.post('/company-research', auth, async (req, res) => {
  try {
    const { company_name, industry } = req.body;
    let companyData = {};
    if (company_name) {
      const result = await db.query('SELECT * FROM companies WHERE name ILIKE $1', [`%${company_name}%`]);
      companyData = result.rows[0] || {};
    }
    const prompt = `Generate a comprehensive company intelligence report for enterprise sales:\n\nCompany: ${company_name}\nIndustry: ${industry || companyData.industry || 'unknown'}\nRevenue: $${companyData.revenue_billions || 'unknown'}B\nEmployees: ${companyData.employee_count?.toLocaleString() || 'unknown'}\nTier: ${companyData.tier || 'Fortune 500'}\nHQ: ${companyData.hq_city || ''}, ${companyData.hq_country || ''}\n\nProvide:\n1. Business priorities and strategic initiatives\n2. Key buying triggers and pain points\n3. Budget cycle and procurement process\n4. Key stakeholders and decision-making structure\n5. Competitive landscape and existing vendor relationships\n6. Approach recommendations for our sales team`;
    const result = await callAI(prompt, 'You are a Fortune 500 enterprise sales research analyst. Provide deep, actionable intelligence for enterprise sales teams.');
    await logAudit(req, 'ai_call', 'ai', null, 'company-research');
    res.json({ result });
  } catch (err) { aiHandle(res, err); }
});

// === NEW AI FEATURES ===

// 1) Deal close-likelihood predictor (probabilistic forecast vs. existing scoring)
router.post('/close-likelihood', auth, async (req, res) => {
  try {
    const { deal, company, recent_activities } = req.body;
    const prompt = `You are forecasting the close probability of an enterprise B2B deal. Use signals like stage, value, days since last activity, decision-maker engagement, and macro fit.\n\nDeal: ${JSON.stringify(deal)}\nCompany: ${JSON.stringify(company)}\nRecent activities: ${JSON.stringify(recent_activities || [])}\n\nReturn:\n1. Close-likelihood percentage (0-100) with a single confidence number.\n2. Top 3 positive signals and top 3 negative signals.\n3. Forecasted close date (best/likely/worst).\n4. Two specific actions that would shift likelihood by >=10%.`;
    const result = await callAI(prompt, 'You are a quantitative enterprise sales forecasting assistant. Be specific, calibrated, and brief.');
    await logAudit(req, 'ai_call', 'ai', deal?.id || null, 'close-likelihood');
    res.json({ result });
  } catch (err) { aiHandle(res, err); }
});

// 2) ICP fit scorer
router.post('/icp-fit', auth, async (req, res) => {
  try {
    const { company, icp_description } = req.body;
    let companyData = company || {};
    if (company?.id) {
      const r = await db.query('SELECT * FROM companies WHERE id = $1', [company.id]);
      if (r.rows[0]) companyData = r.rows[0];
    } else if (company?.name) {
      const r = await db.query('SELECT * FROM companies WHERE name ILIKE $1 LIMIT 1', [`%${company.name}%`]);
      if (r.rows[0]) companyData = r.rows[0];
    }
    const prompt = `Score how well this account matches our Ideal Customer Profile (ICP).\n\nICP: ${icp_description || 'Fortune 500 buyers, multi-region, $5B+ revenue, with active digital transformation initiatives, complex procurement, and high willingness for multi-year contracts.'}\n\nCompany: ${JSON.stringify(companyData)}\n\nReturn:\n1. ICP fit score 0-100 with bands (>80 strong, 60-80 fit, <60 stretch).\n2. Bullet match on each ICP dimension (size, industry, geography, buying behavior).\n3. Top 2 disqualifiers if any.\n4. Recommended motion: enterprise pursuit, light-touch, or disqualify.`;
    const result = await callAI(prompt, 'You are a precise enterprise GTM analyst. Score ICP fit with calibrated reasoning.');
    await logAudit(req, 'ai_call', 'ai', companyData.id || null, 'icp-fit');
    res.json({ result });
  } catch (err) { aiHandle(res, err); }
});

// 3) Discovery-call summarizer
router.post('/discovery-summary', auth, async (req, res) => {
  try {
    const { transcript, deal_title } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'transcript is required' });
    }
    const prompt = `Summarize this enterprise discovery call transcript into a structured field-sales briefing.\n\nDeal: ${deal_title || 'unknown'}\nTranscript:\n"""\n${transcript}\n"""\n\nReturn sections:\n1. Executive summary (3 sentences).\n2. Pain points and quoted phrases.\n3. Stakeholders mentioned (name, role, sentiment).\n4. Budget, timeline, decision-process indicators (BANT/MEDDIC).\n5. Objections raised.\n6. Concrete next steps with owners.`;
    const result = await callAI(prompt, 'You are an enterprise sales AE assistant. Produce dense, accurate call summaries with no fluff.');
    await logAudit(req, 'ai_call', 'ai', null, 'discovery-summary');
    res.json({ result });
  } catch (err) { aiHandle(res, err); }
});

// 4) Stalled-deal detector — pulls real deals, finds stalls, asks AI to triage
router.post('/stalled-deals', auth, async (req, res) => {
  try {
    const days = Math.max(parseInt(req.body?.threshold_days, 10) || 21, 1);
    const result = await db.query(
      `SELECT d.*, c.name AS company_name,
              (SELECT MAX(COALESCE(completed_at, scheduled_at)) FROM activities WHERE deal_id = d.id) AS last_touch
       FROM deals d
       JOIN companies c ON d.company_id = c.id
       WHERE d.stage NOT IN ('closed_won','closed_lost')
       ORDER BY d.value_usd DESC NULLS LAST`
    );
    const now = Date.now();
    const stalled = result.rows
      .map(d => {
        const lt = d.last_touch ? new Date(d.last_touch).getTime() : (d.last_activity_at ? new Date(d.last_activity_at).getTime() : (d.created_at ? new Date(d.created_at).getTime() : null));
        const daysSince = lt ? Math.floor((now - lt) / 86400000) : null;
        return { ...d, days_since_touch: daysSince };
      })
      .filter(d => d.days_since_touch === null || d.days_since_touch >= days);
    const compact = stalled.slice(0, 25).map(d => ({
      id: d.id, title: d.title, company: d.company_name, stage: d.stage,
      value_usd: Number(d.value_usd) || 0, probability: d.probability,
      days_since_touch: d.days_since_touch, next_action: d.next_action
    }));
    let aiTriage = null;
    try {
      const prompt = `These enterprise deals have not seen activity in >= ${days} days.\n\n${JSON.stringify(compact, null, 2)}\n\nFor each top-priority deal (rank by value * stage_advancement), suggest the single highest-leverage unblocking action and root-cause hypothesis. Return a ranked bullet list with deal id, root cause, action.`;
      aiTriage = await callAI(prompt, 'You are an enterprise pipeline triage analyst. Be direct and operational.');
    } catch (e) {
      aiTriage = e.code === 'AI_UNAVAILABLE' ? 'AI triage unavailable (no API key configured)' : 'AI triage failed';
    }
    await logAudit(req, 'ai_call', 'ai', null, `stalled-deals threshold=${days} found=${stalled.length}`);
    res.json({ threshold_days: days, count: stalled.length, deals: stalled, triage: aiTriage });
  } catch (err) { aiHandle(res, err); }
});

// 5) Win-loss insight generator — analyzes closed_won/closed_lost deals
router.post('/winloss-insights', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.title, d.stage, d.value_usd, d.probability, d.expected_close, d.next_action,
              c.name AS company_name, c.industry, c.tier
       FROM deals d JOIN companies c ON d.company_id = c.id
       WHERE d.stage IN ('closed_won','closed_lost')
       ORDER BY d.last_activity_at DESC NULLS LAST LIMIT 60`
    );
    const won = result.rows.filter(r => r.stage === 'closed_won');
    const lost = result.rows.filter(r => r.stage === 'closed_lost');
    const summary = {
      won_count: won.length, lost_count: lost.length,
      win_rate: result.rows.length ? Math.round((won.length / result.rows.length) * 100) : 0,
      avg_won_value: won.length ? Math.round(won.reduce((s, d) => s + Number(d.value_usd || 0), 0) / won.length) : 0,
      avg_lost_value: lost.length ? Math.round(lost.reduce((s, d) => s + Number(d.value_usd || 0), 0) / lost.length) : 0
    };
    const prompt = `Analyze enterprise win/loss patterns and produce actionable insights.\n\nSummary: ${JSON.stringify(summary)}\nWon (sample): ${JSON.stringify(won.slice(0, 15))}\nLost (sample): ${JSON.stringify(lost.slice(0, 15))}\n\nDeliver:\n1. Three repeatable win patterns (industry, deal-size, motion).\n2. Three loss patterns / common failure modes.\n3. Two playbook changes to lift win-rate by 5+ points.\n4. Risky cohorts to deprioritize.`;
    const result2 = await callAI(prompt, 'You are a B2B revenue-operations analyst delivering crisp win/loss insights for enterprise sales leadership.');
    await logAudit(req, 'ai_call', 'ai', null, 'winloss-insights');
    res.json({ result: result2, summary });
  } catch (err) { aiHandle(res, err); }
});

module.exports = router;
