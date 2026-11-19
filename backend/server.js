require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...((process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(Boolean)),
];

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error('CORS origin not allowed');
    error.status = 403;
    return callback(error);
  },
}));
app.use(express.json({ limit: '200kb' }));

app.get('/', (req, res) => res.json({ message: 'CampusConnect API is running' }));
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'database_disconnected',
    database: connected ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/meta', require('./routes/metaRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));
app.use((error, req, res, next) => {
  if (error.code === 11000) return res.status(409).json({ message: 'Record already exists' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large' });
  const status = error.status || 500;
  if (status >= 500) console.error('Server error:', error);
  return res.status(status).json({ message: status >= 500 ? 'Internal server error' : error.message });
});

async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET is missing or too short (minimum 32 characters)');
    }
    await connectDB();
    await require('./services/catalogService').ensureDefaultCatalog();
    app.listen(PORT, '0.0.0.0', () => console.log(`API listening on port ${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) start();
module.exports = app;
