require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/rent', require('./routes/rent'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/summary', require('./routes/summary'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
