import { create } from 'zustand'
import type { User, AccountBalance, Order, Position, DepositRecord, WithdrawRecord, OrderSide, OrderType, SecuritySettings, LoginDevice, RiskAlert } from '@/types'
import { mockUser, initialBalances, mockOrders, mockPositions, mockDepositRecords, mockWithdrawRecords, calculateLiquidationPrice, mockSecuritySettings, mockLoginDevices, mockRiskAlerts } from '@/data/mockData'

interface UserState {
  user: User | null
  isLoggedIn: boolean
  balances: AccountBalance[]
  orders: Order[]
  positions: Position[]
  depositRecords: DepositRecord[]
  withdrawRecords: WithdrawRecord[]
  securitySettings: SecuritySettings
  loginDevices: LoginDevice[]
  riskAlerts: RiskAlert[]

  login: (username: string, password: string) => boolean
  logout: () => void
  placeOrder: (params: {
    symbol: string
    side: OrderSide
    type: OrderType
    price: number
    amount: number
  }) => Order | null
  cancelOrder: (orderId: string) => boolean
  deposit: (asset: string, amount: number, address: string) => DepositRecord
  withdraw: (asset: string, amount: number, address: string, fee: number) => WithdrawRecord | null
  getBalance: (asset: string) => AccountBalance | undefined
  openPosition: (params: {
    symbol: string
    side: 'long' | 'short'
    amount: number
    entryPrice: number
    leverage: number
  }) => Position | null
  closePosition: (index: number) => boolean
  updatePositions: (markPrices: Record<string, number>) => void
  updateSecuritySetting: (key: keyof SecuritySettings, value: boolean) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  user: mockUser,
  isLoggedIn: true,
  balances: initialBalances,
  orders: mockOrders,
  positions: mockPositions,
  depositRecords: mockDepositRecords,
  withdrawRecords: mockWithdrawRecords,
  securitySettings: mockSecuritySettings,
  loginDevices: mockLoginDevices,
  riskAlerts: mockRiskAlerts,

  login: (username: string, _password: string) => {
    const user: User = {
      id: 'user_' + Date.now(),
      username,
      email: `${username}@example.com`,
      avatar: '👤',
      kycLevel: 1,
      vipLevel: 1,
      registeredAt: Date.now()
    }
    set({
      user,
      isLoggedIn: true
    })
    return true
  },

  logout: () => {
    set({
      user: null,
      isLoggedIn: false
    })
  },

  placeOrder: ({ symbol, side, type, price, amount }) => {
    const state = get()
    if (!state.isLoggedIn) return null

    const [baseAsset, quoteAsset] = symbol.split('_')
    const total = price * amount

    if (side === 'buy') {
      const quoteBalance = state.balances.find(b => b.asset === quoteAsset)
      if (!quoteBalance || quoteBalance.free < total) return null

      const updatedBalances = state.balances.map(b => {
        if (b.asset === quoteAsset) {
          return {
            ...b,
            free: b.free - total,
            locked: b.locked + total,
            total: b.total
          }
        }
        return b
      })

      const order: Order = {
        id: 'order_' + Date.now(),
        symbol,
        side,
        type,
        price,
        amount,
        filledAmount: type === 'market' ? amount : 0,
        total,
        status: type === 'market' ? 'filled' : 'pending',
        timestamp: Date.now()
      }

      let finalBalances = updatedBalances
      if (type === 'market') {
        finalBalances = updatedBalances.map(b => {
          if (b.asset === quoteAsset) {
            return {
              ...b,
              locked: b.locked - total,
              total: b.total - total
            }
          }
          if (b.asset === baseAsset) {
            return {
              ...b,
              free: b.free + amount,
              total: b.total + amount
            }
          }
          return b
        })
      }

      set({
        balances: finalBalances,
        orders: [order, ...state.orders]
      })

      return order
    } else {
      const baseBalance = state.balances.find(b => b.asset === baseAsset)
      if (!baseBalance || baseBalance.free < amount) return null

      const updatedBalances = state.balances.map(b => {
        if (b.asset === baseAsset) {
          return {
            ...b,
            free: b.free - amount,
            locked: b.locked + amount,
            total: b.total
          }
        }
        return b
      })

      const order: Order = {
        id: 'order_' + Date.now(),
        symbol,
        side,
        type,
        price,
        amount,
        filledAmount: type === 'market' ? amount : 0,
        total,
        status: type === 'market' ? 'filled' : 'pending',
        timestamp: Date.now()
      }

      let finalBalances = updatedBalances
      if (type === 'market') {
        finalBalances = updatedBalances.map(b => {
          if (b.asset === baseAsset) {
            return {
              ...b,
              locked: b.locked - amount,
              total: b.total - amount
            }
          }
          if (b.asset === quoteAsset) {
            return {
              ...b,
              free: b.free + total,
              total: b.total + total
            }
          }
          return b
        })
      }

      set({
        balances: finalBalances,
        orders: [order, ...state.orders]
      })

      return order
    }
  },

  cancelOrder: (orderId: string) => {
    const state = get()
    const order = state.orders.find(o => o.id === orderId)
    if (!order || order.status !== 'pending') return false

    const [baseAsset, quoteAsset] = order.symbol.split('_')

    const updatedBalances = state.balances.map(b => {
      if (order.side === 'buy' && b.asset === quoteAsset) {
        const lockedAmount = order.price * (order.amount - order.filledAmount)
        return {
          ...b,
          free: b.free + lockedAmount,
          locked: b.locked - lockedAmount
        }
      }
      if (order.side === 'sell' && b.asset === baseAsset) {
        const lockedAmount = order.amount - order.filledAmount
        return {
          ...b,
          free: b.free + lockedAmount,
          locked: b.locked - lockedAmount
        }
      }
      return b
    })

    const updatedOrders = state.orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'cancelled' as const }
      }
      return o
    })

    set({
      balances: updatedBalances,
      orders: updatedOrders
    })

    return true
  },

  deposit: (asset: string, amount: number, address: string) => {
    const state = get()

    const record: DepositRecord = {
      id: 'deposit_' + Date.now(),
      asset,
      amount,
      address,
      status: 'pending',
      confirmations: 0,
      timestamp: Date.now()
    }

    setTimeout(() => {
      set(s => {
        const updatedBalances = s.balances.map(b => {
          if (b.asset === asset) {
            return {
              ...b,
              free: b.free + amount,
              total: b.total + amount
            }
          }
          return b
        })

        if (!updatedBalances.find(b => b.asset === asset)) {
          updatedBalances.push({
            asset,
            free: amount,
            locked: 0,
            total: amount
          })
        }

        const updatedRecords = s.depositRecords.map(r => {
          if (r.id === record.id) {
            return { ...r, status: 'completed' as const, confirmations: 12, txId: 'tx_' + Date.now() }
          }
          return r
        })

        return {
          balances: updatedBalances,
          depositRecords: updatedRecords
        }
      })
    }, 3000)

    set({
      depositRecords: [record, ...state.depositRecords]
    })

    return record
  },

  withdraw: (asset: string, amount: number, address: string, fee: number) => {
    const state = get()
    if (!state.isLoggedIn) return null

    const balance = state.balances.find(b => b.asset === asset)
    if (!balance || balance.free < amount + fee) return null

    const updatedBalances = state.balances.map(b => {
      if (b.asset === asset) {
        return {
          ...b,
          free: b.free - amount - fee,
          total: b.total - amount - fee
        }
      }
      return b
    })

    const record: WithdrawRecord = {
      id: 'withdraw_' + Date.now(),
      asset,
      amount,
      address,
      fee,
      status: 'pending',
      timestamp: Date.now()
    }

    setTimeout(() => {
      set(s => {
        const updatedRecords = s.withdrawRecords.map(r => {
          if (r.id === record.id) {
            return { ...r, status: 'completed' as const, txId: 'tx_' + Date.now() }
          }
          return r
        })
        return { withdrawRecords: updatedRecords }
      })
    }, 5000)

    set({
      balances: updatedBalances,
      withdrawRecords: [record, ...state.withdrawRecords]
    })

    return record
  },

  getBalance: (asset: string) => {
    return get().balances.find(b => b.asset === asset)
  },

  openPosition: ({ symbol, side, amount, entryPrice, leverage }) => {
    const state = get()
    if (!state.isLoggedIn) return null

    const [, quoteAsset] = symbol.split('_')
    const margin = (entryPrice * amount) / leverage

    const quoteBalance = state.balances.find(b => b.asset === quoteAsset)
    if (!quoteBalance || quoteBalance.free < margin) return null

    const updatedBalances = state.balances.map(b => {
      if (b.asset === quoteAsset) {
        return {
          ...b,
          free: b.free - margin,
          locked: b.locked + margin,
          total: b.total
        }
      }
      return b
    })

    const liquidationPrice = calculateLiquidationPrice(entryPrice, leverage, side)

    const position: Position = {
      symbol,
      side,
      amount,
      entryPrice,
      markPrice: entryPrice,
      leverage,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      margin,
      liquidationPrice,
      timestamp: Date.now()
    }

    set({
      balances: updatedBalances,
      positions: [position, ...state.positions]
    })

    return position
  },

  closePosition: (index: number) => {
    const state = get()
    if (index < 0 || index >= state.positions.length) return false

    const position = state.positions[index]
    const [, quoteAsset] = position.symbol.split('_')

    const pnl = position.unrealizedPnl
    const returnAmount = position.margin + pnl

    const updatedBalances = state.balances.map(b => {
      if (b.asset === quoteAsset) {
        return {
          ...b,
          free: b.free + returnAmount,
          locked: b.locked - position.margin,
          total: b.total + pnl
        }
      }
      return b
    })

    const updatedPositions = state.positions.filter((_, i) => i !== index)

    set({
      balances: updatedBalances,
      positions: updatedPositions
    })

    return true
  },

  updatePositions: (markPrices: Record<string, number>) => {
    set(state => {
      const updatedPositions = state.positions.map(position => {
        const markPrice = markPrices[position.symbol] || position.markPrice
        const pnl = position.side === 'long'
          ? (markPrice - position.entryPrice) * position.amount
          : (position.entryPrice - markPrice) * position.amount
        const pnlPercent = (pnl / position.margin) * 100

        return {
          ...position,
          markPrice,
          unrealizedPnl: Number(pnl.toFixed(2)),
          unrealizedPnlPercent: Number(pnlPercent.toFixed(2))
        }
      })

      return { positions: updatedPositions }
    })
  },

  updateSecuritySetting: (key, value) => {
    set(state => ({
      securitySettings: {
        ...state.securitySettings,
        [key]: value
      }
    }))
  }
}))
