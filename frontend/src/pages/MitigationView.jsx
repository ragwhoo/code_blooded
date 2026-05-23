import { useState, useEffect } from 'react'
import { Shield, Activity, Ban, AlertTriangle } from 'lucide-react'

const severityColors = {
  critical: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
  high: { bg: 'rgba(249,115,22,0.1)', text: '#F97316' },
  medium: { bg: 'rgba(234,179,8,0.1)', text: '#EAB308' },
  low: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
}

const typeIcons = {
  TEMP_BLOCK: Ban,
  RATE_LIMIT: Activity,
  CAPTCHA_SIM: Shield,
}

export default function MitigationView() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedAction, setSelectedAction] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/events?limit=100').then(r => r.json()),
      fetch('/api/analytics/stats').then(r => r.json()),
    ]).then(([ev, s]) => {
      setEvents(ev || [])
      setStats(s)
    }).catch(() => {})

    const interval = setInterval(() => {
      fetch('/api/analytics/events?limit=100').then(r => r.json()).then(setEvents).catch(() => {})
      fetch('/api/analytics/stats').then(r => r.json()).then(setStats).catch(() => {})
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const mitigations = (events || [])
    .filter(e => {
      const action = e.details?.mitigationAction || e.payload?.mitigationAction
      return action && action !== 'ALLOW' && action !== 'MONITOR'
    })
    .map(e => ({
      id: e.timestamp || Math.random(),
      type: e.details?.mitigationAction || e.payload?.mitigationAction || 'unknown',
      ip: e.ipAddress || e.ip || e.details?.ipAddress || 'Unknown',
      reason: (e.details?.path || e.payload?.path || '').substring(0, 40),
      status: 'active',
      severity: e.severity === 'CRITICAL' || e.severity === 'HIGH' ? 'critical'
             : e.severity === 'MEDIUM' ? 'medium' : 'low',
      timestamp: e.timestamp,
    }))

  const filtered = selectedAction === 'all' ? mitigations : mitigations.filter(m => m.type === selectedAction)

  const statItems = [
    { label: 'Active Blocks', value: stats?.blockedRequests ?? 0, icon: Ban, color: '#EF4444' },
    { label: 'Bot Detections', value: stats?.botDetections ?? 0, icon: Activity, color: '#F97316' },
    { label: 'Total Requests', value: stats?.totalRequests ?? 0, icon: Shield, color: '#3B82F6' },
    { label: 'Rate', value: stats?.requestsPerSecond ?? '0.0', icon: AlertTriangle, color: '#6C63FF' },
  ]

  const actionTypes = ['all', 'TEMP_BLOCK', 'RATE_LIMIT', 'CAPTCHA_SIM']

  return (
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Mitigations</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Active defenses & actions taken</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-7">
        {statItems.map((s, i) => (
          <div key={i} className="rounded-3xl p-5 text-center"
               style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
            <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
            <span className="text-[9px] font-bold text-white/35 uppercase tracking-wider">{s.label}</span>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {mitigations.length === 0 ? (
        <div className="rounded-3xl p-6 text-center"
             style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          <Ban className="w-8 h-8 mx-auto mb-3 text-white/20" />
          <p className="text-white/30 text-sm font-medium">No mitigation actions recorded yet</p>
        </div>
      ) : (
        <div className="rounded-3xl p-6"
             style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {actionTypes.map(t => (
              <button key={t} onClick={() => setSelectedAction(t)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={selectedAction === t
                        ? { background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.25)' }
                        : { background: 'rgba(255,255,255,0.01)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}>
                {t === 'all' ? 'All Types' : t.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map(m => {
              const Icon = typeIcons[m.type] || Shield
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-2xl"
                     style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: severityColors[m.severity]?.bg }}>
                      <Icon className="w-4 h-4" style={{ color: severityColors[m.severity]?.text }} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white/50">{m.ip}</span>
                      <span className="text-[10px] text-white/35 ml-2 font-medium">{m.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: severityColors[m.severity]?.bg, color: severityColors[m.severity]?.text }}>
                      {m.severity}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                      <Activity className="w-2.5 h-2.5" />active
                    </span>
                    <span className="text-[10px] font-medium text-white/35">{m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
