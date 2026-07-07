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
import okxRoutes from './routes/okx';
import { getHotWallet, ensureTokenAccount } from './services/solanaService';

const TOKENS: Record<string, { mint: string; decimals: number }> = {
  USDT: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  RS: { mint: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk', decimals: 9 },
  BTC: { mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', decimals: 8 },
  ETH: { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', decimals: 8 },
};

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
app.use('/api/okx', okxRoutes);

// Serve static files from dist directory
const distPathDev = path.resolve(path.join(__dirname, '..', '..', 'dist'));
const distPathProd = path.resolve(path.join(__dirname, '..', 'dist'));
const distPath = fs.existsSync(path.join(distPathDev, 'index.html')) ? distPathDev : distPathProd;
console.log('Static files path:', distPath);
app.use(express.static(distPath));

// Fallback to index.html for React Router
app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
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

async function initHotWallet() {
  try {
    const hotWallet = getHotWallet();
    if (!hotWallet) {
      console.warn('Hot wallet not configured, skipping token account initialization');
      return;
    }
    console.log('Hot wallet address:', hotWallet.publicKey);
    
    for (const [symbol, token] of Object.entries(TOKENS)) {
      try {
        const ata = await ensureTokenAccount(hotWallet.privateKey, token.mint);
        console.log(`  ${symbol} ATA: ${ata}`);
      } catch (err: any) {
        console.warn(`  Failed to create ${symbol} ATA:`, err.message);
      }
    }
    console.log('Hot wallet token accounts initialized');
  } catch (err: any) {
    console.warn('Hot wallet init failed:', err.message);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 NovaExchange Server running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API base: http://0.0.0.0:${PORT}/api
🌐 Frontend: http://0.0.0.0:${PORT}
  `);
  
  initHotWallet();
});

export default app;
