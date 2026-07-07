import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Check, ChevronDown, ArrowDownToLine, Info, Hash, Clock, CircleCheck, CircleDashed, XCircle, ExternalLink } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useMarketStore } from '@/store/marketStore'
import { formatTime, formatAmount } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { DepositRecord, RecordStatus } from '@/types'
import { api } from '@/services/api'

const chainsBase: Record<string, { name: string; minDeposit: number; confirmations: number }[]> = {
  USDT: [
    { name: 'Solana', minDeposit: 10, confirmations: 12 },
    { name: 'ERC20', minDeposit: 20, confirmations: 6 },
  ],
  BTC: [
    { name: 'Bitcoin', minDeposit: 0.001, confirmations: 6 },
  ],
  ETH: [
    { name: 'ERC20', minDeposit: 0.01, confirmations: 12 },
  ],
  SOL: [
    { name: 'Solana', minDeposit: 0.1, confirmations: 12 },
  ],
  RS: [
    { name: 'Solana', minDeposit: 100, confirmations: 12 },
  ],
  BNB: [
    { name: 'BEP20', minDeposit: 0.05, confirmations: 6 },
  ],
  XRP: [
    { name: 'XRP Ledger', minDeposit: 10, confirmations: 6 },
  ],
  DOGE: [
    { name: 'Dogecoin', minDeposit: 50, confirmations: 6 },
  ],
  ADA: [
    { name: 'Cardano', minDeposit: 5, confirmations: 15 },
  ],
  AVAX: [
    { name: 'Avalanche C-Chain', minDeposit: 0.5, confirmations: 6 },
  ],
}

const defaultChain = { name: 'Solana', address: '9rGfe8WuFhNbK7Yq2cV3pR4tS6wX8yZ1aD2eF3gH4iJ5', minDeposit: 10, confirmations: 12 }

export default function Deposit() {
  const [searchParams] = useSearchParams()
  const { coins } = useMarketStore()
  const { depositRecords, balances } = useUserStore()
  const [selectedAsset, setSelectedAsset] = useState('USDT')
  const [selectedChainIndex, setSelectedChainIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showAssetDropdown, setShowAssetDropdown] = useState(false)
  const [depositAddress, setDepositAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const availableAssets = Object.keys(chainsBase)

  useEffect(() => {
    const asset = searchParams.get('asset')
    if (asset && chainsBase[asset]) {
      setSelectedAsset(asset)
      setSelectedChainIndex(0)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchDepositAddress = async () => {
      try {
        const data = await api.assets.getDepositAddress()
        setDepositAddress(data.address)
      } catch (error) {
        console.error('Failed to fetch deposit address:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDepositAddress()
  }, [])

  const chainOptions = chainsBase[selectedAsset] || [{ name: 'Solana', minDeposit: 10, confirmations: 12 }]
  const currentChain = chainOptions[selectedChainIndex] || { name: 'Solana', minDeposit: 10, confirmations: 12 }

  const getCoinInfo = (symbol: string) => {
    return coins.find(c => c.symbol === symbol)
  }

  const getBalance = (asset: string) => {
    return balances.find(b => b.asset === asset)?.free || 0
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      const textArea = document.createElement('textarea')
      textArea.value = depositAddress
      textArea.style.position = 'fixed'
      textArea.style.left = '-99999px'
      textArea.style.top = '-99999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const getStatusInfo = (status: RecordStatus) => {
    switch (status) {
      case 'completed':
        return { text: '已完成', color: 'text-success', bg: 'bg-success/10', icon: CircleCheck }
      case 'pending':
        return { text: '确认中', color: 'text-warning', bg: 'bg-warning/10', icon: CircleDashed }
      case 'failed':
        return { text: '失败', color: 'text-danger', bg: 'bg-danger/10', icon: XCircle }
      default:
        return { text: '未知', color: 'text-text-secondary', bg: 'bg-background-lighter', icon: CircleDashed }
    }
  }

  const generateQRPattern = () => {
    const size = 21
    const pattern: boolean[][] = []
    for (let i = 0; i < size; i++) {
      pattern[i] = []
      for (let j = 0; j < size; j++) {
        if (i < 7 && j < 7) {
          pattern[i][j] = !(i === 0 || i === 6 || j === 0 || j === 6) || (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        } else if (i < 7 && j >= size - 7) {
          const jj = j - (size - 7)
          pattern[i][j] = !(i === 0 || i === 6 || jj === 0 || jj === 6) || (i >= 2 && i <= 4 && jj >= 2 && jj <= 4)
        } else if (i >= size - 7 && j < 7) {
          const ii = i - (size - 7)
          pattern[i][j] = !(ii === 0 || ii === 6 || j === 0 || j === 6) || (ii >= 2 && ii <= 4 && j >= 2 && j <= 4)
        } else {
          pattern[i][j] = Math.random() > 0.5
        }
      }
    }
    return pattern
  }

  const qrPattern = generateQRPattern()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-success" />
            充值
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
                    <div className="text-xs text-text-tertiary">可用: {formatAmount(getBalance(selectedAsset), 6)}</div>
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
            <label className="block text-sm font-medium text-text-secondary mb-2">充值地址</label>
            <div className="bg-background-lighter border border-border rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-36 h-36 bg-white p-3 rounded-lg flex-shrink-0">
                  <div className="w-full h-full grid gap-px" style={{ gridTemplateColumns: `repeat(${qrPattern.length}, 1fr)` }}>
                    {qrPattern.flat().map((filled, idx) => (
                      <div
                        key={idx}
                        className={filled ? 'bg-black' : 'bg-white'}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="text-text-tertiary text-sm mb-2">{currentChain.name} 网络</div>
                  <div className="flex items-start gap-2 mb-3">
                    {isLoading ? (
                      <div className="flex-1 text-sm text-text-secondary bg-background-card border border-border rounded-lg p-3">
                        加载中...
                      </div>
                    ) : (
                      <code
                        className="flex-1 text-sm text-text-primary bg-background-card border border-border rounded-lg p-3 break-all font-mono select-all cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          try {
                            const range = document.createRange()
                            range.selectNodeContents(e.currentTarget)
                            const selection = window.getSelection()
                            selection?.removeAllRanges()
                            selection?.addRange(range)
                          } catch (err) {
                            console.error('Select failed:', err)
                          }
                        }}
                        title="点击选中文本"
                      >
                        {depositAddress}
                      </code>
                    )}
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={!depositAddress}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      copied
                        ? "bg-success/10 text-success"
                        : depositAddress
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-background-lighter text-text-tertiary cursor-not-allowed"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制地址
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-text-primary mb-2">充值须知</h4>
                <ul className="space-y-1 text-sm text-text-secondary">
                  <li>• 最小充值数量：<span className="text-text-primary font-medium">{currentChain.minDeposit} {selectedAsset}</span></li>
                  <li>• 确认数要求：<span className="text-text-primary font-medium">{currentChain.confirmations} 个网络确认</span></li>
                  <li>• 请确保充值地址与所选链网络一致，否则将导致资产丢失</li>
                  <li>• 充值到账时间取决于网络拥堵情况</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            充值记录
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {depositRecords.length === 0 ? (
              <div className="py-8 text-center">
                <Hash className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">暂无充值记录</p>
              </div>
            ) : (
              depositRecords.map((record: DepositRecord) => {
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
                      <span className="text-text-primary font-number font-medium">
                        +{formatAmount(record.amount, 6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-tertiary">确认数</span>
                      <span className="text-text-secondary font-number">
                        {record.confirmations || 0}/{currentChain.confirmations}
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
