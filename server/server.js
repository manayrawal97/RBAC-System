const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Must be first — loads .env before anything else

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

connectDB(); // Connect to MongoDB Atlas

const app = express();

// ── Core middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));


// Health check — visit this in browser to confirm server is running
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running ✅' });
});

// 404 for unknown routes
// app.use('.*', (req, res) => {
//   res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
// });
app.use('/{*any}', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler (must be last) ──────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled error: ${err.message}`);
  process.exit(1);
});