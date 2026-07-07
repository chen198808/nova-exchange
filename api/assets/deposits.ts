import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, getDeposits } from '../_db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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

    const deposits = getDeposits(userId);
    return res.json({ deposits });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
