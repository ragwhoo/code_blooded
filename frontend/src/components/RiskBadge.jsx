const riskConfig = {
  critical: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', dot: '#EF4444', glow: '0 0 8px rgba(239,68,68,0.4)' },
  high: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', dot: '#F59E0B', glow: '0 0 8px rgba(245,158,11,0.4)' },
  medium: { bg: 'rgba(139,92,246,0.12)', text: '#A78BFA', dot: '#8B5CF6', glow: '0 0 8px rgba(139,92,246,0.4)' },
  low: { bg: 'rgba(34,197,94,0.12)', text: '#22C55E', dot: '#22C55E', glow: '0 0 8px rgba(34,197,94,0.4)' },
}

export default function RiskBadge({ score, size = 'md' }) {
  const level = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'
  const config = riskConfig[level]
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg ${sizeClasses}`}
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dot, boxShadow: config.glow }} />
      {score !== null && score !== undefined ? score : '—'}
    </span>
  )
}
