require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'db error' });
  }
});

app.use((req, res, next) => {
  const auth = req.headers['authorization'];
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || token !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/rent', require('./routes/rent'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/export', require('./routes/export'));

const initDb = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id SERIAL PRIMARY KEY,
      unit_number INTEGER UNIQUE NOT NULL CHECK (unit_number BETWEEN 1 AND 4),
      tenant_name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      lease_start DATE,
      lease_end DATE,
      monthly_rent NUMERIC(10,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // Add columns if tables already existed without them
  await db.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notes TEXT`).catch(() => {});
  await db.query(`ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255)`).catch(() => {});
  // Backfill tenant names on existing rent records that don't have one
  await db.query(`
    UPDATE rent_payments rp SET tenant_name = t.tenant_name
    FROM tenants t
    WHERE rp.unit_number = t.unit_number AND rp.tenant_name IS NULL
  `).catch(() => {});
};

const PORT = process.env.PORT || 4000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
