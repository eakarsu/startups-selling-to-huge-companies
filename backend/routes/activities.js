const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, d.title as deal_title, c.name as contact_name FROM activities a LEFT JOIN deals d ON a.deal_id = d.id LEFT JOIN contacts c ON a.contact_id = c.id ORDER BY a.scheduled_at DESC NULLS LAST');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, d.title as deal_title, c.name as contact_name FROM activities a LEFT JOIN deals d ON a.deal_id = d.id LEFT JOIN contacts c ON a.contact_id = c.id WHERE a.id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { deal_id, contact_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, duration_mins } = req.body;
    const result = await db.query(
      'INSERT INTO activities (deal_id, contact_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, duration_mins, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [deal_id, contact_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, duration_mins, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { deal_id, contact_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, duration_mins } = req.body;
    const result = await db.query(
      'UPDATE activities SET deal_id=$1, contact_id=$2, activity_type=$3, subject=$4, notes=$5, outcome=$6, scheduled_at=$7, completed_at=$8, duration_mins=$9 WHERE id=$10 RETURNING *',
      [deal_id, contact_id, activity_type, subject, notes, outcome, scheduled_at, completed_at, duration_mins, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM activities WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
