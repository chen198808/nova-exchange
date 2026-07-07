import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, getDeposits } from '../_db';
import { handleOptions, successResponse, errorResponse } from '../_utils';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return errorResponse(res, 401, '请先登录');
    }

    const userId = verifyToken(token);
    if (!userId) {
      return errorResponse(res, 401, '登录已过期');
    }

    const deposits = getDeposits(userId);
    return successResponse(res, { deposits });
  } catch (error: any) {
    return errorResponse(res, 500, error.message || '服务器错误');
  }
}
