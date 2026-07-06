import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMarketStore } from '@/store/marketStore'
import { useUserStore } from '@/store/userStore'
import { formatPrice, formatAmount, formatPercent, formatVolume, formatShortTime } from '@/utils/format'
import { cn } from '@/lib/utils'
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type Time } from 'lightweight-charts'
import {
  Search,
  Star,
  StarOff,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X,
  RefreshCw
} from 'lucide-react'
import type { OrderSide, OrderType, TradingPair, OrderBookEntry } from '@/types'

const INTERVALS: { label: string; value: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' }[] = [
  { label: '1分', value: '1m' },
  { label: '5分', value: '5m' },
  { label: '15分', value: '15m' },
  { label: '1时', value: '1h' },
  { label: '4时', value: '4h' },
  { label: '1天', value: '1d' },
  { label: '1周', value: '1w' },
]

interface TradeRecord {
  id: string
  price: number
  amount: number
  side: 'buy' | 'sell'
  time: number
}

function generateTradeRecords(pair: TradingPair, count: number = 30): TradeRecord[] {
  const records: TradeRecord[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * pair.lastPrice * 0.002
    const price = Number((pair.lastPrice + change).toFixed(pair.pricePrecision))
    const amount = Number((Math.random() * 5 + 0.1).toFixed(pair.amountPrecision))
    const side = Math.random() > 0.5 ? 'buy' : 'sell'

    records.push({
      id: `trade_${i}`,
      price,
      amount,
      side,
      time: now - i * 5000
    })
  }

  return records
}

export default function SpotTrade() {
  const { pair } = useParams()
  const navigate = useNavigate()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const {
    tradingPairs,
    currentPair,
    orderBook,
    klineData,
    klineInterval,
    setCurrentPair,
    updatePrices,
    setKlineInterval,
    refreshOrderBook
  } = useMarketStore()

  const { balances, orders, placeOrder, cancelOrder, getBalance, isLoggedIn } = useUserStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>(['BTC_USDT', 'ETH_USDT'])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [orderSide, setOrderSide] = useState<OrderSide>('buy')
  const [orderType, setOrderType] = useState<OrderType>('limit')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open')
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([])
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)
  const prevPriceRef = useRef<number>(currentPair.lastPrice)

  const filteredPairs = useMemo(() => {
    let pairs = tradingPairs
    if (showFavoritesOnly) {
      pairs = pairs.filter(p => favorites.includes(p.symbol))
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      pairs = pairs.filter(p =>
        p.symbol.toLowerCase().includes(query) ||
        p.baseAsset.toLowerCase().includes(query)
      )
    }
    return pairs
  }, [tradingPairs, searchQuery, favorites, showFavoritesOnly])

  const baseBalance = getBalance(currentPair.baseAsset)
  const quoteBalance = getBalance(currentPair.quoteAsset)

  const availableBalance = orderSide === 'buy'
    ? quoteBalance?.free || 0
    : baseBalance?.free || 0

  const priceNum = parseFloat(price) || currentPair.lastPrice
  const amountNum = parseFloat(amount) || 0
  const total = priceNum * amountNum

  const maxBuyAmount = useMemo(() => {
    if (orderSide !== 'buy' || !quoteBalance) return 0
    return quoteBalance.free / priceNum
  }, [orderSide, quoteBalance, priceNum])

  const maxSellAmount = useMemo(() => {
    if (orderSide !== 'sell' || !baseBalance) return 0
    return baseBalance.free
  }, [orderSide, baseBalance])

  const maxAmount = orderSide === 'buy' ? maxBuyAmount : maxSellAmount

  const openOrders = useMemo(() => {
    return orders.filter(o => o.symbol === currentPair.symbol && o.status === 'pending')
  }, [orders, currentPair.symbol])

  const historyOrders = useMemo(() => {
    return orders.filter(o => o.symbol === currentPair.symbol && o.status !== 'pending')
  }, [orders, currentPair.symbol])

  useEffect(() => {
    if (pair) {
      const symbol = pair.toUpperCase()
      const exists = tradingPairs.some(p => p.symbol === symbol)
      if (exists) {
        setCurrentPair(symbol)
      } else {
        navigate('/trade/RS_USDT')
      }
    } else {
      navigate('/trade/RS_USDT')
    }
  }, [pair, tradingPairs, setCurrentPair, navigate])

  useEffect(() => {
    const interval = setInterval(() => {
      updatePrices()
    }, 2500)
    return () => clearInterval(interval)
  }, [updatePrices])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrderBook()
    }, 3000)
    return () => clearInterval(interval)
  }, [refreshOrderBook])

  useEffect(() => {
    if (currentPair.lastPrice !== prevPriceRef.current) {
      setPriceFlash(currentPair.lastPrice > prevPriceRef.current ? 'up' : 'down')
      prevPriceRef.current = currentPair.lastPrice
      setTimeout(() => setPriceFlash(null), 600)
    }
  }, [currentPair.lastPrice])

  useEffect(() => {
    setTradeRecords(generateTradeRecords(currentPair, 30))
  }, [currentPair.symbol])

  useEffect(() => {
    const interval = setInterval(() => {
      setTradeRecords(prev => {
        const change = (Math.random() - 0.5) * currentPair.lastPrice * 0.002
        const newPrice = Number((currentPair.lastPrice + change).toFixed(currentPair.pricePrecision))
        const newAmount = Number((Math.random() * 5 + 0.1).toFixed(currentPair.amountPrecision))
        const side = Math.random() > 0.5 ? 'buy' : 'sell'

        const newRecord: TradeRecord = {
          id: `trade_${Date.now()}`,
          price: newPrice,
          amount: newAmount,
          side,
          time: Date.now()
        }

        return [newRecord, ...prev.slice(0, 29)]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [currentPair])

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#161B22' },
        textColor: '#8B949E',
      },
      grid: {
        vertLines: { color: '#21262D' },
        horzLines: { color: '#21262D' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#3B82F6',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#3B82F6',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#21262D',
        textColor: '#8B949E',
      },
      timeScale: {
        borderColor: '#21262D',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    })

    const volumeSeries = chart.addHistogramSeries({
      color: '#3B82F6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return

    const candleData: CandlestickData<Time>[] = klineData.map(k => ({
      time: (k.time / 1000) as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }))

    candlestickSeriesRef.current.setData(candleData)

    const volumeData = klineData.map(k => ({
      time: (k.time / 1000) as Time,
      value: k.volume,
      color: k.close >= k.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }))

    volumeSeriesRef.current.setData(volumeData)
  }, [klineData])

  useEffect(() => {
    setPrice(currentPair.lastPrice.toString())
  }, [currentPair.symbol])

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }

  const handlePairClick = (symbol: string) => {
    navigate(`/trade/${symbol}`)
  }

  const handleIntervalChange = (interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w') => {
    if (interval === '1w') {
      setKlineInterval('1d')
      return
    }
    setKlineInterval(interval)
  }

  const handleSetAmountPercent = (percent: number) => {
    const calculatedAmount = (maxAmount * percent) / 100
    setAmount(calculatedAmount.toFixed(currentPair.amountPrecision))
  }

  const handlePlaceOrder = () => {
    if (!isLoggedIn) {
      alert('请先登录')
      return
    }

    const p = orderType === 'market' ? currentPair.lastPrice : priceNum
    const a = amountNum

    if (a <= 0) {
      alert('请输入有效数量')
      return
    }

    if (a < (currentPair.minAmount || 0)) {
      alert(`最小数量: ${currentPair.minAmount}`)
      return
    }

    const result = placeOrder({
      symbol: currentPair.symbol,
      side: orderSide,
      type: orderType,
      price: p,
      amount: a
    })

    if (result) {
      setAmount('')
      alert('下单成功')
    } else {
      alert('下单失败，请检查余额')
    }
  }

  const handleCancelOrder = (orderId: string) => {
    cancelOrder(orderId)
  }

  const maxAskTotal = Math.max(...orderBook.asks.map(a => a.total), 1)
  const maxBidTotal = Math.max(...orderBook.bids.map(b => b.total), 1)

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Left Sidebar - Trading Pairs */}
        <div className="w-full lg:w-60 bg-background-card border-b lg:border-b-0 lg:border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="搜索交易对..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className={cn(
                  'flex-1 py-1 text-xs rounded transition-colors',
                  !showFavoritesOnly
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                全部
              </button>
              <button
                onClick={() => setShowFavoritesOnly(true)}
                className={cn(
                  'flex-1 py-1 text-xs rounded transition-colors',
                  showFavoritesOnly
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                收藏
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 px-3 py-2 text-xs text-text-tertiary border-b border-border/50">
              <span>交易对</span>
              <span className="text-right">最新价</span>
              <span className="text-right">涨跌幅</span>
            </div>
            {filteredPairs.map(p => (
              <div
                key={p.symbol}
                onClick={() => handlePairClick(p.symbol)}
                className={cn(
                  'grid grid-cols-3 px-3 py-2 text-sm cursor-pointer hover:bg-background-hover transition-colors',
                  currentPair.symbol === p.symbol && 'bg-background-hover'
                )}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(p.symbol)
                    }}
                    className="text-text-tertiary hover:text-warning"
                  >
                    {favorites.includes(p.symbol) ? (
                      <Star className="w-3 h-3 fill-warning text-warning" />
                    ) : (
                      <StarOff className="w-3 h-3" />
                    )}
                  </button>
                  <span className="text-text-primary font-medium text-xs">
                    {p.baseAsset}
                    <span className="text-text-tertiary">/{p.quoteAsset}</span>
                  </span>
                </div>
                <div className="text-right font-number text-xs">
                  <span className={p.change24h >= 0 ? 'text-success' : 'text-danger'}>
                    {formatPrice(p.lastPrice, p.pricePrecision)}
                  </span>
                </div>
                <div className={cn(
                  'text-right font-number text-xs flex items-center justify-end gap-0.5',
                  p.change24h >= 0 ? 'text-success' : 'text-danger'
                )}>
                  {p.change24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {formatPercent(p.change24h)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar - Pair Info */}
          <div className="bg-background-card border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-text-primary">
                  {currentPair.baseAsset}
                  <span className="text-text-tertiary">/{currentPair.quoteAsset}</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-2xl font-bold font-number',
                  currentPair.change24h >= 0 ? 'text-success' : 'text-danger',
                  priceFlash === 'up' && 'price-up',
                  priceFlash === 'down' && 'price-down'
                )}>
                  {formatPrice(currentPair.lastPrice, currentPair.pricePrecision)}
                </span>
                <span className={cn(
                  'text-sm font-number px-2 py-0.5 rounded',
                  currentPair.change24h >= 0
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger'
                )}>
                  {formatPercent(currentPair.change24h)}
                </span>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <div className="text-text-tertiary text-xs">24h最高</div>
                  <div className="text-text-primary font-number">{formatPrice(currentPair.high24h, currentPair.pricePrecision)}</div>
                </div>
                <div>
                  <div className="text-text-tertiary text-xs">24h最低</div>
                  <div className="text-text-primary font-number">{formatPrice(currentPair.low24h, currentPair.pricePrecision)}</div>
                </div>
                <div>
                  <div className="text-text-tertiary text-xs">24h成交量</div>
                  <div className="text-text-primary font-number">
                    {formatVolume(currentPair.volume24h)} {currentPair.baseAsset}
                  </div>
                </div>
                <div>
                  <div className="text-text-tertiary text-xs">24h成交额</div>
                  <div className="text-text-primary font-number">
                    ${formatVolume(currentPair.quoteVolume24h)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="bg-background-card border-b border-border">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-1">
                {INTERVALS.map(interval => (
                  <button
                    key={interval.value}
                    onClick={() => handleIntervalChange(interval.value)}
                    className={cn(
                      'px-3 py-1 text-xs rounded transition-colors',
                      klineInterval === interval.value
                        ? 'bg-primary/20 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                    )}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-text-tertiary">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs">K线</span>
              </div>
            </div>
            <div ref={chartContainerRef} className="w-full h-[400px]" />
          </div>

          {/* Trade History & Orders */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Recent Trades */}
            <div className="flex-1 lg:flex-1 bg-background-card border-r border-border flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-border">
                <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  最新成交
                </h3>
              </div>
              <div className="grid grid-cols-3 px-4 py-2 text-xs text-text-tertiary border-b border-border/50">
                <span>价格 ({currentPair.quoteAsset})</span>
                <span className="text-right">数量 ({currentPair.baseAsset})</span>
                <span className="text-right">时间</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tradeRecords.map(record => (
                  <div
                    key={record.id}
                    className="grid grid-cols-3 px-4 py-1.5 text-xs hover:bg-background-hover transition-colors"
                  >
                    <span className={cn(
                      'font-number',
                      record.side === 'buy' ? 'text-success' : 'text-danger'
                    )}>
                      {formatPrice(record.price, currentPair.pricePrecision)}
                    </span>
                    <span className="text-right font-number text-text-primary">
                      {formatAmount(record.amount, currentPair.amountPrecision)}
                    </span>
                    <span className="text-right text-text-tertiary">
                      {formatShortTime(record.time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Orders */}
            <div className="flex-1 lg:flex-1 bg-background-card flex flex-col overflow-hidden">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('open')}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === 'open'
                      ? 'text-text-primary border-b-2 border-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                >
                  当前委托 ({openOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === 'history'
                      ? 'text-text-primary border-b-2 border-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                >
                  历史订单
                </button>
              </div>
              <div className="grid grid-cols-5 px-4 py-2 text-xs text-text-tertiary border-b border-border/50">
                <span>时间</span>
                <span>类型</span>
                <span>价格</span>
                <span>数量</span>
                <span className="text-right">操作</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'open' ? (
                  openOrders.length > 0 ? (
                    openOrders.map(order => (
                      <div
                        key={order.id}
                        className="grid grid-cols-5 px-4 py-2 text-xs border-b border-border/30 hover:bg-background-hover transition-colors items-center"
                      >
                        <span className="text-text-tertiary">{formatShortTime(order.timestamp)}</span>
                        <span className={order.side === 'buy' ? 'text-success' : 'text-danger'}>
                          {order.side === 'buy' ? '买入' : '卖出'}
                          <span className="text-text-tertiary ml-1">{order.type === 'limit' ? '限价' : '市价'}</span>
                        </span>
                        <span className="font-number text-text-primary">
                          {formatPrice(order.price, currentPair.pricePrecision)}
                        </span>
                        <span className="font-number text-text-primary">
                          {formatAmount(order.filledAmount, currentPair.amountPrecision)}/{formatAmount(order.amount, currentPair.amountPrecision)}
                        </span>
                        <div className="text-right">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-danger hover:text-danger/80 text-xs"
                          >
                            撤单
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-text-tertiary">
                      <RefreshCw className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">暂无当前委托</span>
                    </div>
                  )
                ) : (
                  historyOrders.length > 0 ? (
                    historyOrders.map(order => (
                      <div
                        key={order.id}
                        className="grid grid-cols-5 px-4 py-2 text-xs border-b border-border/30 hover:bg-background-hover transition-colors items-center"
                      >
                        <span className="text-text-tertiary">{formatShortTime(order.timestamp)}</span>
                        <span className={order.side === 'buy' ? 'text-success' : 'text-danger'}>
                          {order.side === 'buy' ? '买入' : '卖出'}
                          <span className="text-text-tertiary ml-1">{order.type === 'limit' ? '限价' : '市价'}</span>
                        </span>
                        <span className="font-number text-text-primary">
                          {formatPrice(order.price, currentPair.pricePrecision)}
                        </span>
                        <span className="font-number text-text-primary">
                          {formatAmount(order.amount, currentPair.amountPrecision)}
                        </span>
                        <div className="text-right">
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            order.status === 'filled' && 'bg-success/10 text-success',
                            order.status === 'cancelled' && 'bg-text-tertiary/10 text-text-tertiary',
                            order.status === 'partial' && 'bg-warning/10 text-warning'
                          )}>
                            {order.status === 'filled' ? '已成交' : order.status === 'cancelled' ? '已撤销' : '部分成交'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-text-tertiary">
                      <RefreshCw className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">暂无历史订单</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Order Book & Trade Panel */}
        <div className="w-full lg:w-72 bg-background-card border-t lg:border-t-0 lg:border-l border-border flex flex-col">
          {/* Order Book */}
          <div className="border-b border-border flex flex-col">
            <div className="px-3 py-2 border-b border-border">
              <h3 className="text-sm font-medium text-text-primary">订单簿</h3>
            </div>
            <div className="grid grid-cols-3 px-3 py-1.5 text-xs text-text-tertiary">
              <span>价格</span>
              <span className="text-right">数量</span>
              <span className="text-right">累计</span>
            </div>
            {/* Asks */}
            <div className="flex flex-col-reverse">
              {orderBook.asks.slice(0, 10).map((ask, index) => (
                <div
                  key={`ask-${index}`}
                  className="grid grid-cols-3 px-3 py-1 text-xs relative"
                >
                  <div
                    className="absolute inset-0 depth-bar-ask"
                    style={{ width: `${(ask.total / maxAskTotal) * 100}%`, right: 0, left: 'auto' }}
                  />
                  <span className="relative z-10 font-number text-danger">
                    {formatPrice(ask.price, currentPair.pricePrecision)}
                  </span>
                  <span className="relative z-10 text-right font-number text-text-primary">
                    {formatAmount(ask.amount, currentPair.amountPrecision)}
                  </span>
                  <span className="relative z-10 text-right font-number text-text-tertiary">
                    {formatAmount(ask.total, 2)}
                  </span>
                </div>
              ))}
            </div>
            {/* Current Price */}
            <div className="px-3 py-2 border-y border-border text-center bg-background-hover">
              <span className={cn(
                'text-lg font-bold font-number',
                currentPair.change24h >= 0 ? 'text-success' : 'text-danger'
              )}>
                {formatPrice(currentPair.lastPrice, currentPair.pricePrecision)}
              </span>
            </div>
            {/* Bids */}
            <div>
              {orderBook.bids.slice(0, 10).map((bid, index) => (
                <div
                  key={`bid-${index}`}
                  className="grid grid-cols-3 px-3 py-1 text-xs relative"
                >
                  <div
                    className="absolute inset-0 depth-bar-bid"
                    style={{ width: `${(bid.total / maxBidTotal) * 100}%` }}
                  />
                  <span className="relative z-10 font-number text-success">
                    {formatPrice(bid.price, currentPair.pricePrecision)}
                  </span>
                  <span className="relative z-10 text-right font-number text-text-primary">
                    {formatAmount(bid.amount, currentPair.amountPrecision)}
                  </span>
                  <span className="relative z-10 text-right font-number text-text-tertiary">
                    {formatAmount(bid.total, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trade Panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex border-b border-border">
              <button
                onClick={() => setOrderSide('buy')}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors',
                  orderSide === 'buy'
                    ? 'text-success border-b-2 border-success bg-success/5'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                买入
              </button>
              <button
                onClick={() => setOrderSide('sell')}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors',
                  orderSide === 'sell'
                    ? 'text-danger border-b-2 border-danger bg-danger/5'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                卖出
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* Order Type */}
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType('limit')}
                  className={cn(
                    'flex-1 py-1.5 text-xs rounded transition-colors',
                    orderType === 'limit'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-background text-text-secondary hover:text-text-primary'
                  )}
                >
                  限价单
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  className={cn(
                    'flex-1 py-1.5 text-xs rounded transition-colors',
                    orderType === 'market'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-background text-text-secondary hover:text-text-primary'
                  )}
                >
                  市价单
                </button>
              </div>

              {/* Price Input */}
              {orderType === 'limit' && (
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">价格</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-number focus:outline-none focus:border-primary"
                      placeholder="输入价格"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">
                      {currentPair.quoteAsset}
                    </span>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">数量</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-number focus:outline-none focus:border-primary"
                    placeholder="输入数量"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">
                    {currentPair.baseAsset}
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => handleSetAmountPercent(pct)}
                    className="py-1 text-xs text-text-secondary bg-background hover:bg-background-hover border border-border rounded transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Available Balance */}
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">可用</span>
                <span className="text-text-primary font-number">
                  {formatAmount(availableBalance, 4)} {orderSide === 'buy' ? currentPair.quoteAsset : currentPair.baseAsset}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between text-xs">
                <span className="text-text-tertiary">总额</span>
                <span className="text-text-primary font-number">
                  {formatAmount(total, 2)} {currentPair.quoteAsset}
                </span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                className={cn(
                  'w-full py-3 rounded-lg text-sm font-medium transition-colors',
                  orderSide === 'buy'
                    ? 'bg-success text-white hover:bg-success-hover btn-glow-success'
                    : 'bg-danger text-white hover:bg-danger-hover btn-glow-danger'
                )}
              >
                {orderSide === 'buy' ? '买入' : '卖出'} {currentPair.baseAsset}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
