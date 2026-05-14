const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sales_team ORDER BY revenue_closed DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sales_team WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, email, role, quota_usd, deals_won, revenue_closed, win_rate, avg_deal_size, active_deals, joined_date } = req.body;
    const result = await db.query(
      'INSERT INTO sales_team (name, email, role, quota_usd, deals_won, revenue_closed, win_rate, avg_deal_size, active_deals, joined_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, email, role, quota_usd, deals_won || 0, revenue_closed || 0, win_rate || 0, avg_deal_size || 0, active_deals || 0, joined_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, role, quota_usd, deals_won, revenue_closed, win_rate, avg_deal_size, active_deals, joined_date } = req.body;
    const result = await db.query(
      'UPDATE sales_team SET name=$1, email=$2, role=$3, quota_usd=$4, deals_won=$5, revenue_closed=$6, win_rate=$7, avg_deal_size=$8, active_deals=$9, joined_date=$10 WHERE id=$11 RETURNING *',
      [name, email, role, quota_usd, deals_won, revenue_closed, win_rate, avg_deal_size, active_deals, joined_date, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM sales_team WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
