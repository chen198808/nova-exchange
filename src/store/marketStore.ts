import { create } from 'zustand'
import type { Coin, TradingPair, FuturesPair, OrderBook, KlineData, Trade } from '@/types'
import { coins as mockCoins, tradingPairs as mockPairs, futuresPairs as mockFuturesPairs, generateOrderBook, generateKlineData, generateRecentTrades } from '@/data/mockData'
import { getMultipleTokenPrices } from '@/services/jupiterApi'

interface MarketState {
  coins: Coin[]
  tradingPairs: TradingPair[]
  futuresPairs: FuturesPair[]
  currentPair: TradingPair
  currentFuturesPair: FuturesPair
  orderBook: OrderBook
  klineData: KlineData[]
  klineInterval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  recentTrades: Trade[]
  priceSource: 'mock' | 'jupiter'

  setCurrentPair: (symbol: string) => void
  setCurrentFuturesPair: (symbol: string) => void
  updatePrices: () => void
  fetchRealPrices: () => Promise<void>
  setKlineInterval: (interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d') => void
  refreshOrderBook: () => void
  refreshKlineData: () => void
  refreshRecentTrades: () => void
}

const initialPair = mockPairs[0]
const initialFuturesPair = mockFuturesPairs[0]
const initialOrderBook = generateOrderBook(initialPair.lastPrice, initialPair.pricePrecision)
const initialKlineData = generateKlineData(initialPair.lastPrice, 30, '1d')
const initialRecentTrades = generateRecentTrades(initialFuturesPair.symbol, initialFuturesPair.lastPrice, 30)

export const useMarketStore = create<MarketState>((set, get) => ({
  coins: mockCoins,
  tradingPairs: mockPairs,
  futuresPairs: mockFuturesPairs,
  currentPair: initialPair,
  currentFuturesPair: initialFuturesPair,
  orderBook: initialOrderBook,
  klineData: initialKlineData,
  klineInterval: '1d',
  recentTrades: initialRecentTrades,
  priceSource: 'mock',

  setCurrentPair: (symbol: string) => {
    const pair = get().tradingPairs.find(p => p.symbol === symbol)
    if (!pair) return

    const newOrderBook = generateOrderBook(pair.lastPrice, pair.pricePrecision)
    const newKlineData = generateKlineData(pair.lastPrice, 30, get().klineInterval)

    set({
      currentPair: pair,
      orderBook: newOrderBook,
      klineData: newKlineData
    })
  },

  setCurrentFuturesPair: (symbol: string) => {
    const pair = get().futuresPairs.find(p => p.symbol === symbol)
    if (!pair) return

    const newOrderBook = generateOrderBook(pair.lastPrice, pair.pricePrecision)
    const newKlineData = generateKlineData(pair.lastPrice, 30, get().klineInterval)
    const newRecentTrades = generateRecentTrades(pair.symbol, pair.lastPrice, 30)

    set({
      currentFuturesPair: pair,
      orderBook: newOrderBook,
      klineData: newKlineData,
      recentTrades: newRecentTrades
    })
  },

  fetchRealPrices: async () => {
    try {
      const solanaCoins = get().coins.filter(c => c.chain === 'solana' && c.contractAddress)
      if (solanaCoins.length === 0) return

      const mintAddresses = solanaCoins.map(c => c.contractAddress!)
      const prices = await getMultipleTokenPrices(mintAddresses)

      if (Object.keys(prices).length === 0) return

      set(state => {
        const updatedCoins = state.coins.map(coin => {
          if (coin.symbol === 'RS') {
            return coin
          }
          if (coin.contractAddress && prices[coin.contractAddress]) {
            const newPrice = prices[coin.contractAddress]
            const oldPrice = coin.price
            const change24h = ((newPrice - oldPrice) / oldPrice) * 100 + coin.change24h * 0.5
            return {
              ...coin,
              price: newPrice,
              change24h: Number(change24h.toFixed(2))
            }
          }
          return coin
        })

        const updatedPairs = state.tradingPairs.map(pair => {
          const baseCoin = updatedCoins.find(c => c.symbol === pair.baseAsset)
          if (baseCoin && baseCoin.chain === 'solana') {
            return {
              ...pair,
              lastPrice: baseCoin.price,
              change24h: baseCoin.change24h,
              high24h: Math.max(pair.high24h, baseCoin.price),
              low24h: Math.min(pair.low24h, baseCoin.price)
            }
          }
          return pair
        })

        const updatedFuturesPairs = state.futuresPairs.map(pair => {
          const baseCoin = updatedCoins.find(c => c.symbol === pair.baseAsset)
          if (baseCoin && baseCoin.chain === 'solana') {
            return {
              ...pair,
              lastPrice: baseCoin.price,
              markPrice: baseCoin.price * 1.0001,
              change24h: baseCoin.change24h,
              high24h: Math.max(pair.high24h, baseCoin.price),
              low24h: Math.min(pair.low24h, baseCoin.price)
            }
          }
          return pair
        })

        const currentPairSymbol = state.currentPair.symbol
        const updatedCurrentPair = updatedPairs.find(p => p.symbol === currentPairSymbol) || state.currentPair

        const currentFuturesPairSymbol = state.currentFuturesPair.symbol
        const updatedCurrentFuturesPair = updatedFuturesPairs.find(p => p.symbol === currentFuturesPairSymbol) || state.currentFuturesPair

        return {
          coins: updatedCoins,
          tradingPairs: updatedPairs,
          futuresPairs: updatedFuturesPairs,
          currentPair: updatedCurrentPair,
          currentFuturesPair: updatedCurrentFuturesPair,
          priceSource: 'jupiter'
        }
      })
    } catch (error) {
      console.error('Failed to fetch real prices:', error)
    }
  },

  updatePrices: () => {
    set(state => {
      const updatedCoins = state.coins.map(coin => {
        const changePercent = (Math.random() - 0.5) * 0.002
        const newPrice = coin.price * (1 + changePercent)
        const newChange24h = coin.change24h + (Math.random() - 0.5) * 0.1
        return {
          ...coin,
          price: Number(newPrice.toFixed(coin.precision || 6)),
          change24h: Number(newChange24h.toFixed(2))
        }
      })

      const updatedPairs = state.tradingPairs.map(pair => {
        const changePercent = (Math.random() - 0.5) * 0.002
        const newPrice = pair.lastPrice * (1 + changePercent)
        const newChange24h = pair.change24h + (Math.random() - 0.5) * 0.05
        return {
          ...pair,
          lastPrice: Number(newPrice.toFixed(pair.pricePrecision)),
          change24h: Number(newChange24h.toFixed(2)),
          high24h: Math.max(pair.high24h, Number(newPrice.toFixed(pair.pricePrecision))),
          low24h: Math.min(pair.low24h, Number(newPrice.toFixed(pair.pricePrecision)))
        }
      })

      const updatedFuturesPairs = state.futuresPairs.map(pair => {
        const changePercent = (Math.random() - 0.5) * 0.002
        const newPrice = pair.lastPrice * (1 + changePercent)
        const newMarkPrice = newPrice * (1 + (Math.random() - 0.5) * 0.0005)
        const newChange24h = pair.change24h + (Math.random() - 0.5) * 0.05
        const newFundingRate = pair.fundingRate + (Math.random() - 0.5) * 0.002
        const newOpenInterest = pair.openInterest * (1 + (Math.random() - 0.5) * 0.001)
        return {
          ...pair,
          lastPrice: Number(newPrice.toFixed(pair.pricePrecision)),
          markPrice: Number(newMarkPrice.toFixed(pair.pricePrecision)),
          change24h: Number(newChange24h.toFixed(2)),
          high24h: Math.max(pair.high24h, Number(newPrice.toFixed(pair.pricePrecision))),
          low24h: Math.min(pair.low24h, Number(newPrice.toFixed(pair.pricePrecision))),
          openInterest: Number(newOpenInterest.toFixed(0)),
          fundingRate: Number(newFundingRate.toFixed(4))
        }
      })

      const currentPairSymbol = state.currentPair.symbol
      const updatedCurrentPair = updatedPairs.find(p => p.symbol === currentPairSymbol) || state.currentPair

      const currentFuturesPairSymbol = state.currentFuturesPair.symbol
      const updatedCurrentFuturesPair = updatedFuturesPairs.find(p => p.symbol === currentFuturesPairSymbol) || state.currentFuturesPair

      const updatedOrderBook = {
        ...state.orderBook,
        timestamp: Date.now()
      }

      const lastKline = state.klineData[state.klineData.length - 1]
      let updatedKlineData = state.klineData
      if (lastKline) {
        const newClose = updatedCurrentFuturesPair.lastPrice
        const updatedLastKline = {
          ...lastKline,
          close: newClose,
          high: Math.max(lastKline.high, newClose),
          low: Math.min(lastKline.low, newClose),
          volume: lastKline.volume + Math.random() * 100
        }
        updatedKlineData = [...state.klineData.slice(0, -1), updatedLastKline]
      }

      let updatedRecentTrades = state.recentTrades
      if (Math.random() > 0.5) {
        const newTrade: Trade = {
          id: `trade_${Date.now()}`,
          symbol: updatedCurrentFuturesPair.symbol,
          price: updatedCurrentFuturesPair.lastPrice,
          amount: Number((Math.random() * 2 + 0.01).toFixed(6)),
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          timestamp: Date.now()
        }
        updatedRecentTrades = [newTrade, ...state.recentTrades.slice(0, 29)]
      }

      return {
        coins: updatedCoins,
        tradingPairs: updatedPairs,
        futuresPairs: updatedFuturesPairs,
        currentPair: updatedCurrentPair,
        currentFuturesPair: updatedCurrentFuturesPair,
        orderBook: updatedOrderBook,
        klineData: updatedKlineData,
        recentTrades: updatedRecentTrades
      }
    })
  },

  setKlineInterval: (interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d') => {
    const { currentFuturesPair } = get()
    const newKlineData = generateKlineData(currentFuturesPair.lastPrice, 30, interval)
    set({
      klineInterval: interval,
      klineData: newKlineData
    })
  },

  refreshOrderBook: () => {
    const { currentFuturesPair } = get()
    const newOrderBook = generateOrderBook(currentFuturesPair.lastPrice, currentFuturesPair.pricePrecision)
    set({ orderBook: newOrderBook })
  },

  refreshKlineData: () => {
    const { currentFuturesPair, klineInterval } = get()
    const newKlineData = generateKlineData(currentFuturesPair.lastPrice, 30, klineInterval)
    set({ klineData: newKlineData })
  },

  refreshRecentTrades: () => {
    const { currentFuturesPair } = get()
    const newRecentTrades = generateRecentTrades(currentFuturesPair.symbol, currentFuturesPair.lastPrice, 30)
    set({ recentTrades: newRecentTrades })
  }
}))
