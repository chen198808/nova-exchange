import { VercelRequest, VercelResponse } from '@vercel/node';

const TOKENS: Record<string, { mint: string; decimals: number }> = {
  SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  USDT: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  RS: { mint: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk', decimals: 9 },
  BTC: { mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', decimals: 8 },
  ETH: { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', decimals: 8 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pair } = req.query;
    const pairStr = Array.isArray(pair) ? pair[0] : pair;
    
    if (!pairStr) {
      return res.status(400).json({ error: 'Pair is required' });
    }

    const [baseAsset, quoteAsset] = pairStr.split('_');
    const baseToken = TOKENS[baseAsset];
    const quoteToken = TOKENS[quoteAsset];

    if (!baseToken || !quoteToken) {
      return res.status(400).json({ error: 'Unsupported pair' });
    }

    const url = `https://price.jup.ag/v6/price?ids=${baseToken.mint}&vsToken=${quoteToken.mint}`;
    const response = await fetch(url);
    const data: any = await response.json();

    let price = null;
    if (data.data && data.data[baseToken.mint]) {
      price = data.data[baseToken.mint].price;
    }

    if (price === null) {
      const basePrice = await getUSDTPrice(baseToken.mint);
      const quotePrice = await getUSDTPrice(quoteToken.mint);
      if (basePrice && quotePrice) {
        price = basePrice / quotePrice;
      }
    }

    if (price === null) {
      return res.status(500).json({ error: 'Failed to get price' });
    }

    return res.json({ pair: pairStr, price });
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
