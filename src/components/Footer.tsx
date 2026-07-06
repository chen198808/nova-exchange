import { Link } from 'react-router-dom'
import { Twitter, Github, MessageCircle, Send, TrendingUp } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background-lighter border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-7 h-7 text-primary" />
              <span className="text-lg font-bold gradient-text">NovaExchange</span>
            </Link>
            <p className="text-sm text-text-secondary mb-6">
              全球领先的数字资产交易平台，安全、高效、透明。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-background-card flex items-center justify-center text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-background-card flex items-center justify-center text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-background-card flex items-center justify-center text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-background-card flex items-center justify-center text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">关于我们</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  公司简介
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  加入我们
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  新闻资讯
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">服务支持</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  帮助中心
                </Link>
              </li>
              <li>
                <Link to="/fees" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  费率说明
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  API 文档
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  安全说明
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">法律条款</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  服务条款
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link to="/risk" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  风险提示
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  免责声明
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-tertiary">
            © {currentYear} NovaExchange. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            数字资产交易存在高风险，请谨慎参与。本平台不对您的任何交易行为承担责任。
          </p>
        </div>
      </div>
    </footer>
  )
}
