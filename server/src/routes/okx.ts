import { Router, Response } from 'express';
import {
  getTickers,
  getTicker,
  getCandlesticks,
  getOrderBook,
  getTrades,
  getInstruments,
  getAccountBalance,
  placeOrder,
  cancelOrder,
  getOrder,
  getOrderHistory,
  getPositions,
  isOkxConfigured,
} from '../services/okxService';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/instruments', async (req: AuthRequest, res: Response) => {
  try {
    const { instType = 'SPOT' } = req.query;
    const data = await getInstruments(instType as string);
    res.json({ instruments: data });
  } catch (error) {
    console.error('Instruments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tickers', async (req: AuthRequest, res: Response) => {
  try {
    const { instType = 'SPOT' } = req.query;
    const data = await getTickers(instType as string);
    res.json({ tickers: data });
  } catch (error) {
    console.error('Tickers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/ticker/:instId', async (req: AuthRequest, res: Response) => {
  try {
    const { instId } = req.params;
    const data = await getTicker(instId as string);
    if (!data) {
      res.status(404).json({ error: 'Ticker not found' });
      return;
    }
    res.json({ ticker: data });
  } catch (error) {
    console.error('Ticker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/candles/:instId', async (req: AuthRequest, res: Response) => {
  try {
    const { instId } = req.params;
    const { bar = '1H', limit = '100' } = req.query;
    const data = await getCandlesticks(
      instId as string,
      bar as string,
      parseInt(limit as string, 10)
    );
    const candles = data.map((c: string[]) => ({
      time: parseInt(c[0], 10),
      open: parseFloat(c[1]),
      high: parseFloat(c[2]),
      low: parseFloat(c[3]),
      close: parseFloat(c[4]),
      volume: parseFloat(c[5]),
    }));
    res.json({ candles });
  } catch (error) {
    console.error('Candles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orderbook/:instId', async (req: AuthRequest, res: Response) => {
  try {
    const { instId } = req.params;
    const { sz = '20' } = req.query;
    const data = await getOrderBook(instId as string, sz as string);
    res.json({ orderbook: data });
  } catch (error) {
    console.error('Orderbook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/trades/:instId', async (req: AuthRequest, res: Response) => {
  try {
    const { instId } = req.params;
    const { limit = '50' } = req.query;
    const data = await getTrades(instId as string, parseInt(limit as string, 10));
    res.json({ trades: data });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isOkxConfigured()) {
      res.status(400).json({ error: 'OKX API not configured' });
      return;
    }
    const data = await getAccountBalance();
    res.json({ balance: data });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/order', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isOkxConfigured()) {
      res.status(400).json({ error: 'OKX API not configured' });
      return;
    }
    const { instId, tdMode, side, ordType, sz, px } = req.body;
    if (!instId || !tdMode || !side || !ordType || !sz) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    const result = await placeOrder({ instId, tdMode, side, ordType, sz, px });
    res.json({ order: result });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/cancel-order', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isOkxConfigured()) {
      res.status(400).json({ error: 'OKX API not configured' });
      return;
    }
    const { instId, ordId } = req.body;
    if (!instId || !ordId) {
      res.status(400).json({ error: 'instId and ordId are required' });
      return;
    }
    const result = await cancelOrder(instId, ordId);
    res.json({ result });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/order/:instId/:ordId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isOkxConfigured()) {
      res.status(400).json({ error: 'OKX API not configured' });
      return;
    }
    const { instId, ordId } = req.params;
    const result = await getOrder(String(instId), String(ordId));
    res.json({ order: result });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders-history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isOkxConfigured()) {
      res.status(400).json({ error: 'OKX API not configured' });
      return;
    }
    const { instType = 'SPOT', limit = '100' } = req.query;
    const data = await getOrderHistory(instType as string, parseInt(limit as string, 10));
    res.json({ orders: data });
  } catch (error) {
    console.error('Orders history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/positions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isOkxConfigured()) {
      res.status(400).json({ error: 'OKX API not configured' });
      return;
    }
    const { instType = 'SWAP' } = req.query;
    const data = await getPositions(instType as string);
    res.json({ positions: data });
  } catch (error) {
    console.error('Positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/status', (req: AuthRequest, res: Response) => {
  res.json({ configured: isOkxConfigured() });
});

export default router;
