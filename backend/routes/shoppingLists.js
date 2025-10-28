const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get all shopping/order list items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT sl.*, v.name as vendor_name 
       FROM shopping_lists sl 
       LEFT JOIN vendors v ON sl.vendor_id = v.id 
       WHERE sl.user_id = $1 
       ORDER BY sl.created_at DESC`,
      [req.user.userId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get shopping list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add item to shopping list
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { item_id, item_name, quantity, unit, vendor_id } = req.body;

    const [result] = await pool.query(
      'INSERT INTO shopping_lists (user_id, item_id, item_name, quantity, unit, vendor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.userId, item_id, item_name, quantity, unit, vendor_id]
    );

    res.status(201).json({ message: 'Item added to list successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Add to shopping list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update shopping list item status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await pool.query(
      'UPDATE shopping_lists SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Status updated successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete shopping list item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM shopping_lists WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete shopping list item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
