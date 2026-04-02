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

app.use('/api/rent', require('./routes/rent'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/export', require('./routes/export'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
