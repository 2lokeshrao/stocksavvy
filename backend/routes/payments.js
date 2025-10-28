const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Create payment order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { plan_type, amount } = req.body;

    // In production, you would create a Razorpay order here
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET
    // });
    
    // For now, we'll create a mock order
    const orderId = 'order_' + Date.now();

    const [result] = await pool.query(
      'INSERT INTO payments (user_id, razorpay_order_id, amount, plan_type, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, orderId, amount, plan_type, 'pending']
    );

    res.json({ 
      message: 'Order created successfully', 
      order_id: orderId,
      amount: amount,
      currency: 'INR',
      payment: result.rows[0]
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify payment
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, plan_type } = req.body;

    // In production, verify the payment signature here
    // const crypto = require('crypto');
    // const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(razorpay_order_id + "|" + razorpay_payment_id)
    //   .digest('hex');

    // Update payment status
    await pool.query(
      'UPDATE payments SET razorpay_payment_id = $1, status = $2 WHERE razorpay_order_id = $3',
      [razorpay_payment_id, 'success', razorpay_order_id]
    );

    // Update user subscription
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    await pool.query(
      'UPDATE users SET subscription_plan = $1, subscription_status = $2, subscription_end_date = $3 WHERE id = $4',
      [plan_type, 'active', subscriptionEndDate, req.user.userId]
    );

    res.json({ 
      message: 'Payment verified successfully',
      subscription_plan: plan_type,
      subscription_end_date: subscriptionEndDate
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
