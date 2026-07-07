import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import './database';
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import tradingRoutes from './routes/trading';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/trading', tradingRoutes);

// Serve static files from dist directory
const distPathDev = path.resolve(path.join(__dirname, '..', '..', 'dist'));
const distPathProd = path.resolve(path.join(__dirname, '..', 'dist'));
const distPath = fs.existsSync(path.join(distPathProd, 'index.html')) ? distPathProd : distPathDev;
console.log('Static files path:', distPath);
app.use(express.static(distPath));

// Fallback to index.html for React Router
app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built');
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 NovaExchange Server running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API base: http://0.0.0.0:${PORT}/api
🌐 Frontend: http://0.0.0.0:${PORT}
  `);
});

export default app;
