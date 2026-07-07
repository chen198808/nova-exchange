import { VercelRequest, VercelResponse } from '@vercel/node';
import { loginUser } from '../_db';
import { handleOptions, successResponse, errorResponse } from '../_utils';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 400, '用户名和密码必填');
    }

    const result = loginUser(username, password);

    return successResponse(res, {
      success: true,
      ...result,
    });
  } catch (error: any) {
    return errorResponse(res, 401, error.message || '登录失败');
  }
}
