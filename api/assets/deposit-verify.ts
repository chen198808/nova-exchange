import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, verifyDeposit } from '../_db';
import { handleOptions, successResponse, errorResponse } from '../_utils';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
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

    const { txId, asset } = req.body;
    if (!txId || !asset) {
      return errorResponse(res, 400, '交易哈希和币种必填');
    }

    const deposit = verifyDeposit(userId, txId, asset);
    return successResponse(res, {
      success: true,
      depositId: deposit.id,
      amount: deposit.amount,
      asset: deposit.asset,
      status: deposit.status,
    });
  } catch (error: any) {
    return errorResponse(res, 400, error.message || '充值验证失败');
  }
}
