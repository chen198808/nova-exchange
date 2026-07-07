import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, verifyDeposit } from '../_db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { txId, asset } = req.body;
    if (!txId || !asset) {
      return res.status(400).json({ error: 'txId and asset are required' });
    }

    const deposit = verifyDeposit(userId, txId, asset);
    return res.json({
      success: true,
      depositId: deposit.id,
      amount: deposit.amount,
      asset: deposit.asset,
      status: deposit.status,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
