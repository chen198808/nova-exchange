import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../_db';

const TOKENS: Record<string, { mint: string; decimals: number }> = {
  SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  USDT: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  RS: { mint: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk', decimals: 9 },
  BTC: { mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', decimals: 8 },
  ETH: { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', decimals: 8 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { inputAsset, outputAsset, amount, slippage } = req.body;

    if (!inputAsset || !outputAsset || !amount) {
      return res.status(400).json({ error: 'inputAsset, outputAsset, and amount are required' });
    }

    const inputToken = TOKENS[inputAsset];
    const outputToken = TOKENS[outputAsset];

    if (!inputToken || !outputToken) {
      return res.status(400).json({ error: 'Unsupported asset' });
    }

    const inputDecimals = inputToken.decimals;
    const amountRaw = Math.floor(amount * Math.pow(10, inputDecimals));

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputToken.mint}&outputMint=${outputToken.mint}&amount=${amountRaw}&slippageBps=${slippage || 50}`;
    const response = await fetch(url);
    const quote: any = await response.json();

    if (!quote || !quote.outAmount) {
      const basePrice = await getUSDTPrice(inputToken.mint);
      const quotePrice = await getUSDTPrice(outputToken.mint);
      if (basePrice && quotePrice) {
        const price = basePrice / quotePrice;
        const outAmount = amount * price;
        return res.json({
          inputAsset,
          outputAsset,
          inputAmount: amount,
          outputAmount: outAmount,
          price,
          slippage: (slippage || 50) / 100,
          fee: 0.001,
        });
      }
      return res.status(500).json({ error: 'Failed to get quote' });
    }

    const outDecimals = outputToken.decimals;
    const outAmount = Number(quote.outAmount) / Math.pow(10, outDecimals);
    const price = outAmount / amount;

    return res.json({
      inputAsset,
      outputAsset,
      inputAmount: amount,
      outputAmount: outAmount,
      price,
      slippage: (slippage || 50) / 100,
      fee: Number(quote.routePlan?.[0]?.swapInfo?.feeAmount || 0) / 1e9,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
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
