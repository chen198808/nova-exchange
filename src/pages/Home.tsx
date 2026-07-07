import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
          NovaExchange
        </h1>
        <p className="text-xl text-text-secondary mb-8">
          全球领先的数字资产交易平台
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/trade/RS_USDT"
            className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors btn-glow-primary"
          >
            开始交易
          </Link>
          <Link
            to="/markets"
            className="px-8 py-3 border border-border hover:bg-background-hover text-text-primary font-medium rounded-lg transition-colors"
          >
            查看行情
          </Link>
        </div>
      </div>
    </div>
  )
}
