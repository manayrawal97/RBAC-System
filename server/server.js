const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// ✅ Changed: destructure connectDB from config/db
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running ✅' });
});

// app.use('*', (req, res) => {
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled: ${err.message}`);
  process.exit(1);
});