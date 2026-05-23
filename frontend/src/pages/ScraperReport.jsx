import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Siren, Ban, Bug, Activity, Clock, Globe, FileText, AlertTriangle, Zap } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'

export default function ScraperReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/target/report')
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false) })
      .catch(() => setLoading(false))

    const interval = setInterval(() => {
      fetch('/api/target/report')
        .then(r => r.json()).then(setReport).catch(() => {})
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="fade-in pt-6">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-64 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
          </div>
        </div>
      </div>
    )
  }

  const hits = report?.hits || []
  const blocked = report?.blockedRequests || 0
  const total = report?.totalRequests || 0
  const botDetections = report?.botDetections || 0
  const honeypotHits = report?.honeypotHits || 0
  const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0'

  const stats = [
    { label: 'Total Requests', value: total, icon: Activity, color: '#6C63FF' },
    { label: 'Blocked', value: blocked, icon: Ban, color: '#EF4444' },
    { label: 'Bot Detections', value: botDetections, icon: Bug, color: '#F59E0B' },
    { label: 'Honeytrap Hits', value: honeypotHits, icon: Siren, color: '#6EE7FF' },
  ]

  return (
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Scraper Analysis</h1>
        <p className="text-sm font-medium text-white/50 mt-2">
          Target site interception report — <span className="text-[#6C63FF]">{blockRate}% blocked</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-7">
        {stats.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-3xl p-6 text-center card-transition"
            style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
            <item.icon className="w-5 h-5 mx-auto mb-3" style={{ color: item.color }} />
            <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">{item.label}</span>
            <p className="text-2xl font-bold text-white mt-2">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Honeytrap explanation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl p-6 mb-7"
        style={{ background: 'rgba(108,99,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(108,99,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(108,99,255,0.15)' }}>
            <AlertTriangle className="w-5 h-5 text-[#6C63FF]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Active Honeytraps Injected</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Every HTML page served to the target site contains <span className="text-white/80 font-semibold">5 invisible honeytraps</span>:
              hidden admin links, off-screen form fields, CSS-trapped elements, fake debug comments, and JS-generated decoys.
              Any scraper that follows these traps is immediately identified and blocked.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hits log */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Request Log</h3>

        {hits.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="w-10 h-10 mx-auto mb-4 text-white/15" />
            <p className="text-white/25 text-sm font-medium">No target traffic yet</p>
            <p className="text-white/15 text-xs mt-2">Requests to the dummy target site will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hits.slice(0, 100).map((hit, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl slide-in"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: hit.trapType ? 'rgba(239,68,68,0.15)' : 'rgba(108,99,255,0.15)' }}>
                    {hit.trapType ? <Siren className="w-4 h-4 text-[#EF4444]" /> : <Activity className="w-4 h-4 text-[#6C63FF]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/60 truncate max-w-[120px]">{hit.ip || 'Unknown'}</span>
                      {hit.trapType && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                          Trap
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-white/30 block truncate max-w-[200px]">{hit.path || ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {hit.userAgent && (
                    <span className="text-[9px] font-medium text-white/25 hidden lg:block truncate max-w-[150px]">
                      {hit.userAgent.substring(0, 40)}...
                    </span>
                  )}
                  <RiskBadge score={hit.riskScore || 0} size="sm" />
                  {hit.timestamp && (
                    <span className="text-[10px] font-medium text-white/25">{new Date(hit.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
