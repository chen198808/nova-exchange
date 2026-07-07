import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../_db';
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

    const { inputAsset, outputAsset, amount, slippage } = req.body;

    if (!inputAsset || !outputAsset || !amount) {
      return errorResponse(res, 400, '输入币种、输出币种和金额必填');
    }

    const inputToken = TOKENS[inputAsset];
    const outputToken = TOKENS[outputAsset];

    if (!inputToken || !outputToken) {
      return errorResponse(res, 400, '不支持的币种');
    }

    const quote = await getJupiterQuote(inputToken.mint, outputToken.mint, amount, slippage || 50);

    if (!quote) {
      return errorResponse(res, 500, '获取报价失败');
    }

    return successResponse(res, {
      inputAsset,
      outputAsset,
      inputAmount: amount,
      outputAmount: quote.outAmount,
      price: quote.price,
      slippage: quote.slippage,
      fee: quote.fee,
    });
  } catch (error: any) {
    return errorResponse(res, 500, error.message || '服务器错误');
  }
}

async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
): Promise<{ outAmount: number; price: number; slippage: number; fee: number } | null> {
  try {
    const inputDecimals = 9;
    const amountRaw = Math.floor(amount * Math.pow(10, inputDecimals));

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountRaw}&slippageBps=${slippageBps}`;
    const response = await fetch(url);
    const quote: any = await response.json();

    if (quote && quote.outAmount) {
      const outputDecimals = 6;
      const outAmount = Number(quote.outAmount) / Math.pow(10, outputDecimals);
      return {
        outAmount,
        price: outAmount / amount,
        slippage: slippageBps / 100,
        fee: Number(quote.routePlan?.[0]?.swapInfo?.feeAmount || 0) / 1e9,
      };
    }

    const basePrice = await getUSDTPrice(inputMint);
    const quotePrice = await getUSDTPrice(outputMint);
    if (basePrice && quotePrice) {
      const price = basePrice / quotePrice;
      return {
        outAmount: amount * price,
        price,
        slippage: slippageBps / 100,
        fee: 0.001,
      };
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
