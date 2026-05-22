const severityConfig = {
  critical: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', dot: '#EF4444' },
  high: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', dot: '#F59E0B' },
  medium: { bg: 'rgba(139,92,246,0.12)', text: '#A78BFA', dot: '#8B5CF6' },
  low: { bg: 'rgba(34,197,94,0.12)', text: '#22C55E', dot: '#22C55E' },
  info: { bg: 'rgba(99,102,241,0.12)', text: '#818CF8', dot: '#6366F1' },
}

export default function EventBadge({ type, severity = 'info', size = 'sm' }) {
  const config = severityConfig[severity] || severityConfig.info
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md ${sizeClasses}`}
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: config.dot }} />
      {type || severity}
    </span>
  )
}
