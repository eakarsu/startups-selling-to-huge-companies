const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT c.*, co.name as company_name FROM contacts c JOIN companies co ON c.company_id = co.id ORDER BY c.name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT c.*, co.name as company_name FROM contacts c JOIN companies co ON c.company_id = co.id WHERE c.id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { company_id, name, title, email, phone, linkedin, decision_maker, relationship_strength, last_contacted, notes } = req.body;
    const result = await db.query(
      'INSERT INTO contacts (company_id, name, title, email, phone, linkedin, decision_maker, relationship_strength, last_contacted, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [company_id, name, title, email, phone, linkedin, decision_maker || false, relationship_strength || 'cold', last_contacted, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { company_id, name, title, email, phone, linkedin, decision_maker, relationship_strength, last_contacted, notes } = req.body;
    const result = await db.query(
      'UPDATE contacts SET company_id=$1, name=$2, title=$3, email=$4, phone=$5, linkedin=$6, decision_maker=$7, relationship_strength=$8, last_contacted=$9, notes=$10 WHERE id=$11 RETURNING *',
      [company_id, name, title, email, phone, linkedin, decision_maker, relationship_strength, last_contacted, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
