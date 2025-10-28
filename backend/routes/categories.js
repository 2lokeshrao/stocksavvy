const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get all categories (default + user's custom)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT * FROM categories 
       WHERE user_id = 1 OR user_id = $1 
       ORDER BY parent_category, name`,
      [req.user.userId]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add custom category
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, parent_category } = req.body;

    const [result] = await pool.query(
      'INSERT INTO categories (user_id, name, parent_category, is_default) VALUES ($1, $2, $3, FALSE) RETURNING *',
      [req.user.userId, name, parent_category]
    );

    res.status(201).json({ message: 'Category added successfully', category: result.rows[0] });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete custom category
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = FALSE RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or cannot be deleted' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
