import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, Lock, Unlock, PieChart, ArrowDownToLine, ArrowUpFromLine, ChevronRight, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import { useMarketStore } from '@/store/marketStore'
import { formatPrice, formatAmount } from '@/utils/format'

const tabs = [
  { name: '资产总览', path: '/assets' },
  { name: '充值', path: '/assets/deposit' },
  { name: '提现', path: '/assets/withdraw' },
  { name: '历史记录', path: '/assets/history' },
]

const pieColors = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
]

export default function AssetsOverview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { balances } = useUserStore()
  const { coins } = useMarketStore()

  const isOverview = location.pathname === '/assets'

  const getCoinPrice = (symbol: string): number => {
    if (symbol === 'USDT') return 1
    const coin = coins.find(c => c.symbol === symbol)
    return coin?.price || 0
  }

  const totalAssetValue = balances.reduce((sum, b) => {
    const price = getCoinPrice(b.asset)
    return sum + b.total * price
  }, 0)

  const freeAssetValue = balances.reduce((sum, b) => {
    const price = getCoinPrice(b.asset)
    return sum + b.free * price
  }, 0)

  const lockedAssetValue = balances.reduce((sum, b) => {
    const price = getCoinPrice(b.asset)
    return sum + b.locked * price
  }, 0)

  const spotValue = totalAssetValue
  const futuresValue = totalAssetValue * 0.3

  const pieData = balances
    .map(b => ({
      asset: b.asset,
      value: b.total * getCoinPrice(b.asset),
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0)

  const conicGradient = pieData.map((d, i) => {
    const startPercent = (pieData.slice(0, i).reduce((s, p) => s + p.value, 0) / pieTotal) * 100
    const endPercent = (startPercent + (d.value / pieTotal) * 100)
    return `${pieColors[i % pieColors.length]} ${startPercent}% ${endPercent}%`
  }).join(', ')

  const displayBalances = balances
    .map(b => ({
      ...b,
      value: b.total * getCoinPrice(b.asset),
      price: getCoinPrice(b.asset),
    }))
    .sort((a, b) => b.value - a.value)

  if (!isOverview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-4">资产管理</h1>
          <div className="flex gap-1 p-1 bg-background-lighter rounded-lg w-fit overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = tab.path === '/assets'
                ? location.pathname === '/assets'
                : location.pathname.startsWith(tab.path)
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-background-card text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {tab.name}
                </Link>
              )
            })}
          </div>
        </div>
        <Outlet />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-4">资产管理</h1>
        <div className="flex gap-1 p-1 bg-background-lighter rounded-lg w-fit overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.path === '/assets'
              ? location.pathname === '/assets'
              : location.pathname.startsWith(tab.path)
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-background-card text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {tab.name}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-text-secondary text-sm">总资产估值</span>
          </div>
          <div className="text-2xl font-bold text-text-primary font-number">
            ${formatPrice(totalAssetValue, 2)}
          </div>
          <div className="text-text-tertiary text-sm mt-1">≈ {formatPrice(totalAssetValue, 2)} USDT</div>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-success" />
            </div>
            <span className="text-text-secondary text-sm">币币账户</span>
          </div>
          <div className="text-2xl font-bold text-text-primary font-number">
            ${formatPrice(spotValue, 2)}
          </div>
          <div className="text-success text-sm mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +2.35%
          </div>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <span className="text-text-secondary text-sm">合约账户</span>
          </div>
          <div className="text-2xl font-bold text-text-primary font-number">
            ${formatPrice(futuresValue, 2)}
          </div>
          <div className="text-text-tertiary text-sm mt-1">USDT本位永续</div>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Unlock className="w-4 h-4 text-success" />
                <span className="text-text-secondary text-sm">可用</span>
              </div>
              <div className="text-lg font-bold text-text-primary font-number">
                ${formatPrice(freeAssetValue, 2)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lock className="w-4 h-4 text-warning" />
                <span className="text-text-secondary text-sm">冻结</span>
              </div>
              <div className="text-lg font-bold text-text-primary font-number">
                ${formatPrice(lockedAssetValue, 2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-background-card border border-border rounded-xl p-5 lg:col-span-1">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            资产分布
          </h3>
          <div className="flex flex-col items-center">
            <div
              className="w-40 h-40 rounded-full relative mb-4"
              style={{
                background: `conic-gradient(${conicGradient})`,
              }}
            >
              <div className="absolute inset-4 bg-background-card rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-text-tertiary">总资产</div>
                  <div className="text-sm font-bold text-text-primary font-number">
                    ${formatPrice(pieTotal, 0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full space-y-2">
              {pieData.map((item, i) => (
                <div key={item.asset} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pieColors[i % pieColors.length] }}
                    />
                    <span className="text-text-primary">{item.asset}</span>
                  </div>
                  <span className="text-text-secondary font-number">
                    {((item.value / pieTotal) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">币币账户余额</h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/assets/deposit')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-success/10 text-success hover:bg-success/20 rounded-md transition-colors font-medium"
              >
                <ArrowDownToLine className="w-4 h-4" />
                充值
              </button>
              <button
                onClick={() => navigate('/assets/withdraw')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-warning/10 text-warning hover:bg-warning/20 rounded-md transition-colors font-medium"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                提现
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">币种</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">总余额</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">可用</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">冻结</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">估值</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {displayBalances.map((balance) => (
                  <tr key={balance.asset} className="row-hover transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-background-lighter flex items-center justify-center text-xs font-bold">
                          {balance.asset[0]}
                        </div>
                        <span className="font-medium text-text-primary">{balance.asset}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-text-primary font-number">
                      {formatAmount(balance.total, 6)}
                    </td>
                    <td className="px-3 py-3 text-right text-text-secondary font-number hidden sm:table-cell">
                      {formatAmount(balance.free, 6)}
                    </td>
                    <td className="px-3 py-3 text-right text-text-secondary font-number hidden sm:table-cell">
                      {formatAmount(balance.locked, 6)}
                    </td>
                    <td className="px-3 py-3 text-right text-text-primary font-number">
                      ${formatPrice(balance.value, 2)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/assets/deposit?asset=${balance.asset}`)}
                          className="p-1.5 text-text-tertiary hover:text-success hover:bg-success/10 rounded transition-colors"
                          title="充值"
                        >
                          <ArrowDownToLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/assets/withdraw?asset=${balance.asset}`)}
                          className="p-1.5 text-text-tertiary hover:text-warning hover:bg-warning/10 rounded transition-colors"
                          title="提现"
                        >
                          <ArrowUpFromLine className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/assets/deposit')}
          className="bg-background-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-background-hover transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowDownToLine className="w-6 h-6 text-success" />
          </div>
          <div className="font-medium text-text-primary mb-1">充值</div>
          <div className="text-sm text-text-tertiary flex items-center gap-1">
            立即充值
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        <button
          onClick={() => navigate('/assets/withdraw')}
          className="bg-background-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-background-hover transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowUpFromLine className="w-6 h-6 text-warning" />
          </div>
          <div className="font-medium text-text-primary mb-1">提现</div>
          <div className="text-sm text-text-tertiary flex items-center gap-1">
            快速提现
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        <button
          onClick={() => navigate('/assets/history')}
          className="bg-background-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-background-hover transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PieChart className="w-6 h-6 text-primary" />
          </div>
          <div className="font-medium text-text-primary mb-1">流水记录</div>
          <div className="text-sm text-text-tertiary flex items-center gap-1">
            查看历史
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        <button
          onClick={() => navigate('/trade/BTC_USDT')}
          className="bg-background-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-background-hover transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-danger" />
          </div>
          <div className="font-medium text-text-primary mb-1">去交易</div>
          <div className="text-sm text-text-tertiary flex items-center gap-1">
            开始交易
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>
    </div>
  )
}
