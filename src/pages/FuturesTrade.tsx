import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'
import { Search, TrendingUp, TrendingDown, Clock, BarChart3, Zap, AlertTriangle, Minus, Plus } from 'lucide-react'
import { useMarketStore } from '@/store/marketStore'
import { useUserStore } from '@/store/userStore'
import { formatPrice, formatAmount, formatPercent, formatVolume, formatShortTime } from '@/utils/format'
import { calculateLiquidationPrice } from '@/data/mockData'
import type { FuturesPair } from '@/types'

const KLINE_INTERVALS: { label: string; value: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' }[] = [
  { label: '1分', value: '1m' },
  { label: '5分', value: '5m' },
  { label: '15分', value: '15m' },
  { label: '1时', value: '1h' },
  { label: '4时', value: '4h' },
  { label: '日线', value: '1d' },
]

export default function FuturesTrade() {
  const { pair } = useParams()
  const navigate = useNavigate()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const {
    futuresPairs,
    currentFuturesPair,
    orderBook,
    klineData,
    klineInterval,
    recentTrades,
    setCurrentFuturesPair,
    setKlineInterval,
    updatePrices,
  } = useMarketStore()

  const { positions, getBalance, openPosition, closePosition, updatePositions } = useUserStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [tradeSide, setTradeSide] = useState<'long' | 'short'>('long')
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
  const [leverage, setLeverage] = useState(10)
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [fundingCountdown, setFundingCountdown] = useState('')

  const filteredPairs = useMemo(() => {
    if (!searchQuery) return futuresPairs
    return futuresPairs.filter(
      (p) =>
        p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.baseAsset.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [futuresPairs, searchQuery])

  const usdtBalance = getBalance('USDT')
  const availableMargin = usdtBalance?.free || 0

  const orderPrice = orderType === 'market' ? currentFuturesPair.lastPrice : Number(price) || 0
  const orderAmount = Number(amount) || 0
  const marginRequired = (orderPrice * orderAmount) / leverage
  const estLiquidationPrice = orderPrice > 0 && orderAmount > 0
    ? calculateLiquidationPrice(orderPrice, leverage, tradeSide)
    : 0

  useEffect(() => {
    if (pair) {
      setCurrentFuturesPair(pair)
    }
  }, [pair, setCurrentFuturesPair])

  useEffect(() => {
    setPrice(currentFuturesPair.lastPrice.toString())
  }, [currentFuturesPair.symbol])

  useEffect(() => {
    const interval = setInterval(() => {
      updatePrices()
    }, 2000)
    return () => clearInterval(interval)
  }, [updatePrices])

  useEffect(() => {
    const markPrices: Record<string, number> = {}
    futuresPairs.forEach((p) => {
      markPrices[p.symbol] = p.markPrice
    })
    updatePositions(markPrices)
  }, [futuresPairs, updatePositions])

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now()
      const diff = currentFuturesPair.nextFundingTime - now
      if (diff <= 0) {
        setFundingCountdown('00:00:00')
        return
      }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setFundingCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [currentFuturesPair.nextFundingTime])

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
      },
      timeScale: {
        borderColor: '#21262D',
        timeVisible: true,
        secondsVisible: false,
      },
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
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return

    const candleData: CandlestickData[] = klineData.map((k) => ({
      time: (k.time / 1000) as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }))

    const volumeData = klineData.map((k) => ({
      time: (k.time / 1000) as Time,
      value: k.volume,
      color: k.close >= k.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }))

    candlestickSeriesRef.current.setData(candleData)
    volumeSeriesRef.current.setData(volumeData)

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [klineData])

  const handlePairSelect = (symbol: string) => {
    navigate(`/futures/${symbol}`)
  }

  const handleOrderSubmit = () => {
    if (!orderPrice || !orderAmount) return
    if (marginRequired > availableMargin) return

    openPosition({
      symbol: currentFuturesPair.symbol,
      side: tradeSide,
      amount: orderAmount,
      entryPrice: orderPrice,
      leverage,
    })

    setAmount('')
  }

  const handleClosePosition = (index: number) => {
    closePosition(index)
  }

  const maxLeverage = currentFuturesPair.maxLeverage || 125

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-72 bg-background-card border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="搜索合约..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 text-xs text-text-tertiary flex justify-between">
              <span>合约</span>
              <span>标记价格 / 资金费率</span>
            </div>
            {filteredPairs.map((p: FuturesPair) => (
              <div
                key={p.symbol}
                onClick={() => handlePairSelect(p.symbol)}
                className={`px-3 py-2 cursor-pointer hover:bg-background-hover transition-colors ${
                  p.symbol === currentFuturesPair.symbol ? 'bg-background-hover' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-text-primary">
                      {p.baseAsset}/{p.quoteAsset}
                    </div>
                    <div className="text-xs text-text-tertiary">永续</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-number font-medium ${
                      p.change24h >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {formatPrice(p.markPrice, p.pricePrecision)}
                    </div>
                    <div className={`text-xs ${
                      p.change24h >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {formatPercent(p.change24h)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-text-tertiary">
                    资金费率:{' '}
                    <span className={p.fundingRate >= 0 ? 'text-success' : 'text-danger'}>
                      {p.fundingRate >= 0 ? '+' : ''}{p.fundingRate.toFixed(3)}%
                    </span>
                  </span>
                  <span className="text-text-tertiary">
                    持仓: {formatVolume(p.openInterest)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-background-card border-b border-border p-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-lg font-bold text-text-primary flex items-center gap-2">
                    {currentFuturesPair.baseAsset}/{currentFuturesPair.quoteAsset} 永续
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {leverage}x
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className={`text-2xl font-bold font-number ${
                      currentFuturesPair.change24h >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {formatPrice(currentFuturesPair.lastPrice, currentFuturesPair.pricePrecision)}
                    </div>
                    <div className={`flex items-center gap-1 ${
                      currentFuturesPair.change24h >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {currentFuturesPair.change24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{formatPercent(currentFuturesPair.change24h)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-text-tertiary mt-1">
                    标记价格: <span className="text-text-secondary font-number">{formatPrice(currentFuturesPair.markPrice, currentFuturesPair.pricePrecision)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-8 text-sm">
                <div>
                  <div className="text-text-tertiary text-xs">24h最高</div>
                  <div className="text-text-primary font-number">{formatPrice(currentFuturesPair.high24h, currentFuturesPair.pricePrecision)}</div>
                </div>
                <div>
                  <div className="text-text-tertiary text-xs">24h最低</div>
                  <div className="text-text-primary font-number">{formatPrice(currentFuturesPair.low24h, currentFuturesPair.pricePrecision)}</div>
                </div>
                <div>
                  <div className="text-text-tertiary text-xs">24h成交量</div>
                  <div className="text-text-primary font-number">
                    {formatVolume(currentFuturesPair.volume24h)} {currentFuturesPair.baseAsset}
                  </div>
                </div>
                <div>
                  <div className="text-text-tertiary text-xs">持仓量</div>
                  <div className="text-text-primary font-number">
                    {formatVolume(currentFuturesPair.openInterest)} {currentFuturesPair.baseAsset}
                  </div>
                </div>
                <div>
                  <div className="text-text-tertiary text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    资金费率
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-number ${currentFuturesPair.fundingRate >= 0 ? 'text-success' : 'text-danger'}`}>
                      {currentFuturesPair.fundingRate >= 0 ? '+' : ''}{currentFuturesPair.fundingRate.toFixed(3)}%
                    </span>
                    <span className="text-text-tertiary text-xs font-number">
                      {fundingCountdown}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-1 px-4 py-2 bg-background-card border-b border-border">
              {KLINE_INTERVALS.map((interval) => (
                <button
                  key={interval.value}
                  onClick={() => setKlineInterval(interval.value)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    klineInterval === interval.value
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                  }`}
                >
                  {interval.label}
                </button>
              ))}
            </div>

            <div className="flex-1 relative" ref={chartContainerRef} />
          </div>

          <div className="h-48 bg-background-card border-t border-border flex flex-col">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-text-primary">最新成交</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 px-4 py-1 text-xs text-text-tertiary">
                <span>价格(USDT)</span>
                <span className="text-right">数量({currentFuturesPair.baseAsset})</span>
                <span className="text-right">时间</span>
              </div>
              {recentTrades.slice(0, 20).map((trade) => (
                <div
                  key={trade.id}
                  className="grid grid-cols-3 gap-2 px-4 py-1 text-xs hover:bg-background-hover"
                >
                  <span className={`font-number ${trade.side === 'buy' ? 'text-success' : 'text-danger'}`}>
                    {formatPrice(trade.price, currentFuturesPair.pricePrecision)}
                  </span>
                  <span className="text-right font-number text-text-primary">
                    {formatAmount(trade.amount, currentFuturesPair.amountPrecision)}
                  </span>
                  <span className="text-right text-text-tertiary font-number">
                    {formatShortTime(trade.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-80 bg-background-card border-l border-border flex flex-col overflow-hidden">
          <div className="h-56 border-b border-border flex flex-col">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">订单簿</span>
              <BarChart3 className="w-4 h-4 text-text-tertiary" />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="grid grid-cols-3 gap-1 px-3 py-1 text-xs text-text-tertiary">
                <span>价格</span>
                <span className="text-right">数量</span>
                <span className="text-right">总额</span>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col-reverse">
                {orderBook.asks.slice().reverse().map((ask, i) => {
                  const maxTotal = Math.max(...orderBook.asks.map(a => a.total))
                  const widthPercent = (ask.total / maxTotal) * 100
                  return (
                    <div key={i} className="relative grid grid-cols-3 gap-1 px-3 py-0.5 text-xs">
                      <div
                        className="absolute inset-0 depth-bar-ask"
                        style={{ width: `${widthPercent}%`, right: 0, left: 'auto' }}
                      />
                      <span className="relative font-number text-danger">{formatPrice(ask.price, currentFuturesPair.pricePrecision)}</span>
                      <span className="relative text-right font-number text-text-primary">{formatAmount(ask.amount, currentFuturesPair.amountPrecision)}</span>
                      <span className="relative text-right font-number text-text-tertiary">{formatAmount(ask.total, 2)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="px-3 py-1 bg-background-hover text-center">
                <span className={`text-base font-bold font-number ${
                  currentFuturesPair.change24h >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {formatPrice(currentFuturesPair.lastPrice, currentFuturesPair.pricePrecision)}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {orderBook.bids.map((bid, i) => {
                  const maxTotal = Math.max(...orderBook.bids.map(b => b.total))
                  const widthPercent = (bid.total / maxTotal) * 100
                  return (
                    <div key={i} className="relative grid grid-cols-3 gap-1 px-3 py-0.5 text-xs">
                      <div
                        className="absolute inset-0 depth-bar-bid"
                        style={{ width: `${widthPercent}%` }}
                      />
                      <span className="relative font-number text-success">{formatPrice(bid.price, currentFuturesPair.pricePrecision)}</span>
                      <span className="relative text-right font-number text-text-primary">{formatAmount(bid.amount, currentFuturesPair.amountPrecision)}</span>
                      <span className="relative text-right font-number text-text-tertiary">{formatAmount(bid.total, 2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTradeSide('long')}
                  className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                    tradeSide === 'long'
                      ? 'bg-success text-white btn-glow-success'
                      : 'bg-background text-text-secondary hover:bg-background-hover border border-border'
                  }`}
                >
                  开多 / 买入
                </button>
                <button
                  onClick={() => setTradeSide('short')}
                  className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                    tradeSide === 'short'
                      ? 'bg-danger text-white btn-glow-danger'
                      : 'bg-background text-text-secondary hover:bg-background-hover border border-border'
                  }`}
                >
                  开空 / 卖出
                </button>
              </div>

              <div className="flex gap-2 bg-background rounded-lg p-1">
                <button
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    orderType === 'limit'
                      ? 'bg-background-card text-text-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  限价单
                </button>
                <button
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                    orderType === 'market'
                      ? 'bg-background-card text-text-primary'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  市价单
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-tertiary">杠杆</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeverage(Math.max(1, leverage - 1))}
                      className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center text-text-secondary hover:text-text-primary"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold font-number text-primary w-12 text-center">
                      {leverage}x
                    </span>
                    <button
                      onClick={() => setLeverage(Math.min(maxLeverage, leverage + 1))}
                      className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center text-text-secondary hover:text-text-primary"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxLeverage}
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-1 text-xs text-text-tertiary">
                  <span>1x</span>
                  <span>25x</span>
                  <span>50x</span>
                  <span>75x</span>
                  <span>100x</span>
                  <span>{maxLeverage}x</span>
                </div>
              </div>

              {orderType === 'limit' && (
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">价格 (USDT)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="输入价格"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary font-number"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-text-tertiary mb-1 block">
                  数量 ({currentFuturesPair.baseAsset})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="输入数量"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary font-number"
                />
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        const maxAmount = (availableMargin * leverage) / orderPrice
                        setAmount(((maxAmount * pct) / 100).toFixed(currentFuturesPair.amountPrecision))
                      }}
                      className="flex-1 py-1 text-xs bg-background text-text-tertiary hover:text-text-primary border border-border rounded transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">可用保证金</span>
                  <span className="text-text-primary font-number">
                    {formatAmount(availableMargin, 2)} USDT
                  </span>
                </div>
                {orderAmount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">保证金所需</span>
                      <span className="text-text-primary font-number">
                        {formatAmount(marginRequired, 2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">预估强平价</span>
                      <span className={`font-number flex items-center gap-1 ${
                        tradeSide === 'long' ? 'text-danger' : 'text-success'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {formatPrice(estLiquidationPrice, currentFuturesPair.pricePrecision)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleOrderSubmit}
                disabled={!orderAmount || marginRequired > availableMargin}
                className={`w-full py-3 rounded-lg font-medium text-white transition-all ${
                  tradeSide === 'long'
                    ? 'bg-success hover:bg-success-hover btn-glow-success disabled:bg-success/50 disabled:cursor-not-allowed'
                    : 'bg-danger hover:bg-danger-hover btn-glow-danger disabled:bg-danger/50 disabled:cursor-not-allowed'
                }`}
              >
                {tradeSide === 'long' ? `开多 ${currentFuturesPair.baseAsset}` : `开空 ${currentFuturesPair.baseAsset}`}
              </button>
            </div>

            <div className="border-t border-border">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">当前持仓</span>
                <span className="text-xs text-text-tertiary">
                  {positions.length} 个持仓
                </span>
              </div>
              {positions.length === 0 ? (
                <div className="px-4 py-8 text-center text-text-tertiary text-sm">
                  暂无持仓
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {positions.map((position, index) => (
                    <div
                      key={index}
                      className="mx-3 p-3 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {position.symbol.replace('_', '/')}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            position.side === 'long'
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger'
                          }`}>
                            {position.side === 'long' ? '多' : '空'} {position.leverage}x
                          </span>
                        </div>
                        <button
                          onClick={() => handleClosePosition(index)}
                          className="text-xs px-2 py-1 bg-background-hover text-text-tertiary hover:text-danger rounded transition-colors"
                        >
                          平仓
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-text-tertiary">数量</div>
                          <div className="text-text-primary font-number">
                            {formatAmount(position.amount, 4)}
                          </div>
                        </div>
                        <div>
                          <div className="text-text-tertiary">开仓价</div>
                          <div className="text-text-primary font-number">
                            {formatPrice(position.entryPrice, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-text-tertiary">标记价</div>
                          <div className="text-text-primary font-number">
                            {formatPrice(position.markPrice, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-text-tertiary">强平价</div>
                          <div className="text-warning font-number">
                            {formatPrice(position.liquidationPrice, 2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-text-tertiary">保证金</div>
                          <div className="text-text-primary font-number">
                            {formatAmount(position.margin, 2)} USDT
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-text-tertiary">未实现盈亏</div>
                          <div className={`font-bold font-number ${
                            position.unrealizedPnl >= 0 ? 'text-success' : 'text-danger'
                          }`}>
                            {position.unrealizedPnl >= 0 ? '+' : ''}
                            {formatAmount(position.unrealizedPnl, 2)} USDT
                          </div>
                          <div className={`text-xs font-number ${
                            position.unrealizedPnlPercent >= 0 ? 'text-success' : 'text-danger'
                          }`}>
                            ({formatPercent(position.unrealizedPnlPercent)})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
