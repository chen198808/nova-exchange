import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, withdraw } from '../_db';

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

    const { asset, amount, toAddress } = req.body;
    if (!asset || !amount || !toAddress) {
      return res.status(400).json({ error: 'asset, amount, and toAddress are required' });
    }

    const withdrawal = withdraw(userId, asset, amount, toAddress);
    return res.json({
      success: true,
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      asset: withdrawal.asset,
      txId: withdrawal.txId,
      status: withdrawal.status,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
