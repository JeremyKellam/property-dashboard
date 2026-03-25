CREATE TABLE IF NOT EXISTS rent_payments (
  id SERIAL PRIMARY KEY,
  unit_number INTEGER NOT NULL CHECK (unit_number BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  late_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (unit_number, year, month)
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  rent_payment_id INTEGER REFERENCES rent_payments(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  category VARCHAR(50) NOT NULL CHECK (category IN ('mortgage', 'insurance_homeowner', 'insurance_flood', 'water_sewer', 'maintenance')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  trip_date DATE NOT NULL,
  miles NUMERIC(6,2) NOT NULL,
  purpose TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
