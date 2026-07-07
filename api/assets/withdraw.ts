import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, withdraw } from '../_db';
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

    const { asset, amount, toAddress } = req.body;
    if (!asset || !amount || !toAddress) {
      return errorResponse(res, 400, '币种、金额和地址必填');
    }

    const withdrawal = withdraw(userId, asset, amount, toAddress);
    return successResponse(res, {
      success: true,
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      asset: withdrawal.asset,
      txId: withdrawal.txId,
      status: withdrawal.status,
    });
  } catch (error: any) {
    return errorResponse(res, 400, error.message || '提现失败');
  }
}
