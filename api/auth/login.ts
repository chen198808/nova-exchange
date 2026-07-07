import { VercelRequest, VercelResponse } from '@vercel/node';
import { loginUser } from '../_db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = loginUser(username, password);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
}
