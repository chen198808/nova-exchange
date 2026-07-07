import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import bs58 from 'bs58';

const JWT_SECRET = process.env.JWT_SECRET || 'novaexchange_jwt_secret_key_change_in_production';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  depositAddress: string;
  privateKey: string;
  createdAt: number;
}

interface Balance {
  id: number;
  userId: number;
  asset: string;
  free: number;
  locked: number;
  total: number;
  updatedAt: number;
}

interface Order {
  id: number;
  userId: number;
  symbol: string;
  side: string;
  type: string;
  price: number;
  amount: number;
  filledAmount: number;
  total: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

interface Deposit {
  id: number;
  userId: number;
  asset: string;
  amount: number;
  txId: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  confirmations: number;
  createdAt: number;
  updatedAt: number;
}

interface Withdrawal {
  id: number;
  userId: number;
  asset: string;
  amount: number;
  fee: number;
  toAddress: string;
  txId: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

const data = {
  users: [] as User[],
  balances: [] as Balance[],
  orders: [] as Order[],
  deposits: [] as Deposit[],
  withdrawals: [] as Withdrawal[],
  nextUserId: 1,
  nextBalanceId: 1,
  nextOrderId: 1,
  nextDepositId: 1,
  nextWithdrawalId: 1,
};

const DEFAULT_ASSETS = ['USDT', 'RS', 'SOL', 'BTC', 'ETH'];

function generateWallet() {
  const keypair = {
    publicKey: bs58.encode(Buffer.from(crypto.getRandomValues(new Uint8Array(32)))),
    privateKey: bs58.encode(Buffer.from(crypto.getRandomValues(new Uint8Array(64)))),
  };
  return keypair;
}

export function registerUser(username: string, password: string, email?: string) {
  const existingUser = data.users.find(u => u.username === username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const wallet = generateWallet();

  const user: User = {
    id: data.nextUserId++,
    username,
    email: email || '',
    password: hashedPassword,
    depositAddress: wallet.publicKey,
    privateKey: wallet.privateKey,
    createdAt: Date.now(),
  };

  data.users.push(user);

  DEFAULT_ASSETS.forEach(asset => {
    const initialBalance = asset === 'USDT' ? 10000 : asset === 'RS' ? 1000 : 0;
    data.balances.push({
      id: data.nextBalanceId++,
      userId: user.id,
      asset,
      free: initialBalance,
      locked: 0,
      total: initialBalance,
      updatedAt: Date.now(),
    });
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      depositAddress: user.depositAddress,
    },
    token: generateToken(user.id),
  };
}

export function loginUser(username: string, password: string) {
  const user = data.users.find(u => u.username === username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    throw new Error('Invalid username or password');
  }

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      depositAddress: user.depositAddress,
    },
    token: generateToken(user.id),
  };
}

function generateToken(userId: number) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' } as any);
}

export function verifyToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

export function getUserById(userId: number) {
  return data.users.find(u => u.id === userId);
}

export function getBalances(userId: number) {
  return data.balances
    .filter(b => b.userId === userId)
    .map(b => ({
      asset: b.asset,
      free: b.free,
      locked: b.locked,
      total: b.total,
    }));
}

export function getDepositAddress(userId: number) {
  const user = data.users.find(u => u.id === userId);
  return user?.depositAddress || '';
}

export function getDeposits(userId: number) {
  return data.deposits.filter(d => d.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}

export function getWithdrawals(userId: number) {
  return data.withdrawals.filter(w => w.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}

export function verifyDeposit(userId: number, txId: string, asset: string) {
  const existing = data.deposits.find(d => d.txId === txId);
  if (existing) {
    throw new Error('Transaction already processed');
  }

  const amount = Math.random() * 100 + 10;
  const user = data.users.find(u => u.id === userId);

  const deposit: Deposit = {
    id: data.nextDepositId++,
    userId,
    asset,
    amount,
    txId,
    fromAddress: '',
    toAddress: user?.depositAddress || '',
    status: 'confirmed',
    confirmations: 32,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  data.deposits.push(deposit);

  const balance = data.balances.find(b => b.userId === userId && b.asset === asset);
  if (balance) {
    balance.free += amount;
    balance.total += amount;
    balance.updatedAt = Date.now();
  } else {
    data.balances.push({
      id: data.nextBalanceId++,
      userId,
      asset,
      free: amount,
      locked: 0,
      total: amount,
      updatedAt: Date.now(),
    });
  }

  return deposit;
}

export function withdraw(userId: number, asset: string, amount: number, toAddress: string) {
  const balance = data.balances.find(b => b.userId === userId && b.asset === asset);
  const fee = asset === 'SOL' ? 0.0001 : 0.1;
  const totalDeduction = amount + fee;

  if (!balance || balance.free < totalDeduction) {
    throw new Error('Insufficient balance');
  }

  balance.free -= totalDeduction;
  balance.total -= totalDeduction;
  balance.updatedAt = Date.now();

  const withdrawal: Withdrawal = {
    id: data.nextWithdrawalId++,
    userId,
    asset,
    amount,
    fee,
    toAddress,
    txId: 'tx_' + Date.now(),
    status: 'completed',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  data.withdrawals.push(withdrawal);

  return withdrawal;
}

export function swap(userId: number, inputAsset: string, outputAsset: string, amount: number, price: number) {
  const inputBalance = data.balances.find(b => b.userId === userId && b.asset === inputAsset);
  if (!inputBalance || inputBalance.free < amount) {
    throw new Error('Insufficient balance');
  }

  const outAmount = amount * price;
  const now = Date.now();

  inputBalance.free -= amount;
  inputBalance.total -= amount;
  inputBalance.updatedAt = now;

  const outputBalance = data.balances.find(b => b.userId === userId && b.asset === outputAsset);
  if (outputBalance) {
    outputBalance.free += outAmount;
    outputBalance.total += outAmount;
    outputBalance.updatedAt = now;
  } else {
    data.balances.push({
      id: data.nextBalanceId++,
      userId,
      asset: outputAsset,
      free: outAmount,
      locked: 0,
      total: outAmount,
      updatedAt: now,
    });
  }

  const order: Order = {
    id: data.nextOrderId++,
    userId,
    symbol: `${inputAsset}_${outputAsset}`,
    side: 'sell',
    type: 'market',
    price,
    amount,
    filledAmount: outAmount,
    total: outAmount,
    status: 'filled',
    createdAt: now,
    updatedAt: now,
  };

  data.orders.push(order);

  return {
    orderId: order.id,
    inputAsset,
    outputAsset,
    inputAmount: amount,
    outputAmount: outAmount,
    price,
    status: 'filled',
  };
}

export function getOrders(userId: number) {
  return data.orders.filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}
