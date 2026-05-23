import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, Activity, ArrowUpRight } from 'lucide-react'
import RiskBadge from './RiskBadge'

export default function RightPanel({ events = [], stats, connected }) {
  const threats = events.filter(e => e.type === 'threat' || e.severity === 'high' || e.severity === 'critical').slice(0, 15)
  const totalBlocked = stats?.blockedRequests || 0
  const totalRequests = stats?.totalRequests || 0
  const blockRate = totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : '0.0'

  return (
    <div className="fixed right-0 top-0 h-full z-50 w-[380px] flex flex-col overflow-hidden"
         style={{
           background: 'rgba(255,255,255,0.02)',
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
           borderLeft: '1px solid rgba(255,255,255,0.05)'
         }}>
      <div className="px-6 py-5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-white tracking-wide">Live Feed</h2>
          <span className={`flex items-center gap-1.5 text-[10px] font-semibold ${connected ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
                  style={connected ? { boxShadow: '0 0 8px rgba(34,197,94,0.5)' } : {}} />
            {connected ? 'LIVE' : 'OFF'}
          </span>
        </div>
        <div style={{
          height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.01)', overflow: 'hidden', marginTop: 8
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.min(parseFloat(blockRate) * 2, 100)}%`,
            background: 'linear-gradient(90deg, #6C63FF, #6EE7FF)',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 12px rgba(108,99,255,0.3)'
          }} />
        </div>
      </div>

      <div className="px-5 py-4 border-b border-white/[0.05]">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3" style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.15)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3 h-3 text-[#6C63FF]" />
              <span className="text-[10px] text-white/50 font-medium">Total</span>
            </div>
            <span className="text-lg font-bold text-white">{totalRequests}</span>
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3 h-3 text-[#EF4444]" />
              <span className="text-[10px] text-white/50 font-medium">Blocked</span>
            </div>
            <span className="text-lg font-bold text-white">{totalBlocked}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Threats</h3>
          <span className="text-[10px] font-semibold text-[#EF4444]">{threats.length} active</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {threats.length === 0 ? (
              <div className="py-8 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-white/20" />
                <p className="text-xs text-white/30 font-medium">No active threats</p>
              </div>
            ) : (
              threats.map((threat, i) => (
                <motion.div
                  key={(threat.timestamp || '') + i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <RiskBadge score={threat.riskScore || threat.payload?.riskScore} size="sm" />
                    <span className="text-[10px] font-medium text-white/50">
                      {(threat.sessionId || '').substring(0, 10)}...
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-white/35 flex items-center gap-1">
                    <ArrowUpRight className="w-2.5 h-2.5" />
                    {threat.payload?.mitigationAction || threat.action || '—'}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-white/[0.05]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/35">Protected by</span>
          <span className="font-bold text-white/60 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#6C63FF]" />
            Sphinx
          </span>
        </div>
      </div>
    </div>
  )
}
