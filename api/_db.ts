import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import bs58 from 'bs58';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'novaexchange_jwt_secret_key_change_in_production';
const DATA_FILE = path.join('/tmp', 'exchange-data.json');
const HOT_WALLET_PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY || '';

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

interface AppData {
  users: User[];
  balances: Balance[];
  orders: Order[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  nextUserId: number;
  nextBalanceId: number;
  nextOrderId: number;
  nextDepositId: number;
  nextWithdrawalId: number;
}

let data: AppData = {
  users: [],
  balances: [],
  orders: [],
  deposits: [],
  withdrawals: [],
  nextUserId: 1,
  nextBalanceId: 1,
  nextOrderId: 1,
  nextDepositId: 1,
  nextWithdrawalId: 1,
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      data = { ...data, ...parsed };
    }
  } catch (error) {
    console.error('Load data error:', error);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Save data error:', error);
  }
}

loadData();

const DEFAULT_ASSETS = ['USDT', 'RS', 'SOL', 'BTC', 'ETH'];

function generateWallet() {
  const publicKeyBytes = crypto.randomBytes(32);
  const privateKeyBytes = crypto.randomBytes(64);
  
  const keypair = {
    publicKey: bs58.encode(publicKeyBytes),
    privateKey: bs58.encode(privateKeyBytes),
  };
  return keypair;
}

export function getHotWalletInfo() {
  if (!HOT_WALLET_PRIVATE_KEY) {
    return null;
  }
  try {
    const secretKey = bs58.decode(HOT_WALLET_PRIVATE_KEY);
    const publicKey = bs58.encode(secretKey.slice(0, 32));
    return {
      publicKey,
      privateKey: HOT_WALLET_PRIVATE_KEY,
    };
  } catch {
    return null;
  }
}

export function registerUser(username: string, password: string, email?: string) {
  loadData();

  const existingUser = data.users.find(u => u.username === username);
  if (existingUser) {
    throw new Error('用户名已存在，请直接登录');
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

  saveData();

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
  loadData();

  const user = data.users.find(u => u.username === username);
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    throw new Error('用户名或密码错误');
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
  loadData();
  return data.users.find(u => u.id === userId);
}

export function getBalances(userId: number) {
  loadData();
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
  loadData();
  const user = data.users.find(u => u.id === userId);
  return user?.depositAddress || '';
}

export function getDeposits(userId: number) {
  loadData();
  return data.deposits.filter(d => d.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}

export function getWithdrawals(userId: number) {
  loadData();
  return data.withdrawals.filter(w => w.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}

export function verifyDeposit(userId: number, txId: string, asset: string) {
  loadData();

  const existing = data.deposits.find(d => d.txId === txId);
  if (existing) {
    throw new Error('该交易已处理');
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

  saveData();

  return deposit;
}

export function withdraw(userId: number, asset: string, amount: number, toAddress: string) {
  loadData();

  const balance = data.balances.find(b => b.userId === userId && b.asset === asset);
  const fee = asset === 'SOL' ? 0.0001 : 0.1;
  const totalDeduction = amount + fee;

  if (!balance || balance.free < totalDeduction) {
    throw new Error('余额不足');
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

  saveData();

  return withdrawal;
}

export function swap(userId: number, inputAsset: string, outputAsset: string, amount: number, price: number) {
  loadData();

  const inputBalance = data.balances.find(b => b.userId === userId && b.asset === inputAsset);
  if (!inputBalance || inputBalance.free < amount) {
    throw new Error('余额不足');
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

  saveData();

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
  loadData();
  return data.orders.filter(o => o.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}
