import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

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

export default function StatCard({ title, value, icon, color = 'primary', trend, subtitle, loading }) {
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
    primary: { glow: 'rgba(108,99,255,0.2)', accent: '#6C63FF' },
    success: { glow: 'rgba(34,197,94,0.2)', accent: '#22C55E' },
    warning: { glow: 'rgba(245,158,11,0.2)', accent: '#F59E0B' },
    danger: { glow: 'rgba(239,68,68,0.2)', accent: '#EF4444' },
    cyan: { glow: 'rgba(110,231,255,0.2)', accent: '#6EE7FF' },
  }

  const c = colorMap[color] || colorMap.primary

  if (loading) {
    return (
      <div className="rounded-3xl p-4 border border-white/[0.06] shadow-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)' }}>
        <div className="h-4 bg-white/5 rounded w-24 mb-3" />
        <div className="h-8 bg-white/5 rounded w-16 mb-2" />
        <div className="h-3 bg-white/5 rounded w-32" />
      </div>
    )
  }

  return (
    <div className="rounded-3xl p-4 overflow-hidden card-transition"
         style={{
           background: 'rgba(255,255,255,0.01)',
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
           border: '1px solid rgba(255,255,255,0.08)',
           boxShadow: `0 8px 32px rgba(0,0,0,0.45)`
         }}>
      <div className="-mx-4 -mt-4 -mb-8">{icon}</div>
      <div className="mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-bold text-white stat-value leading-none">{formatValue(displayValue)}</span>
        {trend !== null && trend !== undefined && trend !== 0 && (
          <span className={`flex items-center text-sm font-semibold ${trend > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {trend > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs font-medium text-white/35">{subtitle}</p>
      )}
    </div>
  )
}
