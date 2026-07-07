import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const OKX_BASE_URL = 'https://www.okx.com';

function signMessage(timestamp: string, method: string, requestPath: string, body: string, secretKey: string): string {
  const message = timestamp + method + requestPath + body;
  const hmac = crypto.createHmac('sha256', secretKey);
  return hmac.update(message).digest('base64');
}

function getPassphrase(): string {
  return process.env.OKX_PASSPHRASE || '';
}

function getApiKey(): string {
  return process.env.OKX_API_KEY || '';
}

function getSecretKey(): string {
  return process.env.OKX_SECRET_KEY || '';
}

async function okxRequest(
  method: string,
  path: string,
  params: Record<string, any> = {},
  body: Record<string, any> = {}
): Promise<any> {
  let url = `${OKX_BASE_URL}${path}`;
  const queryString = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  url += queryString;

  const bodyStr = Object.keys(body).length ? JSON.stringify(body) : '';
  const timestamp = new Date().toISOString();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = getApiKey();
  const secretKey = getSecretKey();
  const passphrase = getPassphrase();

  if (apiKey && secretKey && passphrase) {
    const sign = signMessage(timestamp, method, path + queryString, bodyStr, secretKey);
    headers['OK-ACCESS-KEY'] = apiKey;
    headers['OK-ACCESS-SIGN'] = sign;
    headers['OK-ACCESS-TIMESTAMP'] = timestamp;
    headers['OK-ACCESS-PASSPHRASE'] = passphrase;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: method !== 'GET' && bodyStr ? bodyStr : undefined,
  });

  const data = await response.json() as any;
  if (data.code !== '0') {
    throw new Error(data.msg || `OKX API error: ${data.code}`);
  }
  return data.data;
}

export async function getTickers(instType: string = 'SPOT'): Promise<any[]> {
  try {
    const data = await okxRequest('GET', '/api/v5/market/tickers', { instType });
    return data;
  } catch (error) {
    console.error('OKX getTickers error:', error);
    return [];
  }
}

export async function getTicker(instId: string): Promise<any | null> {
  try {
    const data = await okxRequest('GET', '/api/v5/market/ticker', { instId });
    return data[0] || null;
  } catch (error) {
    console.error('OKX getTicker error:', error);
    return null;
  }
}

export async function getCandlesticks(
  instId: string,
  bar: string = '1H',
  limit: number = 100
): Promise<any[]> {
  try {
    const data = await okxRequest('GET', '/api/v5/market/candles', { instId, bar, limit: String(limit) });
    return data;
  } catch (error) {
    console.error('OKX getCandlesticks error:', error);
    return [];
  }
}

export async function getOrderBook(instId: string, sz: string = '20'): Promise<any | null> {
  try {
    const data = await okxRequest('GET', '/api/v5/market/books', { instId, sz });
    return data[0] || null;
  } catch (error) {
    console.error('OKX getOrderBook error:', error);
    return null;
  }
}

export async function getTrades(instId: string, limit: number = 50): Promise<any[]> {
  try {
    const data = await okxRequest('GET', '/api/v5/market/trades', { instId, limit: String(limit) });
    return data;
  } catch (error) {
    console.error('OKX getTrades error:', error);
    return [];
  }
}

export async function getInstruments(instType: string = 'SPOT'): Promise<any[]> {
  try {
    const data = await okxRequest('GET', '/api/v5/public/instruments', { instType });
    return data;
  } catch (error) {
    console.error('OKX getInstruments error:', error);
    return [];
  }
}

export async function getAccountBalance(): Promise<any | null> {
  try {
    const data = await okxRequest('GET', '/api/v5/asset/balances');
    return data;
  } catch (error) {
    console.error('OKX getAccountBalance error:', error);
    return null;
  }
}

export async function placeOrder(params: {
  instId: string;
  tdMode: string;
  side: string;
  ordType: string;
  sz: string;
  px?: string;
}): Promise<any | null> {
  try {
    const data = await okxRequest('POST', '/api/v5/trade/order', {}, params);
    return data[0] || null;
  } catch (error) {
    console.error('OKX placeOrder error:', error);
    return null;
  }
}

export async function cancelOrder(instId: string, ordId: string): Promise<any | null> {
  try {
    const data = await okxRequest('POST', '/api/v5/trade/cancel-order', {}, { instId, ordId });
    return data[0] || null;
  } catch (error) {
    console.error('OKX cancelOrder error:', error);
    return null;
  }
}

export async function getOrder(instId: string, ordId: string): Promise<any | null> {
  try {
    const data = await okxRequest('GET', '/api/v5/trade/order', { instId, ordId });
    return data[0] || null;
  } catch (error) {
    console.error('OKX getOrder error:', error);
    return null;
  }
}

export async function getOrderHistory(instType: string = 'SPOT', limit: number = 100): Promise<any[]> {
  try {
    const data = await okxRequest('GET', '/api/v5/trade/orders-history-archive', { instType, limit: String(limit) });
    return data;
  } catch (error) {
    console.error('OKX getOrderHistory error:', error);
    return [];
  }
}

export async function getPositions(instType: string = 'SWAP'): Promise<any[]> {
  try {
    const data = await okxRequest('GET', '/api/v5/account/positions', { instType });
    return data;
  } catch (error) {
    console.error('OKX getPositions error:', error);
    return [];
  }
}

export function isOkxConfigured(): boolean {
  return !!(getApiKey() && getSecretKey() && getPassphrase());
}
