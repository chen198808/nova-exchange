import { create } from 'zustand'
import type { User, AccountBalance, Order, Position, DepositRecord, WithdrawRecord, OrderSide, OrderType, SecuritySettings, LoginDevice, RiskAlert } from '@/types'
import { mockUser, initialBalances, mockOrders, mockPositions, mockDepositRecords, mockWithdrawRecords, calculateLiquidationPrice, mockSecuritySettings, mockLoginDevices, mockRiskAlerts } from '@/data/mockData'
import api from '@/services/api'

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
  depositAddress: string

  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, email?: string) => Promise<boolean>
  logout: () => void
  fetchBalances: () => Promise<void>
  placeOrder: (params: {
    symbol: string
    side: OrderSide
    type: OrderType
    price: number
    amount: number
  }) => Order | null
  cancelOrder: (orderId: string) => boolean
  deposit: (asset: string, amount: number, address: string) => DepositRecord
  withdraw: (asset: string, amount: number, address: string) => Promise<boolean>
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
  loadDepositAddress: () => Promise<void>
  fetchDepositRecords: () => Promise<void>
  fetchWithdrawRecords: () => Promise<void>
  verifyDeposit: (txId: string, asset: string) => Promise<boolean>
  swap: (inputAsset: string, outputAsset: string, amount: number, slippage?: number) => Promise<boolean>
  fetchOrders: () => Promise<void>
  getQuote: (inputAsset: string, outputAsset: string, amount: number, slippage?: number) => Promise<any>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  balances: [],
  orders: [],
  positions: mockPositions,
  depositRecords: [],
  withdrawRecords: [],
  securitySettings: mockSecuritySettings,
  loginDevices: mockLoginDevices,
  riskAlerts: mockRiskAlerts,
  depositAddress: '',

  register: async (username: string, password: string, email?: string) => {
    try {
      const result: any = await api.auth.register(username, password, email)
      if (result.success && result.token) {
        localStorage.setItem('token', result.token)
        const userData: User = {
          id: String(result.user.id),
          username: result.user.username,
          email: result.user.email,
          avatar: '👤',
          kycLevel: 1,
          vipLevel: 1,
          registeredAt: Date.now()
        }
        set({
          user: userData,
          isLoggedIn: true,
          depositAddress: result.user.depositAddress || ''
        })
        return true
      }
      return false
    } catch (error: any) {
      console.error('Register error:', error)
      throw error
    }
  },

  login: async (username: string, password: string) => {
    try {
      const result: any = await api.auth.login(username, password)
      if (result.success && result.token) {
        localStorage.setItem('token', result.token)
        const userData: User = {
          id: String(result.user.id),
          username: result.user.username,
          email: result.user.email,
          avatar: '👤',
          kycLevel: 1,
          vipLevel: 1,
          registeredAt: Date.now()
        }
        set({
          user: userData,
          isLoggedIn: true,
          depositAddress: result.user.depositAddress || ''
        })
        return true
      }
      return false
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({
      user: null,
      isLoggedIn: false,
      balances: [],
      orders: [],
      depositRecords: [],
      withdrawRecords: [],
      depositAddress: ''
    })
  },

  fetchBalances: async () => {
    try {
      const result: any = await api.assets.getBalances()
      if (result.balances) {
        set({ balances: result.balances as AccountBalance[] })
      }
    } catch (error) {
      console.error('Fetch balances error:', error)
    }
  },

  loadDepositAddress: async () => {
    try {
      const result: any = await api.assets.getDepositAddress()
      if (result.address) {
        set({ depositAddress: result.address })
      }
    } catch (error) {
      console.error('Load deposit address error:', error)
    }
  },

  verifyDeposit: async (txId: string, asset: string): Promise<boolean> => {
    try {
      const result: any = await api.assets.verifyDeposit(txId, asset)
      if (result.success) {
        await get().fetchBalances()
        await get().fetchDepositRecords()
        return true
      }
      return false
    } catch (error) {
      console.error('Verify deposit error:', error)
      return false
    }
  },

  fetchDepositRecords: async () => {
    try {
      const result: any = await api.assets.getDeposits()
      if (result.deposits) {
        const records: DepositRecord[] = result.deposits.map((d: any) => ({
          id: String(d.id),
          asset: d.asset,
          amount: d.amount,
          address: d.to_address,
          txId: d.tx_id,
          status: d.status,
          confirmations: d.confirmations || 0,
          timestamp: d.created_at
        }))
        set({ depositRecords: records })
      }
    } catch (error) {
      console.error('Fetch deposit records error:', error)
    }
  },

  fetchWithdrawRecords: async () => {
    try {
      const result: any = await api.assets.getWithdrawals()
      if (result.withdrawals) {
        const records: WithdrawRecord[] = result.withdrawals.map((w: any) => ({
          id: String(w.id),
          asset: w.asset,
          amount: w.amount,
          address: w.to_address,
          fee: w.fee,
          txId: w.tx_id,
          status: w.status,
          timestamp: w.created_at
        }))
        set({ withdrawRecords: records })
      }
    } catch (error) {
      console.error('Fetch withdraw records error:', error)
    }
  },

  withdraw: async (asset: string, amount: number, address: string): Promise<boolean> => {
    try {
      const result: any = await api.assets.withdraw(asset, amount, address)
      if (result.success) {
        await get().fetchBalances()
        await get().fetchWithdrawRecords()
        return true
      }
      return false
    } catch (error) {
      console.error('Withdraw error:', error)
      return false
    }
  },

  getQuote: async (inputAsset: string, outputAsset: string, amount: number, slippage?: number): Promise<any> => {
    try {
      const result: any = await api.trading.getQuote(inputAsset, outputAsset, amount, slippage)
      return result
    } catch (error) {
      console.error('Get quote error:', error)
      return null
    }
  },

  swap: async (inputAsset: string, outputAsset: string, amount: number, slippage?: number): Promise<boolean> => {
    try {
      const result: any = await api.trading.swap(inputAsset, outputAsset, amount, slippage)
      if (result.success) {
        await get().fetchBalances()
        await get().fetchOrders()
        return true
      }
      return false
    } catch (error: any) {
      console.error('Swap error:', error)
      alert(error.message || '兑换失败')
      return false
    }
  },

  fetchOrders: async () => {
    try {
      const result: any = await api.trading.getOrders()
      if (result.orders) {
        const orders: Order[] = result.orders.map((o: any) => ({
          id: String(o.id),
          symbol: o.symbol,
          side: o.side as OrderSide,
          type: o.type as OrderType,
          price: o.price,
          amount: o.amount,
          filledAmount: o.filled_amount,
          total: o.total,
          status: o.status as any,
          timestamp: o.created_at
        }))
        set({ orders })
      }
    } catch (error) {
      console.error('Fetch orders error:', error)
    }
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
