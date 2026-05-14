const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT n.*, d.title as deal_title FROM notes n LEFT JOIN deals d ON n.deal_id = d.id ORDER BY n.is_pinned DESC, n.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT n.*, d.title as deal_title FROM notes n LEFT JOIN deals d ON n.deal_id = d.id WHERE n.id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { deal_id, content, note_type, is_pinned } = req.body;
    const result = await db.query(
      'INSERT INTO notes (deal_id, user_id, content, note_type, is_pinned) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [deal_id, req.user.id, content, note_type || 'general', is_pinned || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { deal_id, content, note_type, is_pinned } = req.body;
    const result = await db.query(
      'UPDATE notes SET deal_id=$1, content=$2, note_type=$3, is_pinned=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [deal_id, content, note_type, is_pinned, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
