const express = require('express');
const router = express.Router();
const pool = require('../db');
const ExcelJS = require('exceljs');

router.get('/', async (req, res) => {
  const { year } = req.query;
  const yearFilter = year ? parseInt(year) : null;

  const rentParams = yearFilter ? [yearFilter] : [];
  const rentWhere = yearFilter ? 'WHERE year = $1' : '';
  const expenseParams = yearFilter ? [yearFilter] : [];
  const expenseWhere = yearFilter ? 'WHERE year = $1' : '';
  const tripParams = yearFilter ? [yearFilter] : [];
  const tripWhere = yearFilter ? 'WHERE EXTRACT(YEAR FROM trip_date) = $1' : '';

  const [rent, expenses, trips] = await Promise.all([
    pool.query(`SELECT unit_number, year, month, amount_due, late_fee, amount_paid, status FROM rent_payments ${rentWhere} ORDER BY year, month, unit_number`, rentParams),
    pool.query(`SELECT expense_date, category, description, amount FROM expenses ${expenseWhere} ORDER BY expense_date`, expenseParams),
    pool.query(`SELECT trip_date, miles, purpose FROM trips ${tripWhere} ORDER BY trip_date`, tripParams),
  ]);

  const workbook = new ExcelJS.Workbook();
  const IRS_RATE = 0.70;

  // Rent sheet
  const rentSheet = workbook.addWorksheet('Rent');
  rentSheet.columns = [
    { header: 'Unit', key: 'unit_number', width: 8 },
    { header: 'Year', key: 'year', width: 8 },
    { header: 'Month', key: 'month', width: 8 },
    { header: 'Amount Due', key: 'amount_due', width: 14 },
    { header: 'Late Fee', key: 'late_fee', width: 12 },
    { header: 'Amount Paid', key: 'amount_paid', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  rentSheet.getRow(1).font = { bold: true };
  rent.rows.forEach(row => rentSheet.addRow(row));

  // Expenses sheet
  const expensesSheet = workbook.addWorksheet('Expenses');
  expensesSheet.columns = [
    { header: 'Date', key: 'expense_date', width: 14 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Amount', key: 'amount', width: 14 },
  ];
  expensesSheet.getRow(1).font = { bold: true };
  expenses.rows.forEach(row => expensesSheet.addRow({
    ...row,
    expense_date: row.expense_date ? new Date(row.expense_date).toLocaleDateString() : '',
  }));

  // Trips sheet
  const tripsSheet = workbook.addWorksheet('Trips');
  tripsSheet.columns = [
    { header: 'Date', key: 'trip_date', width: 14 },
    { header: 'Miles', key: 'miles', width: 10 },
    { header: 'Purpose', key: 'purpose', width: 30 },
    { header: `IRS Deduction (@ $${IRS_RATE}/mi)`, key: 'deduction', width: 24 },
  ];
  tripsSheet.getRow(1).font = { bold: true };
  trips.rows.forEach(row => tripsSheet.addRow({
    ...row,
    trip_date: row.trip_date ? new Date(row.trip_date).toLocaleDateString() : '',
    deduction: (parseFloat(row.miles) * IRS_RATE).toFixed(2),
  }));

  const filename = yearFilter ? `property-dashboard-${yearFilter}.xlsx` : 'property-dashboard.xlsx';
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
