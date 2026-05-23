import { motion, AnimatePresence } from 'framer-motion'
import RiskBadge from './RiskBadge'

export default function LiveThreatFeed({ threats = [], maxHeight = 400 }) {
  return (
    <div className="rounded-3xl p-5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)', maxHeight }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Live Threats</h3>
        <span className="text-[10px] font-semibold text-[#EF4444] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse-slow" />
          {threats.length} active
        </span>
      </div>
      <div className="space-y-1 overflow-y-auto" style={{ maxHeight: maxHeight - 60 }}>
        <AnimatePresence>
          {threats.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>No active threats</div>
          ) : (
            threats.slice(0, 20).map((threat, i) => (
              <motion.div
                key={(threat.timestamp || '') + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2">
                  <RiskBadge score={threat.payload?.riskScore} size="sm" />
                  <span className="text-[10px] font-medium text-white/50">{threat.sessionId?.substring(0, 10)}...</span>
                </div>
                <span className="text-[9px] font-medium text-white/35">
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
