const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get all items for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT i.*, c.name as category_name, l.name as location_name 
       FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       LEFT JOIN locations l ON i.location_id = l.id 
       WHERE i.user_id = $1 
       ORDER BY i.created_at DESC`,
      [req.user.userId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new item
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category_id, quantity, unit, expiry_date, low_stock_level, location_id, barcode } = req.body;

    const [result] = await pool.query(
      `INSERT INTO items (user_id, name, category_id, quantity, unit, expiry_date, low_stock_level, location_id, barcode) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [req.user.userId, name, category_id, quantity, unit, expiry_date, low_stock_level, location_id, barcode]
    );

    res.status(201).json({ message: 'Item added successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, quantity, unit, expiry_date, low_stock_level, location_id, barcode } = req.body;

    const [result] = await pool.query(
      `UPDATE items 
       SET name = $1, category_id = $2, quantity = $3, unit = $4, expiry_date = $5, 
           low_stock_level = $6, location_id = $7, barcode = $8, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 AND user_id = $10 
       RETURNING *`,
      [name, category_id, quantity, unit, expiry_date, low_stock_level, location_id, barcode, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item quantity
router.patch('/:id/quantity', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const [result] = await pool.query(
      `UPDATE items 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING *`,
      [quantity, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Quantity updated successfully', item: result.rows[0] });
  } catch (error) {
    console.error('Update quantity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get expiring items
router.get('/expiring', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT i.*, c.name as category_name 
       FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.user_id = $1 AND i.expiry_date <= CURRENT_DATE + INTERVAL '7 days' 
       ORDER BY i.expiry_date ASC`,
      [req.user.userId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get low stock items
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT i.*, c.name as category_name 
       FROM items i 
       LEFT JOIN categories c ON i.category_id = c.id 
       WHERE i.user_id = $1 AND i.quantity <= i.low_stock_level 
       ORDER BY i.quantity ASC`,
      [req.user.userId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
