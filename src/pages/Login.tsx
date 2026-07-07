import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, TrendingUp } from 'lucide-react'
import { useUserStore } from '@/store/userStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, fetchBalances, loadDepositAddress } = useUserStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!username || !password) {
      setError('请输入用户名和密码')
      setLoading(false)
      return
    }

    try {
      const success = await login(username, password)
      if (success) {
        await fetchBalances()
        await loadDepositAddress()
        navigate('/')
      } else {
        setError('登录失败，请稍后重试')
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-background-card border border-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <TrendingUp className="w-10 h-10 text-primary" />
              <span className="text-2xl font-bold gradient-text">NovaExchange</span>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary mb-2">欢迎回来</h1>
            <p className="text-text-secondary">登录您的账户开始交易</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-background-lighter border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-background-lighter border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-background-lighter text-primary focus:ring-primary/30" />
                记住我
              </label>
              <a href="#" className="text-primary hover:text-primary-light transition-colors">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors btn-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            还没有账户？{' '}
            <Link to="/register" className="text-primary hover:text-primary-light transition-colors">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
