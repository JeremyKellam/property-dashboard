const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all rent payments, optionally filtered by year/month
router.get('/', async (req, res) => {
  const { year, month } = req.query;
  let query = 'SELECT * FROM rent_payments';
  const params = [];
  if (year && month) {
    query += ' WHERE year = $1 AND month = $2';
    params.push(year, month);
  } else if (year) {
    query += ' WHERE year = $1';
    params.push(year);
  }
  query += ' ORDER BY year DESC, month DESC, unit_number';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Get payments for a specific rent record
router.get('/:id/payments', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM payments WHERE rent_payment_id = $1 ORDER BY payment_date',
    [req.params.id]
  );
  res.json(result.rows);
});

// Create or update a rent record for a unit/month
router.post('/', async (req, res) => {
  const { unit_number, year, month, amount_due } = req.body;
  const result = await pool.query(
    `INSERT INTO rent_payments (unit_number, year, month, amount_due)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (unit_number, year, month)
     DO UPDATE SET amount_due = $4, updated_at = NOW()
     RETURNING *`,
    [unit_number, year, month, amount_due]
  );
  res.json(result.rows[0]);
});

// Record a payment toward a rent record
router.post('/:id/pay', async (req, res) => {
  const { amount, payment_date, notes } = req.body;
  const rentId = req.params.id;

  await pool.query(
    'INSERT INTO payments (rent_payment_id, amount, payment_date, notes) VALUES ($1, $2, $3, $4)',
    [rentId, amount, payment_date, notes]
  );

  // Recalculate total paid and status
  const totals = await pool.query(
    'SELECT SUM(amount) as total_paid FROM payments WHERE rent_payment_id = $1',
    [rentId]
  );
  const totalPaid = parseFloat(totals.rows[0].total_paid) || 0;

  const rent = await pool.query('SELECT * FROM rent_payments WHERE id = $1', [rentId]);
  const { amount_due, late_fee } = rent.rows[0];
  const total_owed = parseFloat(amount_due) + parseFloat(late_fee);

  let status = 'unpaid';
  if (totalPaid >= total_owed) status = 'paid';
  else if (totalPaid > 0) status = 'partial';

  const updated = await pool.query(
    'UPDATE rent_payments SET amount_paid = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [totalPaid, status, rentId]
  );
  res.json(updated.rows[0]);
});

// Delete a rent record and its payments
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  await pool.query('DELETE FROM payments WHERE rent_payment_id = $1', [id]);
  await pool.query('DELETE FROM rent_payments WHERE id = $1', [id]);
  res.json({ success: true });
});

// Apply late fee to a rent record
router.post('/:id/late-fee', async (req, res) => {
  const result = await pool.query(
    'UPDATE rent_payments SET late_fee = 100, updated_at = NOW() WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
