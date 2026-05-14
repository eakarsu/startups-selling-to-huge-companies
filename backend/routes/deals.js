const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT d.*, c.name as company_name FROM deals d JOIN companies c ON d.company_id = c.id ORDER BY d.value_usd DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT d.*, c.name as company_name FROM deals d JOIN companies c ON d.company_id = c.id WHERE d.id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { company_id, title, value_usd, stage, probability, expected_close, next_action, arr_usd } = req.body;
    const result = await db.query(
      'INSERT INTO deals (company_id, title, value_usd, stage, probability, expected_close, owner_id, next_action, arr_usd) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [company_id, title, value_usd, stage || 'prospecting', probability || 10, expected_close, req.user.id, next_action, arr_usd]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { company_id, title, value_usd, stage, probability, expected_close, next_action, arr_usd } = req.body;
    const result = await db.query(
      'UPDATE deals SET company_id=$1, title=$2, value_usd=$3, stage=$4, probability=$5, expected_close=$6, next_action=$7, arr_usd=$8, last_activity_at=NOW() WHERE id=$9 RETURNING *',
      [company_id, title, value_usd, stage, probability, expected_close, next_action, arr_usd, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM deals WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
