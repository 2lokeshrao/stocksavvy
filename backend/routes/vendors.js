const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get all vendors
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT * FROM vendors WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );

    res.json({ vendors: result.rows });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add vendor
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;

    const [result] = await pool.query(
      'INSERT INTO vendors (user_id, name, contact_person, phone, email, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.userId, name, contact_person, phone, email, address]
    );

    res.status(201).json({ message: 'Vendor added successfully', vendor: result.rows[0] });
  } catch (error) {
    console.error('Add vendor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vendor
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;

    const [result] = await pool.query(
      'UPDATE vendors SET name = $1, contact_person = $2, phone = $3, email = $4, address = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [name, contact_person, phone, email, address, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor updated successfully', vendor: result.rows[0] });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete vendor
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM vendors WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
