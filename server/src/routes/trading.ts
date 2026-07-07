import { Router, Response } from 'express';
import db from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

const TOKENS: Record<string, { mint: string; decimals: number; priceMint: string; fixedPrice?: number }> = {
  SOL: {
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    priceMint: 'So11111111111111111111111111111111111111112',
    fixedPrice: 168.5,
  },
  USDT: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    priceMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    fixedPrice: 1,
  },
  RS: {
    mint: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk',
    decimals: 9,
    priceMint: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk',
    fixedPrice: 0.15,
  },
  BTC: {
    mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    decimals: 8,
    priceMint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    fixedPrice: 62000,
  },
  ETH: {
    mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    decimals: 8,
    priceMint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    fixedPrice: 3500,
  },
};

const FIXED_PRICES: Record<string, number> = {};
for (const [symbol, token] of Object.entries(TOKENS)) {
  if (token.fixedPrice !== undefined) {
    FIXED_PRICES[symbol] = token.fixedPrice;
  }
}

async function getPriceInUSDT(asset: string): Promise<number | null> {
  const token = TOKENS[asset];
  if (!token) return null;
  
  if (token.fixedPrice !== undefined) {
    return token.fixedPrice;
  }

  const jupiterPrice = await getJupiterPrice(token.mint, TOKENS.USDT.mint);
  return jupiterPrice;
}

async function getJupiterPrice(inputMint: string, outputMint: string): Promise<number | null> {
  try {
    const url = `https://price.jup.ag/v6/price?ids=${inputMint}&vsToken=${outputMint}`;
    const response = await fetch(url);
    const data: any = await response.json();
    if (data.data && data.data[inputMint]) {
      return data.data[inputMint].price;
    }
    return null;
  } catch (error) {
    console.error('Jupiter price error:', error);
    return null;
  }
}

async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<any | null> {
  try {
    const inputDecimals = TOKENS[Object.keys(TOKENS).find(k => TOKENS[k].mint === inputMint) || 'USDT']?.decimals || 6;
    const amountRaw = Math.floor(amount * Math.pow(10, inputDecimals));

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountRaw}&slippageBps=${slippageBps}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Jupiter quote error:', error);
    return null;
  }
}

router.get('/price/:pair', async (req: AuthRequest, res: Response) => {
  try {
    const { pair } = req.params;
    const pairStr = Array.isArray(pair) ? pair[0] : pair;
    const [baseAsset, quoteAsset] = pairStr.split('_');

    const baseToken = TOKENS[baseAsset];
    const quoteToken = TOKENS[quoteAsset];

    if (!baseToken || !quoteToken) {
      res.status(400).json({ error: 'Unsupported pair' });
      return;
    }

    const price = await getJupiterPrice(baseToken.mint, quoteToken.mint);

    if (price === null) {
      res.status(500).json({ error: 'Failed to get price' });
      return;
    }

    res.json({ pair, price });
  } catch (error) {
    console.error('Price error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { inputAsset, outputAsset, amount, slippage } = req.body;

    if (!inputAsset || !outputAsset || !amount) {
      res.status(400).json({ error: 'inputAsset, outputAsset, and amount are required' });
      return;
    }

    const inputToken = TOKENS[inputAsset];
    const outputToken = TOKENS[outputAsset];

    if (!inputToken || !outputToken) {
      res.status(400).json({ error: 'Unsupported asset' });
      return;
    }

    let outAmount = 0;
    let price = 0;
    let fee = 0;
    let priceSource = 'internal';

    const inputPriceFixed = inputToken.fixedPrice;
    const outputPriceFixed = outputToken.fixedPrice;

    if (inputPriceFixed !== undefined && outputPriceFixed !== undefined && outputPriceFixed > 0) {
      price = inputPriceFixed / outputPriceFixed;
      outAmount = amount * price;
      fee = amount * 0.001;
      priceSource = 'internal';
      console.log(`[Quote] Using internal price: ${inputAsset} -> ${outputAsset}, price=${price}`);
    } else {
      const quote = await getJupiterQuote(
        inputToken.mint,
        outputToken.mint,
        amount,
        slippage || 50
      ).catch(() => null);

      if (quote && quote.outAmount) {
        const outDecimals = outputToken.decimals;
        outAmount = Number(quote.outAmount) / Math.pow(10, outDecimals);
        price = outAmount / amount;
        fee = Number(quote.routePlan?.[0]?.swapInfo?.feeAmount || 0) / 1e9;
        priceSource = 'jupiter';
        console.log(`[Quote] Using Jupiter price: ${inputAsset} -> ${outputAsset}, price=${price}`);
      } else {
        const inputPrice = await getPriceInUSDT(inputAsset);
        const outputPrice = await getPriceInUSDT(outputAsset);
        
        if (inputPrice !== null && outputPrice !== null && outputPrice > 0) {
          price = inputPrice / outputPrice;
          outAmount = amount * price;
          fee = amount * 0.001;
          priceSource = 'fallback';
          console.log(`[Quote] Using fallback price: ${inputAsset} -> ${outputAsset}, price=${price}`);
        }
      }
    }

    if (outAmount <= 0 || price <= 0) {
      console.error(`[Quote] Failed to get quote for ${inputAsset} -> ${outputAsset}, amount=${amount}`);
      res.status(500).json({ error: 'Failed to get quote' });
      return;
    }

    res.json({
      inputAsset,
      outputAsset,
      inputAmount: amount,
      outputAmount: outAmount,
      price,
      slippage: (slippage || 50) / 100,
      fee,
      priceSource,
    });
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/swap', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { inputAsset, outputAsset, amount, slippage } = req.body;

    if (!inputAsset || !outputAsset || !amount) {
      res.status(400).json({ error: 'inputAsset, outputAsset, and amount are required' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    const inputToken = TOKENS[inputAsset];
    const outputToken = TOKENS[outputAsset];

    if (!inputToken || !outputToken) {
      res.status(400).json({ error: 'Unsupported asset' });
      return;
    }

    const userId = req.user!.id;
    const now = Date.now();

    const balance = db
      .prepare('SELECT free FROM balances WHERE user_id = ? AND asset = ?')
      .get(userId, inputAsset) as any;

    if (!balance || balance.free < amount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    let outAmount = 0;
    let price = 0;

    const inputPriceFixed = inputToken.fixedPrice;
    const outputPriceFixed = outputToken.fixedPrice;

    if (inputPriceFixed !== undefined && outputPriceFixed !== undefined && outputPriceFixed > 0) {
      price = inputPriceFixed / outputPriceFixed;
      outAmount = amount * price;
      console.log(`[Swap] Using internal price: ${inputAsset} -> ${outputAsset}, price=${price}`);
    } else {
      const quote = await getJupiterQuote(
        inputToken.mint,
        outputToken.mint,
        amount,
        slippage || 50
      ).catch(() => null);

      if (quote && quote.outAmount) {
        const outDecimals = outputToken.decimals;
        outAmount = Number(quote.outAmount) / Math.pow(10, outDecimals);
        price = outAmount / amount;
        console.log(`[Swap] Using Jupiter price: ${inputAsset} -> ${outputAsset}, price=${price}`);
      } else {
        const inputPrice = await getPriceInUSDT(inputAsset);
        const outputPrice = await getPriceInUSDT(outputAsset);
        
        if (inputPrice !== null && outputPrice !== null && outputPrice > 0) {
          price = inputPrice / outputPrice;
          outAmount = amount * price;
          console.log(`[Swap] Using fallback price: ${inputAsset} -> ${outputAsset}, price=${price}`);
        }
      }
    }

    if (outAmount <= 0 || price <= 0) {
      res.status(500).json({ error: 'Failed to get quote' });
      return;
    }
    const symbol = `${inputAsset}_${outputAsset}`;

    db.prepare('UPDATE balances SET free = free - ?, total = total - ?, updated_at = ? WHERE user_id = ? AND asset = ?')
      .run(amount, amount, now, userId, inputAsset);

    db.prepare('UPDATE balances SET free = free + ?, total = total + ?, updated_at = ? WHERE user_id = ? AND asset = ?')
      .run(outAmount, outAmount, now, userId, outputAsset);

    const result = db.prepare(
      'INSERT INTO orders (user_id, symbol, side, type, price, amount, filled_amount, total, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      userId,
      symbol,
      'buy',
      'market',
      price,
      amount,
      outAmount,
      outAmount,
      'filled',
      now,
      now
    );

    res.json({
      success: true,
      orderId: result.lastInsertRowid,
      inputAsset,
      outputAsset,
      inputAmount: amount,
      outputAmount: outAmount,
      price,
      status: 'filled',
    });
  } catch (error) {
    console.error('Swap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const orders = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
      .all(req.user!.id);
    res.json({ orders });
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
