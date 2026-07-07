import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleOptions, successResponse, errorResponse } from '../_utils';

const TOKENS: Record<string, { mint: string; decimals: number }> = {
  SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  USDT: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  RS: { mint: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk', decimals: 9 },
  BTC: { mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', decimals: 8 },
  ETH: { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', decimals: 8 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  try {
    const { pair } = req.query;
    const pairStr = Array.isArray(pair) ? pair[0] : pair;

    if (!pairStr) {
      return errorResponse(res, 400, '交易对必填');
    }

    const [baseAsset, quoteAsset] = pairStr.split('_');
    const baseToken = TOKENS[baseAsset];
    const quoteToken = TOKENS[quoteAsset];

    if (!baseToken || !quoteToken) {
      return errorResponse(res, 400, '不支持的币种');
    }

    const price = await getJupiterPrice(baseToken.mint, quoteToken.mint);

    if (price === null) {
      return errorResponse(res, 500, '获取价格失败');
    }

    return successResponse(res, { pair: pairStr, price });
  } catch (error: any) {
    return errorResponse(res, 500, error.message || '服务器错误');
  }
}

async function getJupiterPrice(inputMint: string, outputMint: string): Promise<number | null> {
  try {
    const url = `https://price.jup.ag/v6/price?ids=${inputMint}&vsToken=${outputMint}`;
    const response = await fetch(url);
    const data: any = await response.json();
    if (data.data && data.data[inputMint]) {
      return data.data[inputMint].price;
    }

    const basePrice = await getUSDTPrice(inputMint);
    const quotePrice = await getUSDTPrice(outputMint);
    if (basePrice && quotePrice) {
      return basePrice / quotePrice;
    }
    return null;
  } catch {
    return null;
  }
}

async function getUSDTPrice(mint: string): Promise<number | null> {
  try {
    const usdtMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const url = `https://price.jup.ag/v6/price?ids=${mint}&vsToken=${usdtMint}`;
    const response = await fetch(url);
    const data: any = await response.json();
    if (data.data && data.data[mint]) {
      return data.data[mint].price;
    }
    return null;
  } catch {
    return null;
  }
}
