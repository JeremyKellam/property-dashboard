const express = require('express');
const router = express.Router();
const pool = require('../db');
const ExcelJS = require('exceljs');

const CATEGORY_LABELS = {
  mortgage:              'Mortgage Interest',
  insurance_homeowner:   'Insurance (Homeowner)',
  insurance_flood:       'Insurance (Flood)',
  taxes:                 'Property Taxes',
  water_sewer:           'Utilities',
  maintenance:           'Repairs & Maintenance',
  supplies:              'Supplies',
  professional_fees:     'Legal & Professional Fees',
};

// Schedule E line mapping for summary sheet
const SCHEDULE_E_LINES = [
  { label: 'Mortgage Interest',          key: 'mortgage',            line: 'Line 12' },
  { label: 'Insurance (Homeowner)',       key: 'insurance_homeowner', line: 'Line 9'  },
  { label: 'Insurance (Flood)',           key: 'insurance_flood',     line: 'Line 9'  },
  { label: 'Property Taxes',             key: 'taxes',               line: 'Line 16' },
  { label: 'Utilities',                  key: 'water_sewer',         line: 'Line 17' },
  { label: 'Repairs & Maintenance',      key: 'maintenance',         line: 'Line 14' },
  { label: 'Supplies',                   key: 'supplies',            line: 'Line 15' },
  { label: 'Legal & Professional Fees',  key: 'professional_fees',   line: 'Line 10' },
];

const IRS_RATE = 0.70;

router.get('/', async (req, res) => {
  const { year } = req.query;
  const yearFilter = year ? parseInt(year) : null;

  const rentWhere = yearFilter ? 'WHERE year = $1' : '';
  const expenseWhere = yearFilter ? 'WHERE year = $1' : '';
  const tripWhere = yearFilter ? 'WHERE EXTRACT(YEAR FROM trip_date) = $1' : '';
  const params = yearFilter ? [yearFilter] : [];

  const [rent, expenses, trips] = await Promise.all([
    pool.query(`SELECT unit_number, year, month, amount_due, late_fee, amount_paid, status FROM rent_payments ${rentWhere} ORDER BY year, month, unit_number`, params),
    pool.query(`SELECT expense_date, category, description, amount FROM expenses ${expenseWhere} ORDER BY expense_date`, params),
    pool.query(`SELECT trip_date, miles, purpose FROM trips ${tripWhere} ORDER BY trip_date`, params),
  ]);

  const workbook = new ExcelJS.Workbook();

  // --- Summary sheet ---
  const summarySheet = workbook.addWorksheet('Summary (Schedule E)');
  summarySheet.columns = [
    { key: 'label', width: 32 },
    { key: 'line',  width: 12 },
    { key: 'amount', width: 16 },
  ];

  const addSummaryHeader = (text) => {
    const row = summarySheet.addRow({ label: text });
    row.font = { bold: true, size: 12 };
    row.getCell('label').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    summarySheet.mergeCells(`A${row.number}:C${row.number}`);
  };

  const addSummaryRow = (label, line, amount) => {
    const row = summarySheet.addRow({ label, line, amount });
    row.getCell('amount').numFmt = '"$"#,##0.00';
    return row;
  };

  const addSummaryTotal = (label, amount) => {
    const row = summarySheet.addRow({ label, amount });
    row.font = { bold: true };
    row.getCell('amount').numFmt = '"$"#,##0.00';
    return row;
  };

  summarySheet.addRow({ label: yearFilter ? `Tax Year ${yearFilter} — Schedule E Summary` : 'All Years — Schedule E Summary' }).font = { bold: true, size: 14 };
  summarySheet.addRow({});

  // Income
  addSummaryHeader('INCOME');
  summarySheet.addRow({ label: 'Description', line: 'Schedule E', amount: 'Amount' }).font = { bold: true, italic: true };
  const totalRentCollected = rent.rows.reduce((sum, r) => sum + parseFloat(r.amount_paid || 0), 0);
  addSummaryRow('Gross Rent Received', 'Line 3', totalRentCollected);
  summarySheet.addRow({});

  // Expenses
  addSummaryHeader('EXPENSES');
  summarySheet.addRow({ label: 'Category', line: 'Schedule E', amount: 'Amount' }).font = { bold: true, italic: true };

  const expenseTotals = expenses.rows.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
    return acc;
  }, {});

  let totalExpenses = 0;
  for (const { label, key, line } of SCHEDULE_E_LINES) {
    const amount = expenseTotals[key] || 0;
    addSummaryRow(label, line, amount);
    totalExpenses += amount;
  }

  // Mileage
  const totalMiles = trips.rows.reduce((sum, t) => sum + parseFloat(t.miles || 0), 0);
  const mileageDeduction = totalMiles * IRS_RATE;
  addSummaryRow(`Mileage (${totalMiles.toFixed(1)} mi @ $${IRS_RATE}/mi)`, 'Line 6', mileageDeduction);
  totalExpenses += mileageDeduction;

  summarySheet.addRow({});
  addSummaryTotal('Total Expenses', totalExpenses);
  summarySheet.addRow({});
  addSummaryTotal('Net Income (before depreciation)', totalRentCollected - totalExpenses);

  // --- Rent sheet ---
  const rentSheet = workbook.addWorksheet('Rent');
  rentSheet.columns = [
    { header: 'Unit',        key: 'unit_number',  width: 8  },
    { header: 'Year',        key: 'year',          width: 8  },
    { header: 'Month',       key: 'month',         width: 8  },
    { header: 'Amount Due',  key: 'amount_due',    width: 14 },
    { header: 'Late Fee',    key: 'late_fee',      width: 12 },
    { header: 'Amount Paid', key: 'amount_paid',   width: 14 },
    { header: 'Status',      key: 'status',        width: 12 },
  ];
  rentSheet.getRow(1).font = { bold: true };
  rent.rows.forEach(row => rentSheet.addRow(row));

  // --- Expenses sheet ---
  const expensesSheet = workbook.addWorksheet('Expenses');
  expensesSheet.columns = [
    { header: 'Date',        key: 'expense_date', width: 14 },
    { header: 'Category',    key: 'category',     width: 24 },
    { header: 'Description', key: 'description',  width: 30 },
    { header: 'Amount',      key: 'amount',       width: 14 },
  ];
  expensesSheet.getRow(1).font = { bold: true };
  expenses.rows.forEach(row => expensesSheet.addRow({
    ...row,
    category: CATEGORY_LABELS[row.category] || row.category,
    expense_date: row.expense_date ? new Date(row.expense_date).toLocaleDateString() : '',
  }));

  // --- Trips sheet ---
  const tripsSheet = workbook.addWorksheet('Trips');
  tripsSheet.columns = [
    { header: 'Date',                              key: 'trip_date',  width: 14 },
    { header: 'Miles',                             key: 'miles',      width: 10 },
    { header: 'Purpose',                           key: 'purpose',    width: 30 },
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
