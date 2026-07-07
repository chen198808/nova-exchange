import { VercelRequest, VercelResponse } from '@vercel/node';

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function successResponse(res: VercelResponse, data: any) {
  setCorsHeaders(res);
  return res.json(data);
}

export function errorResponse(res: VercelResponse, status: number, message: string) {
  setCorsHeaders(res);
  return res.status(status).json({ error: message });
}
