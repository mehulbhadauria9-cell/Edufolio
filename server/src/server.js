import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { runMigrations } from './migrations/migrate.js';
import { initWebSocketServer } from './utils/websocket.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import leetcodeRoutes from './routes/leetcodeRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle malformed JSON body errors gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  next(err);
});

// Serve static uploaded avatars
const uploadDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Disable HTTP caching for dynamic API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/leetcode', leetcodeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Edufolio Custom Backend',
    timestamp: new Date().toISOString()
  });
});

// Serve Frontend Built Assets & SPA Fallback (Same Link for Frontend and Backend)
const clientDistPath = path.resolve(__dirname, '../../edufolio/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA wildcard fallback: Send index.html for client-side React routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error fallback
app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err.message || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Initialize WebSocket for Realtime Updates
initWebSocketServer(server);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB(process.env.MONGODB_URI);
    await runMigrations();

    server.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Edufolio Backend running on http://localhost:${PORT}`);
      console.log(`📡 Realtime WebSocket live on ws://localhost:${PORT}/ws`);
      console.log(`🗄️ Database: MongoDB / Local Store`);
      console.log(`======================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
