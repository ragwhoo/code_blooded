import { motion, AnimatePresence } from 'framer-motion'
import RiskBadge from './RiskBadge'

export default function LiveThreatFeed({ threats = [], maxHeight = 400 }) {
  return (
    <div className="rounded-3xl p-5 border border-white/5 shadow-2xl overflow-hidden" style={{ background: '#171A23', maxHeight }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase">Live Threats</h3>
        <span className="text-[10px] font-semibold text-danger flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          {threats.length} active
        </span>
      </div>
      <div className="space-y-1 overflow-y-auto" style={{ maxHeight: maxHeight - 60 }}>
        <AnimatePresence>
          {threats.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs font-medium">No active threats</div>
          ) : (
            threats.slice(0, 20).map((threat, i) => (
              <motion.div
                key={(threat.timestamp || '') + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]"
              >
                <div className="flex items-center gap-2">
                  <RiskBadge score={threat.payload?.riskScore} size="sm" />
                  <span className="text-[10px] font-medium text-text-secondary">{threat.sessionId?.substring(0, 10)}...</span>
                </div>
                <span className="text-[9px] font-medium text-text-muted">
                  {threat.payload?.mitigationAction || ''}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
