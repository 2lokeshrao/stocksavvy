const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get all locations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT * FROM locations WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );

    res.json({ locations: result.rows });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add location
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const [result] = await pool.query(
      'INSERT INTO locations (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.userId, name]
    );

    res.status(201).json({ message: 'Location added successfully', location: result.rows[0] });
  } catch (error) {
    console.error('Add location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete location
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM locations WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
