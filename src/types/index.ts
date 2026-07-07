export interface Coin {
  symbol: string
  name: string
  icon: string
  price: number
  change24h: number
  volume24h?: number
  marketCap?: number
  contractAddress?: string
  chain?: string
  precision?: number
}

export interface TradingPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  lastPrice: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
  quoteVolume24h: number
  pricePrecision: number
  amountPrecision: number
  minAmount?: number
  minTotal?: number
}

export interface FuturesPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  lastPrice: number
  markPrice: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
  quoteVolume24h: number
  openInterest: number
  fundingRate: number
  nextFundingTime: number
  pricePrecision: number
  amountPrecision: number
  minAmount?: number
  maxLeverage: number
}

export interface OrderBookEntry {
  price: number
  amount: number
  total: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  timestamp: number
}

export interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface AccountBalance {
  asset: string
  free: number
  locked: number
  total: number
}

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'pending' | 'filled' | 'partial' | 'cancelled'

export interface Order {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  price: number
  amount: number
  filledAmount: number
  total: number
  status: OrderStatus
  timestamp: number
}

export interface Position {
  symbol: string
  side: 'long' | 'short'
  amount: number
  entryPrice: number
  markPrice: number
  leverage: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  margin: number
  liquidationPrice: number
  timestamp: number
}

export interface Trade {
  id: string
  symbol: string
  price: number
  amount: number
  side: 'buy' | 'sell'
  timestamp: number
}

export type RecordStatus = 'pending' | 'completed' | 'failed' | 'confirmed'

export interface DepositRecord {
  id: string
  asset: string
  amount: number
  address: string
  txId?: string
  status: RecordStatus
  confirmations?: number
  timestamp: number
}

export interface WithdrawRecord {
  id: string
  asset: string
  amount: number
  address: string
  fee: number
  txId?: string
  status: RecordStatus
  timestamp: number
}

export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  phone?: string
  kycLevel?: number
  vipLevel?: number
  registeredAt: number
}

export interface SecuritySettings {
  loginPasswordSet: boolean
  fundPasswordSet: boolean
  twoFAEnabled: boolean
  antiPhishingCodeSet: boolean
  whitelistEnabled: boolean
  largeWithdrawalReview: boolean
  withdrawalSmsVerify: boolean
  withdrawalEmailVerify: boolean
}

export interface LoginDevice {
  id: string
  device: string
  location: string
  ip: string
  lastLogin: number
  isCurrent: boolean
}

export type AlertType = 'login' | 'withdraw' | 'password' | 'security' | 'system'
export type AlertStatus = 'warning' | 'success' | 'info' | 'danger'

export interface RiskAlert {
  id: string
  type: AlertType
  title: string
  description: string
  status: AlertStatus
  timestamp: number
}

export interface SecurityTip {
  id: string
  question: string
  answer: string
}
