const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get monthly summary: income vs expenses
router.get('/monthly', async (req, res) => {
  const { year } = req.query;
  const params = year ? [year] : [];
  const whereClause = year ? 'WHERE year = $1' : '';

  const income = await pool.query(
    `SELECT year, month,
      SUM(amount_paid) as total_collected,
      SUM(amount_due) as total_due,
      SUM(late_fee) as total_late_fees
     FROM rent_payments ${whereClause}
     GROUP BY year, month ORDER BY year DESC, month DESC`,
    params
  );

  const expenses = await pool.query(
    `SELECT year, month, category, SUM(amount) as total
     FROM expenses ${whereClause}
     GROUP BY year, month, category ORDER BY year DESC, month DESC`,
    params
  );

  res.json({ income: income.rows, expenses: expenses.rows });
});

module.exports = router;
