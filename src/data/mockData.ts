import type { Coin, TradingPair, FuturesPair, OrderBook, AccountBalance, KlineData, Order, Position, DepositRecord, WithdrawRecord, User, Trade, SecuritySettings, LoginDevice, RiskAlert, SecurityTip } from '@/types'

export const coins: Coin[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    price: 67500,
    change24h: 2.35,
    volume24h: 28500000000,
    marketCap: 1320000000000,
    precision: 8,
    contractAddress: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    chain: 'solana'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    price: 3520,
    change24h: -1.25,
    volume24h: 12800000000,
    marketCap: 423000000000,
    precision: 8,
    contractAddress: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    chain: 'solana'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    price: 168.5,
    change24h: 5.67,
    volume24h: 3200000000,
    marketCap: 78000000000,
    precision: 6,
    contractAddress: 'So11111111111111111111111111111111111111112',
    chain: 'solana'
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    icon: '🔶',
    price: 598,
    change24h: 0.85,
    volume24h: 1800000000,
    marketCap: 89000000000,
    precision: 8
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    icon: '✕',
    price: 0.5234,
    change24h: -2.15,
    volume24h: 1200000000,
    marketCap: 29000000000,
    precision: 6
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    icon: '₳',
    price: 0.4567,
    change24h: 1.23,
    volume24h: 450000000,
    marketCap: 16000000000,
    precision: 6
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    icon: '🐕',
    price: 0.1234,
    change24h: 8.45,
    volume24h: 890000000,
    marketCap: 17500000000,
    precision: 6
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    icon: '●',
    price: 7.85,
    change24h: -0.56,
    volume24h: 280000000,
    marketCap: 10500000000,
    precision: 6
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    icon: '🔺',
    price: 35.6,
    change24h: 3.21,
    volume24h: 520000000,
    marketCap: 13800000000,
    precision: 6
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    icon: '⬡',
    price: 0.6789,
    change24h: -1.89,
    volume24h: 380000000,
    marketCap: 6700000000,
    precision: 6
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    icon: '⬡',
    price: 14.56,
    change24h: 2.78,
    volume24h: 420000000,
    marketCap: 8500000000,
    precision: 6
  },
  {
    symbol: 'ATOM',
    name: 'Cosmos',
    icon: '⚛',
    price: 8.23,
    change24h: -0.34,
    volume24h: 180000000,
    marketCap: 3200000000,
    precision: 6
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    icon: 'Ł',
    price: 78.5,
    change24h: 1.56,
    volume24h: 520000000,
    marketCap: 5800000000,
    precision: 8
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    icon: '🦄',
    price: 12.34,
    change24h: 4.32,
    volume24h: 280000000,
    marketCap: 7400000000,
    precision: 6
  },
  {
    symbol: 'RS',
    name: 'RuneStone',
    icon: '💎',
    price: 0.05226,
    change24h: 0,
    contractAddress: 'GAswtBAGV5NybYWN7YX9aTuJNkps4uft4Qjb4N31bonk',
    chain: 'solana',
    volume24h: 2261.09,
    marketCap: 2261090,
    precision: 8
  }
]

export const tradingPairs: TradingPair[] = [
  {
    symbol: 'BTC_USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    lastPrice: 67500,
    change24h: 2.35,
    high24h: 68200,
    low24h: 65800,
    volume24h: 42300.5,
    quoteVolume24h: 2850000000,
    pricePrecision: 2,
    amountPrecision: 6,
    minAmount: 0.0001,
    minTotal: 10
  },
  {
    symbol: 'ETH_USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    lastPrice: 3520,
    change24h: -1.25,
    high24h: 3580,
    low24h: 3460,
    volume24h: 364000,
    quoteVolume24h: 1280000000,
    pricePrecision: 2,
    amountPrecision: 5,
    minAmount: 0.001,
    minTotal: 10
  },
  {
    symbol: 'SOL_USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    lastPrice: 168.5,
    change24h: 5.67,
    high24h: 172.3,
    low24h: 158.9,
    volume24h: 19000000,
    quoteVolume24h: 3200000000,
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.01,
    minTotal: 10
  },
  {
    symbol: 'RS_USDT',
    baseAsset: 'RS',
    quoteAsset: 'USDT',
    lastPrice: 0.05226,
    change24h: 0,
    high24h: 0.055,
    low24h: 0.048,
    volume24h: 43260,
    quoteVolume24h: 2261.09,
    pricePrecision: 8,
    amountPrecision: 2,
    minAmount: 1,
    minTotal: 10
  },
  {
    symbol: 'RS_SOL',
    baseAsset: 'RS',
    quoteAsset: 'SOL',
    lastPrice: 0.00031,
    change24h: 0,
    high24h: 0.00033,
    low24h: 0.00029,
    volume24h: 25600,
    quoteVolume24h: 7.936,
    pricePrecision: 8,
    amountPrecision: 2,
    minAmount: 1,
    minTotal: 0.1
  },
  {
    symbol: 'BNB_USDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    lastPrice: 598,
    change24h: 0.85,
    high24h: 605,
    low24h: 590,
    volume24h: 3000000,
    quoteVolume24h: 1800000000,
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.01,
    minTotal: 10
  },
  {
    symbol: 'XRP_USDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    lastPrice: 0.5234,
    change24h: -2.15,
    high24h: 0.538,
    low24h: 0.512,
    volume24h: 2290000000,
    quoteVolume24h: 1200000000,
    pricePrecision: 4,
    amountPrecision: 2,
    minAmount: 1,
    minTotal: 10
  },
  {
    symbol: 'DOGE_USDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    lastPrice: 0.1234,
    change24h: 8.45,
    high24h: 0.1289,
    low24h: 0.1138,
    volume24h: 7210000000,
    quoteVolume24h: 890000000,
    pricePrecision: 4,
    amountPrecision: 2,
    minAmount: 10,
    minTotal: 10
  },
  {
    symbol: 'ADA_USDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    lastPrice: 0.4567,
    change24h: 1.23,
    high24h: 0.4623,
    low24h: 0.4498,
    volume24h: 985000000,
    quoteVolume24h: 450000000,
    pricePrecision: 4,
    amountPrecision: 2,
    minAmount: 1,
    minTotal: 10
  },
  {
    symbol: 'AVAX_USDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    lastPrice: 35.6,
    change24h: 3.21,
    high24h: 36.8,
    low24h: 34.2,
    volume24h: 14600000,
    quoteVolume24h: 520000000,
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.1,
    minTotal: 10
  },
  {
    symbol: 'LINK_USDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    lastPrice: 14.56,
    change24h: 2.78,
    high24h: 14.98,
    low24h: 14.12,
    volume24h: 28800000,
    quoteVolume24h: 420000000,
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.1,
    minTotal: 10
  }
]

function getNextFundingTime(): number {
  const now = new Date()
  const hours = now.getUTCHours()
  const nextHour = hours < 8 ? 8 : hours < 16 ? 16 : 24
  const next = new Date(now)
  next.setUTCHours(nextHour, 0, 0, 0)
  if (nextHour === 24) {
    next.setUTCDate(next.getUTCDate() + 1)
    next.setUTCHours(0, 0, 0, 0)
  }
  return next.getTime()
}

export const futuresPairs: FuturesPair[] = [
  {
    symbol: 'BTC_USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    lastPrice: 67500,
    markPrice: 67510,
    change24h: 2.35,
    high24h: 68200,
    low24h: 65800,
    volume24h: 42300.5,
    quoteVolume24h: 2850000000,
    openInterest: 125000,
    fundingRate: 0.01,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 2,
    amountPrecision: 6,
    minAmount: 0.0001,
    maxLeverage: 125
  },
  {
    symbol: 'ETH_USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    lastPrice: 3520,
    markPrice: 3521.5,
    change24h: -1.25,
    high24h: 3580,
    low24h: 3460,
    volume24h: 364000,
    quoteVolume24h: 1280000000,
    openInterest: 890000,
    fundingRate: -0.02,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 2,
    amountPrecision: 5,
    minAmount: 0.001,
    maxLeverage: 100
  },
  {
    symbol: 'SOL_USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    lastPrice: 168.5,
    markPrice: 168.55,
    change24h: 5.67,
    high24h: 172.3,
    low24h: 158.9,
    volume24h: 19000000,
    quoteVolume24h: 3200000000,
    openInterest: 5200000,
    fundingRate: 0.03,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.01,
    maxLeverage: 75
  },
  {
    symbol: 'BNB_USDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    lastPrice: 598,
    markPrice: 598.2,
    change24h: 0.85,
    high24h: 605,
    low24h: 590,
    volume24h: 3000000,
    quoteVolume24h: 1800000000,
    openInterest: 2100000,
    fundingRate: 0.005,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.01,
    maxLeverage: 75
  },
  {
    symbol: 'XRP_USDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    lastPrice: 0.5234,
    markPrice: 0.5235,
    change24h: -2.15,
    high24h: 0.538,
    low24h: 0.512,
    volume24h: 2290000000,
    quoteVolume24h: 1200000000,
    openInterest: 85000000,
    fundingRate: -0.015,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 4,
    amountPrecision: 2,
    minAmount: 1,
    maxLeverage: 50
  },
  {
    symbol: 'DOGE_USDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    lastPrice: 0.1234,
    markPrice: 0.1235,
    change24h: 8.45,
    high24h: 0.1289,
    low24h: 0.1138,
    volume24h: 7210000000,
    quoteVolume24h: 890000000,
    openInterest: 120000000,
    fundingRate: 0.05,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 4,
    amountPrecision: 2,
    minAmount: 10,
    maxLeverage: 50
  },
  {
    symbol: 'ADA_USDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    lastPrice: 0.4567,
    markPrice: 0.4568,
    change24h: 1.23,
    high24h: 0.4623,
    low24h: 0.4498,
    volume24h: 985000000,
    quoteVolume24h: 450000000,
    openInterest: 45000000,
    fundingRate: 0.01,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 4,
    amountPrecision: 2,
    minAmount: 1,
    maxLeverage: 50
  },
  {
    symbol: 'AVAX_USDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    lastPrice: 35.6,
    markPrice: 35.62,
    change24h: 3.21,
    high24h: 36.8,
    low24h: 34.2,
    volume24h: 14600000,
    quoteVolume24h: 520000000,
    openInterest: 8900000,
    fundingRate: 0.02,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.1,
    maxLeverage: 75
  },
  {
    symbol: 'LINK_USDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    lastPrice: 14.56,
    markPrice: 14.565,
    change24h: 2.78,
    high24h: 14.98,
    low24h: 14.12,
    volume24h: 28800000,
    quoteVolume24h: 420000000,
    openInterest: 15000000,
    fundingRate: 0.015,
    nextFundingTime: getNextFundingTime(),
    pricePrecision: 2,
    amountPrecision: 4,
    minAmount: 0.1,
    maxLeverage: 75
  }
]

export function generateOrderBook(basePrice: number, pricePrecision: number, depth: number = 20): OrderBook {
  const bids: { price: number; amount: number; total: number }[] = []
  const asks: { price: number; amount: number; total: number }[] = []

  let bidTotal = 0
  let askTotal = 0

  for (let i = 0; i < depth; i++) {
    const bidPrice = Number((basePrice * (1 - (i + 1) * 0.001)).toFixed(pricePrecision))
    const bidAmount = Number((Math.random() * 10 + 0.1).toFixed(4))
    bidTotal += bidPrice * bidAmount
    bids.push({
      price: bidPrice,
      amount: bidAmount,
      total: Number(bidTotal.toFixed(2))
    })

    const askPrice = Number((basePrice * (1 + (i + 1) * 0.001)).toFixed(pricePrecision))
    const askAmount = Number((Math.random() * 10 + 0.1).toFixed(4))
    askTotal += askPrice * askAmount
    asks.push({
      price: askPrice,
      amount: askAmount,
      total: Number(askTotal.toFixed(2))
    })
  }

  return {
    bids,
    asks,
    timestamp: Date.now()
  }
}

export function generateKlineData(
  basePrice: number,
  days: number = 30,
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1d'
): KlineData[] {
  const klines: KlineData[] = []
  const now = Date.now()

  let intervalMs: number
  switch (interval) {
    case '1m':
      intervalMs = 60 * 1000
      break
    case '5m':
      intervalMs = 5 * 60 * 1000
      break
    case '15m':
      intervalMs = 15 * 60 * 1000
      break
    case '1h':
      intervalMs = 60 * 60 * 1000
      break
    case '4h':
      intervalMs = 4 * 60 * 60 * 1000
      break
    case '1d':
    default:
      intervalMs = 24 * 60 * 60 * 1000
      break
  }

  const count = Math.floor((days * 24 * 60 * 60 * 1000) / intervalMs)
  let price = basePrice * 0.8

  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * intervalMs
    const change = (Math.random() - 0.48) * price * 0.03
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5
    const volume = Math.random() * 100000 + 10000

    klines.push({
      time,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume: Number(volume.toFixed(2))
    })

    price = close
  }

  return klines
}

export const initialBalances: AccountBalance[] = [
  { asset: 'USDT', free: 10000, locked: 0, total: 10000 },
  { asset: 'BTC', free: 0.5, locked: 0, total: 0.5 },
  { asset: 'ETH', free: 5, locked: 0, total: 5 },
  { asset: 'SOL', free: 50, locked: 0, total: 50 },
  { asset: 'RS', free: 10000, locked: 0, total: 10000 },
  { asset: 'BNB', free: 2, locked: 0, total: 2 },
  { asset: 'XRP', free: 5000, locked: 0, total: 5000 },
  { asset: 'DOGE', free: 50000, locked: 0, total: 50000 },
  { asset: 'ADA', free: 10000, locked: 0, total: 10000 },
  { asset: 'AVAX', free: 100, locked: 0, total: 100 }
]

export const mockUser: User = {
  id: 'user_001',
  username: 'trader_001',
  email: 'trader@example.com',
  avatar: '👤',
  phone: '138****8888',
  kycLevel: 2,
  vipLevel: 3,
  registeredAt: Date.now() - 365 * 24 * 60 * 60 * 1000
}

export const mockOrders: Order[] = [
  {
    id: 'order_001',
    symbol: 'BTC_USDT',
    side: 'buy',
    type: 'limit',
    price: 66000,
    amount: 0.01,
    filledAmount: 0,
    total: 660,
    status: 'pending',
    timestamp: Date.now() - 3600000
  },
  {
    id: 'order_002',
    symbol: 'ETH_USDT',
    side: 'sell',
    type: 'market',
    price: 3520,
    amount: 0.5,
    filledAmount: 0.5,
    total: 1760,
    status: 'filled',
    timestamp: Date.now() - 7200000
  }
]

export const mockPositions: Position[] = [
  {
    symbol: 'BTC_USDT',
    side: 'long',
    amount: 0.1,
    entryPrice: 65000,
    markPrice: 67500,
    leverage: 10,
    unrealizedPnl: 250,
    unrealizedPnlPercent: 3.85,
    margin: 6500,
    liquidationPrice: 59150,
    timestamp: Date.now() - 86400000
  },
  {
    symbol: 'SOL_USDT',
    side: 'long',
    amount: 50,
    entryPrice: 160,
    markPrice: 168.5,
    leverage: 5,
    unrealizedPnl: 425,
    unrealizedPnlPercent: 5.31,
    margin: 1600,
    liquidationPrice: 131.2,
    timestamp: Date.now() - 172800000
  }
]

export function generateRecentTrades(symbol: string, basePrice: number, count: number = 30): Trade[] {
  const trades: Trade[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const priceChange = (Math.random() - 0.5) * basePrice * 0.002
    const price = Number((basePrice + priceChange).toFixed(4))
    const amount = Number((Math.random() * 5 + 0.01).toFixed(6))
    const side = Math.random() > 0.5 ? 'buy' : 'sell'

    trades.push({
      id: `trade_${symbol}_${now - i * (Math.random() * 5000 + 1000)}`,
      symbol,
      price,
      amount,
      side,
      timestamp: now - i * (Math.random() * 5000 + 1000)
    })
  }

  return trades.sort((a, b) => b.timestamp - a.timestamp)
}

export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: 'long' | 'short',
  maintenanceMarginRate: number = 0.005
): number {
  if (side === 'long') {
    return entryPrice * (1 - 1 / leverage + maintenanceMarginRate)
  } else {
    return entryPrice * (1 + 1 / leverage - maintenanceMarginRate)
  }
}

export const mockDepositRecords: DepositRecord[] = [
  {
    id: 'deposit_001',
    asset: 'USDT',
    amount: 5000,
    address: '0x1234...5678',
    txId: '0xabc123...',
    status: 'completed',
    confirmations: 12,
    timestamp: Date.now() - 7 * 86400000
  },
  {
    id: 'deposit_002',
    asset: 'BTC',
    amount: 0.5,
    address: 'bc1q...',
    txId: 'btc_tx_001',
    status: 'completed',
    confirmations: 6,
    timestamp: Date.now() - 3 * 86400000
  }
]

export const mockWithdrawRecords: WithdrawRecord[] = [
  {
    id: 'withdraw_001',
    asset: 'USDT',
    amount: 1000,
    address: '0xabcd...efgh',
    fee: 1,
    txId: '0xdef456...',
    status: 'completed',
    timestamp: Date.now() - 5 * 86400000
  },
  {
    id: 'withdraw_002',
    asset: 'ETH',
    amount: 0.1,
    address: '0x9876...3210',
    fee: 0.001,
    status: 'pending',
    timestamp: Date.now() - 3600000
  }
]

export const mockSecuritySettings: SecuritySettings = {
  loginPasswordSet: true,
  fundPasswordSet: true,
  twoFAEnabled: true,
  antiPhishingCodeSet: false,
  whitelistEnabled: false,
  largeWithdrawalReview: true,
  withdrawalSmsVerify: true,
  withdrawalEmailVerify: true,
}

export const mockLoginDevices: LoginDevice[] = [
  {
    id: 'device_001',
    device: 'Chrome / macOS',
    location: '上海市',
    ip: '192.168.1.1',
    lastLogin: Date.now(),
    isCurrent: true,
  },
  {
    id: 'device_002',
    device: 'Safari / iPhone',
    location: '北京市',
    ip: '10.0.0.1',
    lastLogin: Date.now() - 86400000,
    isCurrent: false,
  },
  {
    id: 'device_003',
    device: 'Firefox / Windows',
    location: '深圳市',
    ip: '172.16.0.1',
    lastLogin: Date.now() - 3 * 86400000,
    isCurrent: false,
  },
  {
    id: 'device_004',
    device: 'Edge / Windows',
    location: '杭州市',
    ip: '192.168.2.1',
    lastLogin: Date.now() - 7 * 86400000,
    isCurrent: false,
  },
]

export const mockRiskAlerts: RiskAlert[] = [
  {
    id: 'alert_001',
    type: 'login',
    title: '异常登录提醒',
    description: '检测到新设备登录，来自北京市',
    status: 'warning',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'alert_002',
    type: 'withdraw',
    title: '提币申请',
    description: '您申请提币 0.1 ETH 到 0x9876...3210',
    status: 'info',
    timestamp: Date.now() - 7200000,
  },
  {
    id: 'alert_003',
    type: 'password',
    title: '密码修改成功',
    description: '您的登录密码已成功修改',
    status: 'success',
    timestamp: Date.now() - 2 * 86400000,
  },
  {
    id: 'alert_004',
    type: 'security',
    title: '2FA 已开启',
    description: '您已成功开启 Google Authenticator 双重验证',
    status: 'success',
    timestamp: Date.now() - 5 * 86400000,
  },
  {
    id: 'alert_005',
    type: 'system',
    title: '系统安全提醒',
    description: '请定期更换密码，保护账户安全',
    status: 'info',
    timestamp: Date.now() - 10 * 86400000,
  },
]

export const mockSecurityTips: SecurityTip[] = [
  {
    id: 'tip_001',
    question: '如何保护我的账户安全？',
    answer: '建议开启双重验证(2FA)、设置资金密码、启用提币白名单、定期更换密码，并确保不向任何人透露您的密码和验证码。',
  },
  {
    id: 'tip_002',
    question: '什么是防钓鱼码？',
    answer: '防钓鱼码是您设置的专属代码，平台发送的邮件中会包含此代码，可用于验证邮件的真实性，防止钓鱼邮件诈骗。',
  },
  {
    id: 'tip_003',
    question: '提币白名单有什么作用？',
    answer: '开启提币白名单后，只能向白名单内的地址提币，可以有效防止账户被盗后资产被转走的风险。',
  },
  {
    id: 'tip_004',
    question: '大额提币审核是什么？',
    answer: '当提币金额超过设定阈值时，需要人工审核通过后才能到账，为您的资产提供额外的安全保障。',
  },
  {
    id: 'tip_005',
    question: '发现账户异常怎么办？',
    answer: '如发现账户存在异常登录或操作，请立即修改密码、关闭所有设备登录权限，并联系平台客服处理。',
  },
]
