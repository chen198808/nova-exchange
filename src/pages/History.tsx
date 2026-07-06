import { useState, useMemo } from 'react'
import { Search, Calendar, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Receipt, CircleCheck, CircleDashed, XCircle, ChevronDown, Filter } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useMarketStore } from '@/store/marketStore'
import { formatTime, formatAmount } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { RecordStatus } from '@/types'

type TabType = 'all' | 'deposit' | 'withdraw' | 'trade' | 'fee'

interface HistoryRecord {
  id: string
  type: 'deposit' | 'withdraw' | 'trade' | 'fee'
  asset: string
  amount: number
  status: RecordStatus
  timestamp: number
  remark: string
  txId?: string
}

const tabs: { key: TabType; name: string; icon: typeof ArrowDownToLine }[] = [
  { key: 'all', name: '全部', icon: Receipt },
  { key: 'deposit', name: '充值', icon: ArrowDownToLine },
  { key: 'withdraw', name: '提现', icon: ArrowUpFromLine },
  { key: 'trade', name: '交易', icon: ArrowLeftRight },
  { key: 'fee', name: '手续费', icon: Receipt },
]

export default function History() {
  const { depositRecords, withdrawRecords, orders } = useUserStore()
  const { coins } = useMarketStore()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)

  const getCoinInfo = (symbol: string) => {
    return coins.find(c => c.symbol === symbol)
  }

  const allRecords: HistoryRecord[] = useMemo(() => {
    const records: HistoryRecord[] = []

    depositRecords.forEach(r => {
      records.push({
        id: r.id,
        type: 'deposit',
        asset: r.asset,
        amount: r.amount,
        status: r.status,
        timestamp: r.timestamp,
        remark: `${r.asset} 充值`,
        txId: r.txId,
      })
    })

    withdrawRecords.forEach(r => {
      records.push({
        id: r.id,
        type: 'withdraw',
        asset: r.asset,
        amount: r.amount,
        status: r.status,
        timestamp: r.timestamp,
        remark: `${r.asset} 提现`,
        txId: r.txId,
      })
    })

    orders.forEach(o => {
      const [baseAsset] = o.symbol.split('_')
      records.push({
        id: o.id,
        type: 'trade',
        asset: baseAsset,
        amount: o.amount,
        status: o.status === 'filled' ? 'completed' : o.status === 'cancelled' ? 'failed' : 'pending',
        timestamp: o.timestamp,
        remark: `${o.side === 'buy' ? '买入' : '卖出'} ${baseAsset}`,
      })
    })

    records.sort((a, b) => b.timestamp - a.timestamp)
    return records
  }, [depositRecords, withdrawRecords, orders])

  const filteredRecords = useMemo(() => {
    let result = allRecords

    if (activeTab !== 'all') {
      result = result.filter(r => r.type === activeTab)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(r =>
        r.asset.toLowerCase().includes(query) ||
        r.remark.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query)
      )
    }

    if (startDate) {
      const start = new Date(startDate).getTime()
      result = result.filter(r => r.timestamp >= start)
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000
      result = result.filter(r => r.timestamp <= end)
    }

    return result
  }, [allRecords, activeTab, searchQuery, startDate, endDate])

  const getTypeInfo = (type: HistoryRecord['type']) => {
    switch (type) {
      case 'deposit':
        return { text: '充值', color: 'text-success', bg: 'bg-success/10', icon: ArrowDownToLine, sign: '+' }
      case 'withdraw':
        return { text: '提现', color: 'text-danger', bg: 'bg-danger/10', icon: ArrowUpFromLine, sign: '-' }
      case 'trade':
        return { text: '交易', color: 'text-primary', bg: 'bg-primary/10', icon: ArrowLeftRight, sign: '' }
      case 'fee':
        return { text: '手续费', color: 'text-warning', bg: 'bg-warning/10', icon: Receipt, sign: '-' }
      default:
        return { text: '未知', color: 'text-text-secondary', bg: 'bg-background-lighter', icon: Receipt, sign: '' }
    }
  }

  const getStatusInfo = (status: RecordStatus) => {
    switch (status) {
      case 'completed':
        return { text: '已完成', color: 'text-success', bg: 'bg-success/10', icon: CircleCheck }
      case 'pending':
        return { text: '处理中', color: 'text-warning', bg: 'bg-warning/10', icon: CircleDashed }
      case 'failed':
        return { text: '失败', color: 'text-danger', bg: 'bg-danger/10', icon: XCircle }
      default:
        return { text: '未知', color: 'text-text-secondary', bg: 'bg-background-lighter', icon: CircleDashed }
    }
  }

  return (
    <div className="bg-background-card border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            流水记录
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="搜索币种/备注..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-background-lighter border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 px-4 py-2 bg-background-lighter border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                日期筛选
                <ChevronDown className={cn("w-4 h-4 transition-transform", showDateFilter && "rotate-180")} />
              </button>

              {showDateFilter && (
                <div className="absolute right-0 top-full mt-2 z-10 bg-background-card border border-border rounded-lg p-4 shadow-lg w-72">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">开始日期</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-background-lighter border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">结束日期</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-background-lighter border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setStartDate('')
                          setEndDate('')
                        }}
                        className="flex-1 py-2 text-sm text-text-secondary hover:text-text-primary bg-background-lighter hover:bg-background-hover rounded-lg transition-colors"
                      >
                        重置
                      </button>
                      <button
                        onClick={() => setShowDateFilter(false)}
                        className="flex-1 py-2 text-sm text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
                      >
                        确定
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-background-lighter rounded-lg w-fit overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-background-card text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background-lighter/50">
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">币种</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">数量</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Filter className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary">暂无记录</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const typeInfo = getTypeInfo(record.type)
                const TypeIcon = typeInfo.icon
                const statusInfo = getStatusInfo(record.status)
                const StatusIcon = statusInfo.icon
                const coin = getCoinInfo(record.asset)

                return (
                  <tr key={record.id} className="row-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-text-primary text-sm">{formatTime(record.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium", typeInfo.bg, typeInfo.color)}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        {typeInfo.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-background-lighter flex items-center justify-center text-xs font-bold">
                          {coin?.icon || record.asset[0]}
                        </div>
                        <span className="font-medium text-text-primary">{record.asset}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={cn(
                        "font-number font-medium",
                        record.type === 'deposit' ? 'text-success' : record.type === 'withdraw' ? 'text-danger' : 'text-text-primary'
                      )}>
                        {typeInfo.sign}{formatAmount(record.amount, 6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", statusInfo.bg, statusInfo.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-sm hidden md:table-cell">
                      {record.remark}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredRecords.length > 0 && (
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm text-text-secondary">
          <span>共 {filteredRecords.length} 条记录</span>
        </div>
      )}
    </div>
  )
}
