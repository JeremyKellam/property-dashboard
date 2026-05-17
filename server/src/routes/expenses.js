const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get expenses, optionally filtered by year/month
router.get('/', async (req, res) => {
  const { year, month } = req.query;
  let query = 'SELECT * FROM expenses';
  const params = [];
  if (year && month) {
    query += ' WHERE year = $1 AND month = $2';
    params.push(year, month);
  } else if (year) {
    query += ' WHERE year = $1';
    params.push(year);
  }
  query += ' ORDER BY expense_date DESC';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Add an expense
router.post('/', async (req, res) => {
  const { year, month, category, amount, description, expense_date } = req.body;
  const result = await pool.query(
    `INSERT INTO expenses (year, month, category, amount, description, expense_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [year, month, category, amount, description, expense_date]
  );
  res.json(result.rows[0]);
});

// Update an expense
router.put('/:id', async (req, res) => {
  const { category, amount, description, expense_date } = req.body;
  const [year, month] = expense_date.split('-').map(Number);
  const result = await pool.query(
    `UPDATE expenses SET category=$1, amount=$2, description=$3, expense_date=$4, year=$5, month=$6 WHERE id=$7 RETURNING *`,
    [category, amount, description, expense_date, year, month, req.params.id]
  );
  res.json(result.rows[0]);
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
