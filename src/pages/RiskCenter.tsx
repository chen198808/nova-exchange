import { useState } from 'react'
import {
  Shield,
  Lock,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  Monitor,
  MapPin,
  Clock,
  HelpCircle,
  Key,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  X,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import { mockSecurityTips } from '@/data/mockData'
import { formatRelativeTime } from '@/utils/format'
import type { SecuritySettings, AlertStatus } from '@/types'

function Toggle({
  checked,
  onChange,
  disabled = false
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-card",
        checked ? "bg-success" : "bg-border",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const percent = Math.min((value / max) * 100, 100)
  const getColor = () => {
    if (percent >= 80) return 'bg-success'
    if (percent >= 60) return 'bg-warning'
    return 'bg-danger'
  }

  return (
    <div className="w-full bg-border rounded-full h-3 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", getColor())}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  children
}: {
  icon: typeof Shield
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-background-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="divide-y divide-border/50">
        {children}
      </div>
    </div>
  )
}

function SettingItem({
  icon: Icon,
  iconColor,
  label,
  description,
  right
}: {
  icon: typeof Lock
  iconColor: string
  label: string
  description?: string
  right: React.ReactNode
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-background-hover transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", iconColor)}>
          <Icon className="w-4.5 h-4.5 text-current" />
        </div>
        <div className="min-w-0">
          <div className="text-text-primary font-medium">{label}</div>
          {description && (
            <div className="text-text-tertiary text-sm mt-0.5 truncate">{description}</div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const styles: Record<AlertStatus, string> = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-primary/10 text-primary border-primary/20'
  }

  const labels: Record<AlertStatus, string> = {
    success: '成功',
    warning: '警告',
    danger: '危险',
    info: '通知'
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border",
      styles[status]
    )}>
      {status === 'success' && <CheckCircle className="w-3 h-3" />}
      {status === 'warning' && <AlertTriangle className="w-3 h-3" />}
      {status === 'danger' && <XCircle className="w-3 h-3" />}
      {status === 'info' && <Info className="w-3 h-3" />}
      {labels[status]}
    </span>
  )
}

function DeviceModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { loginDevices } = useUserStore()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-background-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            登录设备管理
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-background-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh]">
          {loginDevices.map((device) => (
            <div
              key={device.id}
              className="px-5 py-4 border-b border-border/50 last:border-b-0 hover:bg-background-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-medium">{device.device}</span>
                      {device.isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-success/10 text-success border border-success/20">
                          当前设备
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {device.location}
                      </span>
                      <span className="font-mono">{device.ip}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-text-tertiary">
                      <Clock className="w-3.5 h-3.5" />
                      {formatRelativeTime(device.lastLogin)}
                    </div>
                  </div>
                </div>
                {!device.isCurrent && (
                  <button className="text-danger text-sm hover:underline flex-shrink-0">
                    下线
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RiskCenter() {
  const { securitySettings, updateSecuritySetting, riskAlerts } = useUserStore()
  const [showDevices, setShowDevices] = useState(false)
  const [expandedTips, setExpandedTips] = useState<string[]>(['tip_001'])

  const enabledCount = Object.values(securitySettings).filter(Boolean).length
  const totalCount = Object.keys(securitySettings).length
  const securityScore = Math.round((enabledCount / totalCount) * 100)

  const getSecurityLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: '良好', color: 'text-success' }
    if (score >= 60) return { level: '中等', color: 'text-warning' }
    return { level: '较低', color: 'text-danger' }
  }

  const securityLevel = getSecurityLevel(securityScore)

  const toggleTip = (id: string) => {
    setExpandedTips(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleToggleSetting = (key: keyof SecuritySettings) => {
    updateSecuritySetting(key, !securitySettings[key])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">风控中心</h1>
        <p className="text-text-secondary">全方位保护您的账户与资产安全</p>
      </div>

      <div className="bg-background-card border border-border rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-border"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(securityScore / 100) * 264} 264`}
                  className={cn(
                    securityScore >= 80 ? "text-success" : securityScore >= 60 ? "text-warning" : "text-danger"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-text-primary">{securityScore}</span>
                <span className="text-xs text-text-tertiary">/ 100</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className={cn("w-6 h-6", securityLevel.color)} />
                <span className="text-xl font-bold text-text-primary">安全评分</span>
              </div>
              <div className={cn("text-lg font-semibold mb-2", securityLevel.color)}>
                安全等级：{securityLevel.level}
              </div>
              <div className="text-text-secondary text-sm">
                已开启 <span className="text-success font-medium">{enabledCount}</span> / {totalCount} 项安全功能
              </div>
            </div>
          </div>
          <div className="flex-1 md:border-l md:border-border md:pl-6 md:ml-2">
            <div className="text-text-secondary text-sm mb-2">安全进度</div>
            <ProgressBar value={securityScore} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-text-tertiary">
                {securitySettings.loginPasswordSet ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger" />
                )}
                登录密码
              </div>
              <div className="flex items-center gap-1.5 text-text-tertiary">
                {securitySettings.fundPasswordSet ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger" />
                )}
                资金密码
              </div>
              <div className="flex items-center gap-1.5 text-text-tertiary">
                {securitySettings.twoFAEnabled ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger" />
                )}
                双重验证
              </div>
              <div className="flex items-center gap-1.5 text-text-tertiary">
                {securitySettings.whitelistEnabled ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger" />
                )}
                提币白名单
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionCard icon={Lock} title="登录安全">
          <SettingItem
            icon={Key}
            iconColor="bg-primary/10 text-primary"
            label="登录密码"
            description={securitySettings.loginPasswordSet ? "已设置，建议定期更换" : "未设置"}
            right={
              <button className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors font-medium">
                修改
              </button>
            }
          />
          <SettingItem
            icon={Shield}
            iconColor="bg-success/10 text-success"
            label="资金密码"
            description={securitySettings.fundPasswordSet ? "已设置，用于提币等敏感操作" : "未设置"}
            right={
              <button className="px-3 py-1.5 text-sm bg-success/10 text-success hover:bg-success/20 rounded-md transition-colors font-medium">
                {securitySettings.fundPasswordSet ? '修改' : '设置'}
              </button>
            }
          />
          <SettingItem
            icon={Smartphone}
            iconColor="bg-warning/10 text-warning"
            label="双重验证 (2FA)"
            description="Google Authenticator"
            right={
              <Toggle
                checked={securitySettings.twoFAEnabled}
                onChange={() => handleToggleSetting('twoFAEnabled')}
              />
            }
          />
          <SettingItem
            icon={ShieldAlert}
            iconColor="bg-purple-500/10 text-purple-400"
            label="防钓鱼码"
            description={securitySettings.antiPhishingCodeSet ? "已设置" : "未设置，用于验证邮件真伪"}
            right={
              <button className="px-3 py-1.5 text-sm bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-md transition-colors font-medium">
                {securitySettings.antiPhishingCodeSet ? '修改' : '设置'}
              </button>
            }
          />
          <SettingItem
            icon={Monitor}
            iconColor="bg-cyan-500/10 text-cyan-400"
            label="登录设备管理"
            description="查看最近登录设备"
            right={
              <button
                onClick={() => setShowDevices(true)}
                className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                查看
                <ChevronRight className="w-4 h-4" />
              </button>
            }
          />
        </SectionCard>

        <SectionCard icon={Shield} title="资产安全">
          <SettingItem
            icon={CheckCircle}
            iconColor="bg-success/10 text-success"
            label="提币地址白名单"
            description="开启后仅可向白名单地址提币"
            right={
              <Toggle
                checked={securitySettings.whitelistEnabled}
                onChange={() => handleToggleSetting('whitelistEnabled')}
              />
            }
          />
          <div className="px-5 py-3 bg-background-hover/50 flex items-center justify-between">
            <div className="text-text-secondary text-sm pl-12">
              <button className="text-primary hover:underline">
                管理地址
              </button>
            </div>
          </div>
          <SettingItem
            icon={AlertTriangle}
            iconColor="bg-warning/10 text-warning"
            label="大额提币审核"
            description="超过一定金额需人工审核"
            right={
              <Toggle
                checked={securitySettings.largeWithdrawalReview}
                onChange={() => handleToggleSetting('largeWithdrawalReview')}
              />
            }
          />
          <SettingItem
            icon={Phone}
            iconColor="bg-primary/10 text-primary"
            label="提币短信验证"
            description="提币时需短信验证码"
            right={
              <Toggle
                checked={securitySettings.withdrawalSmsVerify}
                onChange={() => handleToggleSetting('withdrawalSmsVerify')}
              />
            }
          />
          <SettingItem
            icon={Mail}
            iconColor="bg-purple-500/10 text-purple-400"
            label="提币邮箱验证"
            description="提币时需邮箱验证码"
            right={
              <Toggle
                checked={securitySettings.withdrawalEmailVerify}
                onChange={() => handleToggleSetting('withdrawalEmailVerify')}
              />
            }
          />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">风控记录</h3>
          </div>
          <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
            {riskAlerts.map((alert) => (
              <div key={alert.id} className="px-5 py-4 hover:bg-background-hover transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      alert.status === 'success' && "bg-success/10 text-success",
                      alert.status === 'warning' && "bg-warning/10 text-warning",
                      alert.status === 'danger' && "bg-danger/10 text-danger",
                      alert.status === 'info' && "bg-primary/10 text-primary"
                    )}>
                      {alert.type === 'login' && <Monitor className="w-4.5 h-4.5" />}
                      {alert.type === 'withdraw' && <Eye className="w-4.5 h-4.5" />}
                      {alert.type === 'password' && <Key className="w-4.5 h-4.5" />}
                      {alert.type === 'security' && <ShieldCheck className="w-4.5 h-4.5" />}
                      {alert.type === 'system' && <Info className="w-4.5 h-4.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-medium">{alert.title}</span>
                        <StatusBadge status={alert.status} />
                      </div>
                      <p className="text-text-tertiary text-sm mt-1">{alert.description}</p>
                      <div className="text-text-muted text-xs mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">安全提示</h3>
          </div>
          <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
            {mockSecurityTips.map((tip) => (
              <div key={tip.id} className="hover:bg-background-hover transition-colors">
                <button
                  onClick={() => toggleTip(tip.id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                >
                  <span className="text-text-primary font-medium">{tip.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-text-tertiary flex-shrink-0 transition-transform",
                      expandedTips.includes(tip.id) && "rotate-180"
                    )}
                  />
                </button>
                {expandedTips.includes(tip.id) && (
                  <div className="px-5 pb-4 pl-14">
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {tip.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DeviceModal isOpen={showDevices} onClose={() => setShowDevices(false)} />
    </div>
  )
}
