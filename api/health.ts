import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOptions, successResponse } from './_utils';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  return successResponse(res, {
    status: 'ok',
    time: new Date().toISOString(),
    env: process.env.VERCEL_ENV || 'development',
  });
}
