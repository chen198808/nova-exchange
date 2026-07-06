export function formatPrice(price: number, precision: number = 2): string {
  if (price === 0 || price === null || price === undefined) return '0'

  if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    })
  }

  return price.toFixed(precision)
}

export function formatAmount(amount: number, precision: number = 4): string {
  if (amount === 0 || amount === null || amount === undefined) return '0'

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  })
}

export function formatPercent(percent: number): string {
  if (percent === 0 || percent === null || percent === undefined) return '0.00%'

  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

export function formatVolume(volume: number): string {
  if (volume === 0 || volume === null || volume === undefined) return '0'

  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`
  }
  return volume.toFixed(2)
}

export function formatTime(timestamp: number): string {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function formatShortTime(timestamp: number): string {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return ''

  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  }
  if (diff < 30 * day) {
    return `${Math.floor(diff / day)}天前`
  }

  return formatTime(timestamp).split(' ')[0]
}
