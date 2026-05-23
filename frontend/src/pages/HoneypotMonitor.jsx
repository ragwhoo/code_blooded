import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldOff, Siren, Activity, Eye, Code, FileText, Terminal } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'

const trapIcons = {
  hidden_admin_links: Eye,
  hidden_form_field: Code,
  css_trap: Terminal,
  fake_comment: FileText,
  js_decoy: Activity,
}

const trapColors = {
  hidden_admin_links: '#6C63FF',
  hidden_form_field: '#F59E0B',
  css_trap: '#6EE7FF',
  fake_comment: '#8B5CF6',
  js_decoy: '#22C55E',
}

export default function HoneypotMonitor() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/honeytraps/status')
      .then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
    const interval = setInterval(() => {
      fetch('/api/honeytraps/status').then(r => r.json()).then(setData).catch(() => {})
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="fade-in pt-6 animate-pulse space-y-5">
        <div className="h-8 w-64 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      </div>
    )
  }

  const traps = data?.traps || {}
  const triggers = data?.recentTriggers || []
  const trapEntries = Object.entries(traps)

  const summaryCards = [
    { label: 'Honeytraps Deployed', value: data?.totalHoneypots ?? 5, icon: ShieldOff, color: '#6C63FF' },
    { label: 'Total Triggers', value: data?.totalTriggers ?? 0, icon: Siren, color: '#EF4444' },
    { label: 'Unique IPs Caught', value: data?.uniqueIPs ?? 0, icon: Eye, color: '#F59E0B' },
  ]

  return (
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Honeypot Monitor</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Deception trap activity & insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
        {summaryCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-3xl p-6 text-center card-transition"
            style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
            <s.icon className="w-5 h-5 mx-auto mb-3" style={{ color: s.color }} />
            <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">{s.label}</span>
            <p className="text-2xl font-bold text-white mt-2">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl p-6 mb-7"
        style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Deployed Honeytraps</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {trapEntries.map(([key, trap]) => {
            const Icon = trapIcons[key] || ShieldOff
            const color = trapColors[key] || '#6C63FF'
            const hitCount = trap.hits || 0
            const maxHits = Math.max(...trapEntries.map(([, t]) => t.hits || 0), 1)
            return (
              <div key={key} className="rounded-2xl p-5"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="w-[18px] h-[18px]" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white">{trap.label}</h4>
                    <p className="text-[10px] font-medium text-white/40 mt-0.5 leading-relaxed">{trap.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ml-auto"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                    active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{hitCount}</span>
                  <span className="text-[10px] font-medium text-white/35">triggers</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(hitCount / maxHits) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Trigger Log</h3>
        {triggers.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldOff className="w-8 h-8 mx-auto mb-3 text-white/20" />
            <p className="text-white/30 text-sm font-medium">No traps triggered yet — run the scraper against http://localhost:5173</p>
          </div>
        ) : (
          <div className="space-y-2">
            {triggers.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl slide-in"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <Siren className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/60">{t.ip || 'Unknown'}</span>
                      {t.trapType && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                          {t.trapType}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-white/30 block truncate max-w-[200px]">{t.path || ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <RiskBadge score={t.score || 0} size="sm" />
                  <span className="text-[10px] font-medium text-white/25">{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
