import { Router, Response } from 'express';
import db from '../database';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import {
  getHotWallet,
  getSolBalance,
  getTokenBalance,
  transferToken,
  transferSOL,
  getConnection,
} from '../services/solanaService';

const router = Router();

const TOKENS: Record<string, { mint: string; decimals: number }> = {
  SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  USDT: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  RS: { mint: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk', decimals: 9 },
  BTC: { mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', decimals: 8 },
  ETH: { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', decimals: 8 },
};

router.get('/hotwallet', async (req: AuthRequest, res: Response) => {
  try {
    const hotWallet = getHotWallet();
    if (!hotWallet) {
      res.status(500).json({ error: 'Hot wallet not configured' });
      return;
    }

    const solBalance = await getSolBalance(hotWallet.publicKey);
    
    const tokenBalances: Record<string, number> = {};
    for (const [symbol, token] of Object.entries(TOKENS)) {
      if (symbol !== 'SOL') {
        tokenBalances[symbol] = await getTokenBalance(hotWallet.publicKey, token.mint);
      }
    }

    res.json({
      address: hotWallet.publicKey,
      balances: {
        SOL: solBalance,
        ...tokenBalances,
      },
    });
  } catch (error) {
    console.error('Hot wallet status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/balances', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const balances = db
      .prepare('SELECT asset, free, locked, total FROM balances WHERE user_id = ?')
      .all(req.user!.id);

    res.json({ balances });
  } catch (error) {
    console.error('Balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/deposit-address', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const hotWallet = getHotWallet();
    if (!hotWallet) {
      res.status(500).json({ error: 'Hot wallet not configured' });
      return;
    }

    res.json({
      address: hotWallet.publicKey,
      chain: 'solana',
    });
  } catch (error) {
    console.error('Deposit address error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/hotwallet/info', async (req: AuthRequest, res: Response) => {
  try {
    const hotWallet = getHotWallet();
    if (!hotWallet) {
      res.status(500).json({ error: 'Hot wallet not configured' });
      return;
    }

    const tokenList: Record<string, { mint: string; decimals: number; ata?: string }> = {};
    for (const [symbol, token] of Object.entries(TOKENS)) {
      tokenList[symbol] = { ...token };
    }

    res.json({
      address: hotWallet.publicKey,
      chain: 'solana',
      tokens: tokenList,
    });
  } catch (error) {
    console.error('Hot wallet info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/deposit/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { txId, asset } = req.body;

    if (!txId || !asset) {
      res.status(400).json({ error: 'txId and asset are required' });
      return;
    }

    const token = TOKENS[asset];
    if (!token) {
      res.status(400).json({ error: 'Unsupported asset' });
      return;
    }

    const hotWallet = getHotWallet();
    if (!hotWallet) {
      res.status(500).json({ error: 'Hot wallet not configured' });
      return;
    }

    console.log(`[Deposit Verify] txId: ${txId}, asset: ${asset}, hotWallet: ${hotWallet.publicKey}`);

    const existingDeposit = db.prepare('SELECT id FROM deposits WHERE tx_id = ?').get(txId);
    if (existingDeposit) {
      res.status(400).json({ error: '该交易已被处理过' });
      return;
    }

    let amount = 0;
    let fromAddress = '';
    let debugInfo: any = {};

    try {
      const conn = getConnection();
      const tx = await conn.getTransaction(txId, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });

      if (!tx) {
        debugInfo.rpcError = 'Transaction not found on RPC node';
        console.warn('[Deposit Verify] Transaction not found via RPC');
      } else if (!tx.meta) {
        debugInfo.rpcError = 'Transaction meta not found';
        console.warn('[Deposit Verify] Transaction meta not found');
      } else {
        debugInfo.txFound = true;
        debugInfo.postTokenBalancesCount = tx.meta.postTokenBalances?.length || 0;
        debugInfo.preTokenBalancesCount = tx.meta.preTokenBalances?.length || 0;

        const hotWalletPubkey = hotWallet.publicKey;

        if (tx.meta.postTokenBalances && tx.meta.preTokenBalances) {
          for (const postBal of tx.meta.postTokenBalances) {
            console.log(`[Deposit Verify] postBal: mint=${postBal.mint}, owner=${postBal.owner}, amount=${postBal.uiTokenAmount.uiAmount}`);
            
            if (postBal.mint === token.mint && postBal.owner === hotWalletPubkey) {
              const preBal = tx.meta.preTokenBalances.find(
                (b: any) => b.mint === token.mint && b.owner === hotWalletPubkey
              );
              const preAmount = preBal ? Number(preBal.uiTokenAmount.amount) : 0;
              const postAmount = Number(postBal.uiTokenAmount.amount);
              const diff = postAmount - preAmount;
              if (diff > 0) {
                amount = diff / Math.pow(10, postBal.uiTokenAmount.decimals || token.decimals);
                console.log(`[Deposit Verify] Found deposit: ${amount} ${asset}`);
              }
            }
          }
        }

        if (amount <= 0 && tx.meta.postTokenBalances) {
          const relevantBalances = tx.meta.postTokenBalances.filter(
            (b: any) => b.mint === token.mint
          );
          debugInfo.relevantTokenBalances = relevantBalances.map((b: any) => ({
            owner: b.owner,
            amount: b.uiTokenAmount.uiAmount,
          }));
          
          const hotWalletInvolved = tx.meta.postTokenBalances.some(
            (b: any) => b.owner === hotWalletPubkey
          );
          debugInfo.hotWalletInvolved = hotWalletInvolved;
        }

        if (amount > 0 && tx.transaction && tx.transaction.message) {
          const accountKeys = tx.transaction.message.getAccountKeys();
          if (accountKeys && accountKeys.length > 0) {
            fromAddress = accountKeys[0].toBase58();
          }
        }
      }
    } catch (rpcError: any) {
      console.warn('RPC verification failed:', rpcError.message);
      debugInfo.rpcError = rpcError.message;
      
      try {
        const tx: any = await fetch(`https://api.solana.fm/v0/transfers/${txId}`)
          .then(r => r.json())
          .catch(() => null);

        if (tx && tx.status === 'success' && tx.data) {
          debugInfo.solanaFmSuccess = true;
          debugInfo.solanaFmTransfers = tx.data.length;
          
          for (const transfer of tx.data) {
            console.log(`[Deposit Verify] solana.fm transfer: from=${transfer.from}, to=${transfer.to}, mint=${transfer.token_mint}, amount=${transfer.amount}`);
            
            if (transfer.to === hotWallet.publicKey && transfer.token_mint === token.mint) {
              amount += Number(transfer.amount) / Math.pow(10, token.decimals);
              fromAddress = transfer.from;
            }
          }
        } else {
          debugInfo.solanaFmError = 'Failed to fetch from solana.fm';
        }
      } catch (fmError) {
        console.warn('solana.fm verification failed:', fmError);
        debugInfo.solanaFmError = String(fmError);
      }
    }

    if (amount <= 0) {
      let errorMsg = '未找到有效的充值转账。';
      errorMsg += `\n\n请检查：`;
      errorMsg += `\n1. 交易哈希是否正确`;
      errorMsg += `\n2. 充值地址是否为：${hotWallet.publicKey}`;
      errorMsg += `\n3. 转账的代币是否为 ${asset} (${token.mint})`;
      errorMsg += `\n4. 交易是否已在链上确认（请等待约30秒后重试）`;
      
      if (debugInfo.hotWalletInvolved === false) {
        errorMsg += `\n\n⚠️ 提示：该交易未涉及当前热钱包地址，请确认您转账的地址是否正确。`;
      }
      
      res.status(400).json({ 
        error: errorMsg,
        debug: debugInfo,
        hotWalletAddress: hotWallet.publicKey,
      });
      return;
    }

    const now = Date.now();
    const userId = req.user!.id;

    const result = db
      .prepare(
        'INSERT INTO deposits (user_id, asset, amount, tx_id, from_address, to_address, status, confirmations, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(userId, asset, amount, txId, fromAddress, hotWallet.publicKey, 'confirmed', 32, now, now);

    const updateBalance = db.prepare(
      'UPDATE balances SET free = free + ?, total = total + ?, updated_at = ? WHERE user_id = ? AND asset = ?'
    );
    updateBalance.run(amount, amount, now, userId, asset);

    console.log(`[Deposit Verify] Success: ${amount} ${asset} deposited for user ${userId}`);

    res.json({
      success: true,
      depositId: result.lastInsertRowid,
      amount,
      asset,
      status: 'confirmed',
    });
  } catch (error) {
    console.error('Deposit verify error:', error);
    res.status(500).json({ error: '验证失败，请稍后重试' });
  }
});

router.post('/withdraw', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { asset, amount, toAddress } = req.body;

    if (!asset || !amount || !toAddress) {
      res.status(400).json({ error: 'asset, amount, and toAddress are required' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    const token = TOKENS[asset];
    if (!token) {
      res.status(400).json({ error: 'Unsupported asset' });
      return;
    }

    const userId = req.user!.id;
    const now = Date.now();
    const fee = asset === 'SOL' ? 0.0001 : 0.1;
    const totalDeduction = amount + fee;

    const balance = db
      .prepare('SELECT free FROM balances WHERE user_id = ? AND asset = ?')
      .get(userId, asset) as any;

    if (!balance || balance.free < totalDeduction) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    const hotWallet = getHotWallet();
    if (!hotWallet) {
      res.status(500).json({ error: 'Hot wallet not configured' });
      return;
    }

    let txId = '';

    try {
      if (asset === 'SOL') {
        txId = await transferSOL(hotWallet.privateKey, toAddress, amount);
      } else {
        txId = await transferToken(hotWallet.privateKey, toAddress, token.mint, amount);
      }
    } catch (txError: any) {
      console.error('Withdraw transaction failed:', txError);
      res.status(500).json({ error: 'Transaction failed: ' + txError.message });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO withdrawals (user_id, asset, amount, fee, to_address, tx_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(userId, asset, amount, fee, toAddress, txId, 'completed', now, now);

    const updateBalance = db.prepare(
      'UPDATE balances SET free = free - ?, total = total - ?, updated_at = ? WHERE user_id = ? AND asset = ?'
    );
    updateBalance.run(totalDeduction, totalDeduction, now, userId, asset);

    res.json({
      success: true,
      withdrawalId: result.lastInsertRowid,
      amount,
      fee,
      asset,
      txId,
      status: 'completed',
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/deposits', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const deposits = db
      .prepare('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
      .all(req.user!.id);
    res.json({ deposits });
  } catch (error) {
    console.error('Deposits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/withdrawals', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const withdrawals = db
      .prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
      .all(req.user!.id);
    res.json({ withdrawals });
  } catch (error) {
    console.error('Withdrawals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
