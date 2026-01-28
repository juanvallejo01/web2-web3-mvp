/**
 * Event Hub Backend Server
 * Web2 → Web3 Bridge MVP
 * Receives generic Web2 events with Web3 signature verification
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/events.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Event Hub Backend',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/events', eventRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Web2-Web3 Event Hub API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      events: {
        create: 'POST /api/events',
        list: 'GET /api/events',
        stats: 'GET /api/events/stats'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Event Hub Backend running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
});
