import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, StarOff, TrendingUp, TrendingDown, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { useMarketStore } from '@/store/marketStore'
import { formatPrice, formatVolume, formatPercent } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { TradingPair } from '@/types'

type TabType = 'all' | 'usdt' | 'solana' | 'hot'
type SortField = 'change24h' | 'lastPrice' | 'volume24h'
type SortOrder = 'asc' | 'desc'

const tabs: { key: TabType; name: string }[] = [
  { key: 'all', name: '全部' },
  { key: 'usdt', name: 'USDT交易区' },
  { key: 'solana', name: 'Solana生态' },
  { key: 'hot', name: '热门' },
]

export default function Markets() {
  const navigate = useNavigate()
  const { tradingPairs, coins } = useMarketStore()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('change24h')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const getCoinInfo = (symbol: string) => {
    return coins.find(c => c.symbol === symbol)
  }

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(symbol)) {
        next.delete(symbol)
      } else {
        next.add(symbol)
      }
      return next
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredPairs = useMemo(() => {
    let result = [...tradingPairs]

    if (activeTab === 'usdt') {
      result = result.filter(p => p.quoteAsset === 'USDT')
    } else if (activeTab === 'solana') {
      result = result.filter(p => p.baseAsset === 'SOL' || p.baseAsset === 'RS')
    } else if (activeTab === 'hot') {
      result = result.filter(p => Math.abs(p.change24h) > 3 || p.quoteVolume24h > 1e9)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.symbol.toLowerCase().includes(query) ||
        p.baseAsset.toLowerCase().includes(query)
      )
    }

    result.sort((a, b) => {
      let aVal: number
      let bVal: number
      switch (sortField) {
        case 'change24h':
          aVal = a.change24h
          bVal = b.change24h
          break
        case 'lastPrice':
          aVal = a.lastPrice
          bVal = b.lastPrice
          break
        case 'volume24h':
          aVal = a.quoteVolume24h
          bVal = b.quoteVolume24h
          break
        default:
          return 0
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [tradingPairs, activeTab, searchQuery, sortField, sortOrder])

  const handleRowClick = (pair: TradingPair) => {
    navigate(`/trade/${pair.symbol}`)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-4">行情中心</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="搜索币种..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background-card border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-background-lighter rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === tab.key
                  ? "bg-background-card text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-12"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">币种</th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('lastPrice')}
                >
                  <div className="flex items-center justify-end gap-1">
                    最新价
                    <SortIcon field="lastPrice" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('change24h')}
                >
                  <div className="flex items-center justify-end gap-1">
                    24h涨跌幅
                    <SortIcon field="change24h" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">24h最高</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">24h最低</th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary hidden lg:table-cell"
                  onClick={() => handleSort('volume24h')}
                >
                  <div className="flex items-center justify-end gap-1">
                    24h成交量
                    <SortIcon field="volume24h" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredPairs.map((pair) => {
                const coin = getCoinInfo(pair.baseAsset)
                const isUp = pair.change24h >= 0
                const isFavorite = favorites.has(pair.symbol)

                return (
                  <tr
                    key={pair.symbol}
                    className="row-hover cursor-pointer transition-colors"
                    onClick={() => handleRowClick(pair)}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => toggleFavorite(pair.symbol, e)}
                        className="p-1 hover:bg-background-hover rounded transition-colors"
                      >
                        {isFavorite ? (
                          <Star className="w-4 h-4 text-warning fill-warning" />
                        ) : (
                          <StarOff className="w-4 h-4 text-text-tertiary hover:text-text-secondary" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background-lighter flex items-center justify-center text-sm font-bold">
                          {coin?.icon || pair.baseAsset[0]}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            {pair.baseAsset}
                            <span className="text-text-tertiary ml-1">/ {pair.quoteAsset}</span>
                          </div>
                          <div className="text-xs text-text-tertiary">{coin?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn(
                        "font-number font-medium",
                        isUp ? "text-success" : "text-danger"
                      )}>
                        {formatPrice(pair.lastPrice, pair.pricePrecision)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md font-number text-sm font-medium",
                        isUp
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      )}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(pair.change24h)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-text-primary font-number hidden md:table-cell">
                      {formatPrice(pair.high24h, pair.pricePrecision)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-primary font-number hidden md:table-cell">
                      {formatPrice(pair.low24h, pair.pricePrecision)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary font-number hidden lg:table-cell">
                      {formatVolume(pair.quoteVolume24h)} {pair.quoteAsset}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRowClick(pair)
                        }}
                        className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors font-medium"
                      >
                        交易
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredPairs.length === 0 && (
          <div className="py-16 text-center">
            <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">没有找到匹配的交易对</p>
          </div>
        )}
      </div>
    </div>
  )
}
