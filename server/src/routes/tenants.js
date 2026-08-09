const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all tenants
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM tenants ORDER BY unit_number');
  res.json(result.rows);
});

// Create or update tenant for a unit
router.post('/', async (req, res) => {
  const { unit_number, tenant_name, phone, email, lease_start, lease_end, monthly_rent, notes } = req.body;
  const result = await pool.query(
    `INSERT INTO tenants (unit_number, tenant_name, phone, email, lease_start, lease_end, monthly_rent, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (unit_number)
     DO UPDATE SET tenant_name=$2, phone=$3, email=$4, lease_start=$5, lease_end=$6, monthly_rent=$7, notes=$8, updated_at=NOW()
     RETURNING *`,
    [unit_number, tenant_name, phone, email, lease_start || null, lease_end || null, monthly_rent === '' || monthly_rent == null ? 0 : monthly_rent, notes]
  );
  res.json(result.rows[0]);
});

// Update tenant
router.put('/:id', async (req, res) => {
  const { tenant_name, phone, email, lease_start, lease_end, monthly_rent, notes } = req.body;
  const result = await pool.query(
    `UPDATE tenants SET tenant_name=$1, phone=$2, email=$3, lease_start=$4, lease_end=$5, monthly_rent=$6, notes=$7, updated_at=NOW()
     WHERE id=$8 RETURNING *`,
    [tenant_name, phone, email, lease_start || null, lease_end || null, monthly_rent === '' || monthly_rent == null ? 0 : monthly_rent, notes, req.params.id]
  );
  res.json(result.rows[0]);
});

// Delete tenant
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM tenants WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
