const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM companies ORDER BY revenue_billions DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year, notes } = req.body;
    const result = await db.query(
      'INSERT INTO companies (name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year, notes } = req.body;
    const result = await db.query(
      'UPDATE companies SET name=$1, industry=$2, revenue_billions=$3, employee_count=$4, tier=$5, website=$6, hq_city=$7, hq_country=$8, stock_symbol=$9, founded_year=$10, notes=$11 WHERE id=$12 RETURNING *',
      [name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM companies WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
