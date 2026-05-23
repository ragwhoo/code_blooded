import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Activity } from 'lucide-react'
import RiskBadge from './RiskBadge'

export default function Footer({ events = [], stats, connected }) {
  const threats = events.filter(e => e.type === 'threat' || e.severity === 'high' || e.severity === 'critical').slice(0, 15)
  const totalBlocked = stats?.blockedRequests || 0
  const totalRequests = stats?.totalRequests || 0
  const blockRate = totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : '0.0'

  return (
    <div className="w-full mt-8 flex items-center px-6 gap-6 rounded-3xl h-[72px]"
         style={{
           background: 'rgba(5,8,22,0.85)',
           backdropFilter: 'blur(24px)',
           WebkitBackdropFilter: 'blur(24px)',
           border: '1px solid rgba(255,255,255,0.05)'
         }}>
      <div className="flex items-center gap-3 min-w-[100px]">
        <span className="text-xs font-semibold text-white/60">Sphinx</span>
      </div>

      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(108,99,255,0.1)' }}>
          <Activity className="w-3 h-3 text-[#6C63FF]" />
          <span className="text-xs font-bold text-white">{totalRequests}</span>
          <span className="text-[9px] text-white/35 font-medium">total</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <Shield className="w-3 h-3 text-[#EF4444]" />
          <span className="text-xs font-bold text-white">{totalBlocked}</span>
          <span className="text-[9px] text-white/35 font-medium">blocked</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider whitespace-nowrap mr-2">Threats</span>
          <AnimatePresence mode="popLayout">
            {threats.length === 0 ? (
              <span className="text-xs text-white/30 font-medium whitespace-nowrap">No active threats</span>
            ) : (
              threats.slice(0, 10).map((threat, i) => (
                <motion.div
                  key={(threat.timestamp || '') + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg whitespace-nowrap"
                  style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-[9px] font-medium text-white/35">{(threat.sessionId || '').substring(0, 8)}</span>
                  <RiskBadge score={threat.riskScore || threat.payload?.riskScore} size="xs" />
                  <span className="text-[9px] font-medium text-white/35">{threat.payload?.mitigationAction || ''}</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-[160px]">
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.min(parseFloat(blockRate) * 2, 100)}%`,
            background: 'linear-gradient(90deg, #6C63FF, #6EE7FF)',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 8px rgba(108,99,255,0.3)'
          }} />
        </div>
        <span className="text-[9px] text-white/35 font-medium mt-0.5 block text-right">{blockRate}% blocked</span>
      </div>
    </div>
  )
}
