import { VercelRequest, VercelResponse } from '@vercel/node';
import { registerUser } from '../_db';
import { handleOptions, successResponse, errorResponse } from '../_utils';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return errorResponse(res, 400, '用户名和密码必填');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, '密码长度至少为6位');
    }

    const result = registerUser(username, password, email);

    return successResponse(res, {
      success: true,
      ...result,
    });
  } catch (error: any) {
    return errorResponse(res, 400, error.message || '注册失败');
  }
}
