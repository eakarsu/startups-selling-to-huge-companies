const router = require('express').Router();
const authenticate = require('../middleware/auth');
const db = require('../db');

router.post('/enterprise-readiness', authenticate, async (req, res) => {
  try {
    const base = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
    if (base !== 'https://openrouter.ai/api/v1') return res.status(503).json({ error: 'OpenRouter base URL is not canonical' });
    const prompt = String(req.body?.prompt || 'Assess the highest-priority enterprise sales readiness action for this account.');
    const provider = await fetch(`${base}/chat/completions`, {
      method: 'POST', headers: { authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'content-type': 'application/json', 'x-title': 'EnterpriseOS Runtime' },
      body: JSON.stringify({ model: process.env.OPENROUTER_MODEL, max_tokens: 220, messages: [
        { role: 'system', content: 'You are an enterprise sales operations reviewer. Give one concise finding and one next action.' },
        { role: 'user', content: prompt }
      ] })
    });
    const data = await provider.json();
    if (!provider.ok || data.error) return res.status(502).json({ error: data.error?.message || `Provider status ${provider.status}` });
    const content = data.choices?.[0]?.message?.content;
    if (!data.id || !content) return res.status(502).json({ error: 'Provider response lacked content or receipt' });
    const providerReceipt = { id: data.id, model: data.model || process.env.OPENROUTER_MODEL, usage: data.usage || null };
    const saved = await db.query(
      `INSERT INTO runtime_ai_results (tenant_id,user_id,feature,prompt,response,provider_id,model)
       VALUES ($1,$2,'enterprise-readiness',$3::jsonb,$4::jsonb,$5,$6) RETURNING id`,
      [req.user.tenantId, req.user.id, JSON.stringify({ prompt }), JSON.stringify({ content, providerReceipt }), data.id, providerReceipt.model]
    );
    return res.json({ content, model: providerReceipt.model, providerReceipt, recordId: saved.rows[0].id });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});
module.exports = router;
