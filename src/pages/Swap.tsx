import React, { useState, useEffect } from 'react'
import { ArrowDownUp, RefreshCw, TrendingUp, Coins, AlertCircle } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useNavigate } from 'react-router-dom'

const SUPPORTED_TOKENS = [
  { symbol: 'RS', name: 'RS Token', icon: '🪙' },
  { symbol: 'USDT', name: 'Tether', icon: '💵' },
  { symbol: 'SOL', name: 'Solana', icon: '☀️' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
]

function SwapPage() {
  const navigate = useNavigate()
  const { isLoggedIn, balances, getBalance, swap, getQuote, fetchBalances } = useUserStore()
  
  const [fromToken, setFromToken] = useState('RS')
  const [toToken, setToToken] = useState('USDT')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [slippage, setSlippage] = useState(0.5)

  const fromBalance = getBalance(fromToken)?.free || 0
  const toBalance = getBalance(toToken)?.free || 0

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (isLoggedIn && fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote()
    } else {
      setToAmount('')
      setPrice(null)
    }
  }, [fromAmount, fromToken, toToken])

  const fetchQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return
    
    setQuoteLoading(true)
    try {
      const result = await getQuote(fromToken, toToken, parseFloat(fromAmount), slippage * 100)
      if (result) {
        setToAmount(result.outputAmount?.toFixed(6) || '')
        setPrice(result.price || null)
      }
    } catch (error) {
      console.error('Quote error:', error)
    } finally {
      setQuoteLoading(false)
    }
  }

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return
    if (parseFloat(fromAmount) > fromBalance) {
      alert('余额不足')
      return
    }

    setLoading(true)
    try {
      const success = await swap(fromToken, toToken, parseFloat(fromAmount), slippage * 100)
      if (success) {
        alert('兑换成功！')
        setFromAmount('')
        setToAmount('')
        fetchBalances()
      }
    } catch (error: any) {
      alert('兑换失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const setMaxAmount = () => {
    setFromAmount(fromBalance.toString())
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">闪兑</h1>
          <p className="text-gray-600 dark:text-gray-400">快速兑换您的数字资产</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">从</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  可用: {fromBalance.toFixed(4)} {fromToken}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORTED_TOKENS.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.icon} {token.symbol}
                    </option>
                  ))}
                </select>
                <div className="flex-1">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-right text-2xl font-bold text-gray-900 dark:text-white focus:outline-none placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={setMaxAmount}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  最大
                </button>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={handleSwapTokens}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <ArrowDownUp size={20} />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">到</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  可用: {toBalance.toFixed(4)} {toToken}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORTED_TOKENS.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.icon} {token.symbol}
                    </option>
                  ))}
                </select>
                <div className="flex-1 text-right">
                  {quoteLoading ? (
                    <div className="flex justify-end">
                      <RefreshCw size={20} className="text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {toAmount || '0.00'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {price && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <TrendingUp size={16} />
                  汇率
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  1 {fromToken} = {price.toFixed(6)} {toToken}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              滑点容忍度
            </label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0, 2.0].map(s => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    slippage === s
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSwap}
            disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
            className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin" />
                兑换中...
              </span>
            ) : (
              '确认兑换'
            )}
          </button>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-700 dark:text-yellow-400">
                <p className="font-medium mb-1">温馨提示</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>兑换价格基于 Jupiter 聚合器实时报价</li>
                  <li>实际成交价格可能因滑点而有所不同</li>
                  <li>兑换操作不可撤销，请确认后再提交</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={20} className="text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">支持币种</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">5+</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">主流加密货币</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">最优价格</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Jupiter</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">聚合器智能路由</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SwapPage
