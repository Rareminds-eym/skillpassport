import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assessmentRoutes from './routes/assessment.js';

// Load environment variables from root .env
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/assessment', assessmentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Assessment API: http://localhost:${PORT}/api/assessment/generate`);
});
