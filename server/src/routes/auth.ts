import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth';
import { generateKeypair } from '../services/solanaService';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const now = Date.now();

    const result = db
      .prepare('INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(username, email || null, passwordHash, now, now);

    const userId = result.lastInsertRowid as number;

    const wallet = generateKeypair();
    db.prepare(
      'INSERT INTO user_wallets (user_id, chain, address, private_key, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'solana', wallet.publicKey, wallet.privateKey, now);

    const initialBalances = [
      { asset: 'USDT', free: 0, total: 0 },
      { asset: 'SOL', free: 0, total: 0 },
      { asset: 'RS', free: 0, total: 0 },
      { asset: 'BTC', free: 0, total: 0 },
      { asset: 'ETH', free: 0, total: 0 },
      { asset: 'BNB', free: 0, total: 0 },
      { asset: 'XRP', free: 0, total: 0 },
      { asset: 'DOGE', free: 0, total: 0 },
      { asset: 'ADA', free: 0, total: 0 },
      { asset: 'AVAX', free: 0, total: 0 },
      { asset: 'LINK', free: 0, total: 0 },
    ];

    const insertBalance = db.prepare(
      'INSERT INTO balances (user_id, asset, free, locked, total, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const transaction = db.transaction(() => {
      for (const balance of initialBalances) {
        insertBalance.run(userId, balance.asset, balance.free, 0, balance.total, now);
      }
    });
    transaction();

    const token = generateToken({ id: userId, username });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        username,
        email,
        depositAddress: wallet.publicKey,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const wallet = db.prepare('SELECT address FROM user_wallets WHERE user_id = ? AND chain = ?').get(
      user.id,
      'solana'
    ) as any;

    const token = generateToken({ id: user.id, username: user.username });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        depositAddress: wallet?.address,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db
      .prepare('SELECT id, username, email, created_at FROM users WHERE id = ?')
      .get(req.user!.id) as any;

    const wallet = db.prepare('SELECT address FROM user_wallets WHERE user_id = ? AND chain = ?').get(
      req.user!.id,
      'solana'
    ) as any;

    res.json({
      user: {
        ...user,
        depositAddress: wallet?.address,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
