import { useState, useEffect, useRef } from 'react'

function formatValue(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
    if (Number.isInteger(value)) return value.toLocaleString()
    return value.toFixed(1)
  }
  return value
}

export default function StatCard({ title, value, icon, color = 'purple', trend, subtitle, loading }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value !== prevValue.current) {
      const start = prevValue.current || 0
      const end = value || 0
      const duration = 400
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(Math.round(start + (end - start) * eased))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
      prevValue.current = value
    }
  }, [value])

  const colorMap = {
    purple: { from: 'rgba(139,92,246,0.18)', to: 'rgba(139,92,246,0.05)', icon: 'bg-purple-500/10 text-purple-400' },
    success: { from: 'rgba(34,197,94,0.18)', to: 'rgba(34,197,94,0.05)', icon: 'bg-green-500/10 text-green-400' },
    warning: { from: 'rgba(245,158,11,0.18)', to: 'rgba(245,158,11,0.05)', icon: 'bg-amber-500/10 text-amber-400' },
    danger: { from: 'rgba(239,68,68,0.18)', to: 'rgba(239,68,68,0.05)', icon: 'bg-red-500/10 text-red-400' },
    info: { from: 'rgba(99,102,241,0.18)', to: 'rgba(99,102,241,0.05)', icon: 'bg-indigo-500/10 text-indigo-400' },
  }

  const c = colorMap[color] || colorMap.purple
  const arrowIcon = trend > 0
    ? 'M5 10l7-7m0 0l7 7m-7-7v18'
    : trend < 0
    ? 'M19 14l-7 7m0 0l-7-7m7 7V3'
    : null

  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-text-muted'

  if (loading) {
    return (
      <div className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl animate-pulse" style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.18), rgba(139,92,246,0.05))' }}>
        <div className="h-4 bg-white/5 rounded w-24 mb-3" />
        <div className="h-8 bg-white/5 rounded w-16 mb-2" />
        <div className="h-3 bg-white/5 rounded w-32" />
      </div>
    )
  }

  return (
    <div
      className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl card-transition"
      style={{ background: `linear-gradient(180deg, ${c.from}, ${c.to})` }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">{title}</span>
        <span className={`p-2.5 rounded-xl ${c.icon}`}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-bold text-white stat-value leading-none">{formatValue(displayValue)}</span>
        {trend !== null && trend !== undefined && trend !== 0 && (
          <span className={`flex items-center text-sm font-semibold ${trendColor}`}>
            <svg className="w-3.5 h-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={arrowIcon} />
            </svg>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs font-medium text-text-muted">{subtitle}</p>
      )}
    </div>
  )
}
