import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ArrowUpFromLine, BookOpen, AlertTriangle, Clock, CircleCheck, CircleDashed, XCircle, ExternalLink, Wallet, Info } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useMarketStore } from '@/store/marketStore'
import { formatTime, formatAmount } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { WithdrawRecord, RecordStatus } from '@/types'

const withdrawChains: Record<string, { name: string; fee: number; minWithdraw: number }[]> = {
  USDT: [
    { name: 'Solana', fee: 1, minWithdraw: 20 },
    { name: 'ERC20', fee: 5, minWithdraw: 50 },
  ],
  BTC: [
    { name: 'Bitcoin', fee: 0.0005, minWithdraw: 0.002 },
  ],
  ETH: [
    { name: 'ERC20', fee: 0.005, minWithdraw: 0.02 },
  ],
  SOL: [
    { name: 'Solana', fee: 0.01, minWithdraw: 0.5 },
  ],
  RS: [
    { name: 'Solana', fee: 10, minWithdraw: 200 },
  ],
  BNB: [
    { name: 'BEP20', fee: 0.01, minWithdraw: 0.1 },
  ],
  XRP: [
    { name: 'XRP Ledger', fee: 0.2, minWithdraw: 20 },
  ],
  DOGE: [
    { name: 'Dogecoin', fee: 2, minWithdraw: 100 },
  ],
  ADA: [
    { name: 'Cardano', fee: 0.3, minWithdraw: 10 },
  ],
  AVAX: [
    { name: 'Avalanche C-Chain', fee: 0.05, minWithdraw: 1 },
  ],
}

const defaultChain = { name: 'Solana', fee: 1, minWithdraw: 20 }

export default function Withdraw() {
  const [searchParams] = useSearchParams()
  const { coins } = useMarketStore()
  const { withdrawRecords, balances, withdraw } = useUserStore()
  const [selectedAsset, setSelectedAsset] = useState('USDT')
  const [selectedChainIndex, setSelectedChainIndex] = useState(0)
  const [showAssetDropdown, setShowAssetDropdown] = useState(false)
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [showAddressBook, setShowAddressBook] = useState(false)

  const availableAssets = Object.keys(withdrawChains)

  const addressBook = [
    { label: '我的主钱包', address: '9rGfe8WuFhNbK7Yq2cV3pR4tS6wX8yZ1aD2eF3gH4iJ5', chain: 'Solana' },
    { label: '交易所钱包', address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', chain: 'ERC20' },
  ]

  useEffect(() => {
    const asset = searchParams.get('asset')
    if (asset && withdrawChains[asset]) {
      setSelectedAsset(asset)
      setSelectedChainIndex(0)
    }
  }, [searchParams])

  const chainOptions = withdrawChains[selectedAsset] || [defaultChain]
  const currentChain = chainOptions[selectedChainIndex] || defaultChain

  const getCoinInfo = (symbol: string) => {
    return coins.find(c => c.symbol === symbol)
  }

  const getBalance = (asset: string) => {
    return balances.find(b => b.asset === asset)?.free || 0
  }

  const availableBalance = getBalance(selectedAsset)
  const amountNum = parseFloat(amount) || 0
  const fee = currentChain.fee
  const actualReceive = Math.max(0, amountNum - fee)
  const isAmountValid = amountNum >= currentChain.minWithdraw && amountNum + fee <= availableBalance && address.trim().length > 0

  const handleWithdraw = () => {
    if (!isAmountValid) return
    const result = withdraw(selectedAsset, amountNum, address, fee)
    if (result) {
      setAmount('')
      setAddress('')
    }
  }

  const handleMax = () => {
    const maxAmount = Math.max(0, availableBalance - fee)
    setAmount(maxAmount > 0 ? maxAmount.toString() : '0')
  }

  const selectAddress = (addr: string) => {
    setAddress(addr)
    setShowAddressBook(false)
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-warning" />
            提现
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">选择币种</label>
            <div className="relative">
              <button
                onClick={() => setShowAssetDropdown(!showAssetDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-background-lighter border border-border rounded-lg text-text-primary hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-background-card flex items-center justify-center text-sm font-bold">
                    {getCoinInfo(selectedAsset)?.icon || selectedAsset[0]}
                  </div>
                  <div>
                    <div className="font-medium">{selectedAsset}</div>
                    <div className="text-xs text-text-tertiary">可用: {formatAmount(availableBalance, 6)}</div>
                  </div>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-text-tertiary transition-transform", showAssetDropdown && "rotate-180")} />
              </button>

              {showAssetDropdown && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {availableAssets.map((asset) => {
                    const coin = getCoinInfo(asset)
                    return (
                      <button
                        key={asset}
                        onClick={() => {
                          setSelectedAsset(asset)
                          setSelectedChainIndex(0)
                          setShowAssetDropdown(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-left",
                          selectedAsset === asset && "bg-primary/5"
                        )}
                      >
                        <div className="w-7 h-7 rounded-full bg-background-lighter flex items-center justify-center text-xs font-bold">
                          {coin?.icon || asset[0]}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{asset}</div>
                          <div className="text-xs text-text-tertiary">{coin?.name}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {chainOptions.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">选择链网络</label>
              <div className="flex flex-wrap gap-2">
                {chainOptions.map((chain, index) => (
                  <button
                    key={chain.name}
                    onClick={() => setSelectedChainIndex(index)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                      selectedChainIndex === index
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-background-lighter text-text-secondary border-border hover:border-primary/30"
                    )}
                  >
                    {chain.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-secondary">提币地址</label>
              <button
                onClick={() => setShowAddressBook(!showAddressBook)}
                className="text-sm text-primary hover:text-primary-light flex items-center gap-1"
              >
                <BookOpen className="w-4 h-4" />
                地址簿
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={`请输入 ${currentChain.name} 网络地址`}
                className="w-full px-4 py-3 bg-background-lighter border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
              {showAddressBook && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {addressBook.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectAddress(item.address)}
                      className="w-full px-4 py-3 hover:bg-background-hover transition-colors text-left border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-text-primary">{item.label}</span>
                        <span className="text-xs text-text-tertiary bg-background-lighter px-2 py-0.5 rounded">{item.chain}</span>
                      </div>
                      <div className="text-sm text-text-secondary font-mono truncate">{item.address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-secondary">提现数量</label>
              <div className="flex items-center gap-1 text-sm text-text-tertiary">
                <Wallet className="w-3.5 h-3.5" />
                可用: <span className="text-text-primary font-number font-medium">{formatAmount(availableBalance, 6)}</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入数量"
                className="w-full px-4 py-3 pr-20 bg-background-lighter border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors font-number"
              />
              <button
                onClick={handleMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
              >
                全部
              </button>
            </div>
            <div className="text-xs text-text-tertiary mt-1.5">
              最小提现数量: {currentChain.minWithdraw} {selectedAsset}
            </div>
          </div>

          <div className="bg-background-lighter border border-border rounded-xl p-4 mb-6">
            <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              费用明细
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">提现数量</span>
                <span className="text-text-primary font-number">{formatAmount(amountNum, 6)} {selectedAsset}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">网络手续费</span>
                <span className="text-text-primary font-number">{formatAmount(fee, 6)} {selectedAsset}</span>
              </div>
              <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                <span className="text-text-primary font-medium">实际到账</span>
                <span className="text-success font-number font-bold text-lg">{formatAmount(actualReceive, 6)} {selectedAsset}</span>
              </div>
            </div>
          </div>

          {amountNum > 0 && amountNum < currentChain.minWithdraw && (
            <div className="mb-4 p-3 bg-warning/5 border border-warning/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-sm text-warning">数量低于最小提现要求</span>
            </div>
          )}
          {amountNum + fee > availableBalance && amountNum > 0 && (
            <div className="mb-4 p-3 bg-danger/5 border border-danger/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
              <span className="text-sm text-danger">余额不足（含手续费）</span>
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={!isAmountValid}
            className={cn(
              "w-full py-3.5 rounded-lg font-medium text-white transition-all",
              isAmountValid
                ? "bg-danger hover:bg-danger-hover btn-glow-danger"
                : "bg-text-muted cursor-not-allowed opacity-50"
            )}
          >
            确认提现
          </button>
        </div>

        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-text-primary mb-1">安全提醒</h4>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>• 请务必确认地址正确，提币成功后将无法撤销</li>
                <li>• 请勿向任何人透露您的验证码或私钥</li>
                <li>• 首次提币建议先小额测试</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            提现记录
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {withdrawRecords.length === 0 ? (
              <div className="py-8 text-center">
                <Wallet className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">暂无提现记录</p>
              </div>
            ) : (
              withdrawRecords.map((record: WithdrawRecord) => {
                const statusInfo = getStatusInfo(record.status)
                const StatusIcon = statusInfo.icon
                return (
                  <div
                    key={record.id}
                    className="p-3 bg-background-lighter rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-background-card flex items-center justify-center text-xs font-bold">
                          {getCoinInfo(record.asset)?.icon || record.asset[0]}
                        </div>
                        <span className="font-medium text-text-primary">{record.asset}</span>
                      </div>
                      <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", statusInfo.bg, statusInfo.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.text}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-tertiary">数量</span>
                      <span className="text-danger font-number font-medium">
                        -{formatAmount(record.amount, 6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-tertiary">手续费</span>
                      <span className="text-text-secondary font-number">
                        {formatAmount(record.fee, 6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary">{formatTime(record.timestamp)}</span>
                      {record.txId && (
                        <button className="text-primary hover:text-primary-light flex items-center gap-1">
                          <span className="font-mono truncate max-w-[100px]">{record.txId}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
