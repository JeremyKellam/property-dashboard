// Run: node seed-tenants.js <API_URL> <API_KEY>
// Example: node seed-tenants.js https://property-dashboard-server.onrender.com/api YOUR_KEY

const API_URL = process.argv[2] || 'http://localhost:4000/api';
const API_KEY = process.argv[3];

if (!API_KEY) {
  console.error('Usage: node seed-tenants.js <API_URL> <API_KEY>');
  process.exit(1);
}

const tenants = [
  {
    unit_number: 1,
    tenant_name: 'Larry Bryla',
    phone: '850-374-0946',
    email: '',
    lease_start: '',
    lease_end: '2026-07-31',
    monthly_rent: 1250,
    notes: 'Sherry: 850-964-0186\nSecurity Deposit: $550\nCar: White Pontiac\nMoved In: 2011\nMailbox: #10',
  },
  {
    unit_number: 2,
    tenant_name: 'Sagui Flores "Heydi" Judith',
    phone: '850-739-1241',
    email: 'heydiflores1618@gmail.com',
    lease_start: '2022-09-15',
    lease_end: '2026-08-31',
    monthly_rent: 1400,
    notes: 'Security Deposit: $2,000\nCar: Grey Truck\nMoved In: 9/15/22\nMailbox: #11',
  },
  {
    unit_number: 3,
    tenant_name: 'DeAngelo James',
    phone: '850-225-9410',
    email: 'jamesdeangelo11@gmail.com',
    lease_start: '2023-11-27',
    lease_end: '',
    monthly_rent: 1400,
    notes: 'Anya Sutherland: 850-822-1887\nSecurity Deposit: $1,200\nCar: Red Mazda\nMoved In: 11/27/23\nLease End: Nov (TBD)\nMailbox: #12',
  },
  {
    unit_number: 4,
    tenant_name: 'Elizabeth Ofelia',
    phone: '850-582-9468',
    email: 'elizabethba298623@gmail.com',
    lease_start: '2026-06-01',
    lease_end: '2027-05-31',
    monthly_rent: 1400,
    notes: 'Security Deposit: $2,000\nCar: None\nMoved In: 06/01/26\nMailbox: #13',
  },
];

async function seed() {
  for (const t of tenants) {
    const res = await fetch(`${API_URL}/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(t),
    });
    const data = await res.json();
    console.log(`Unit ${t.unit_number} (${t.tenant_name}):`, res.ok ? 'OK' : data);
  }
}

seed();
