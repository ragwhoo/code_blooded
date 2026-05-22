import { useState, useEffect } from 'react'
import RiskBadge from '../components/RiskBadge'

const honeypotData = [
  { name: 'Hidden Field Trap', hits: 42, type: 'hidden_input', status: 'active' },
  { name: 'Deceptive Link', hits: 28, type: 'fake_link', status: 'active' },
  { name: 'CSS Trap', hits: 15, type: 'css_trap', status: 'active' },
  { name: 'Deceptive Form', hits: 9, type: 'fake_form', status: 'inactive' },
]

export default function HoneypotMonitor() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('/api/analytics/events?limit=50')
      .then(r => r.json()).then(setEvents).catch(() => {})

    const interval = setInterval(() => {
      fetch('/api/analytics/events?limit=50')
        .then(r => r.json()).then(setEvents).catch(() => {})
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const honeypotEvents = (events || []).filter(e => e.type === 'honeypot')

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Honeypot Monitor</h1>
        <p className="text-sm font-medium text-text-muted mt-1">Deception trap activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {honeypotData.map((hp, i) => (
          <div key={i} className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl card-transition" style={{ background: '#171A23' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{hp.name}</h3>
                <span className="text-[10px] font-medium text-text-muted mt-0.5 block">{hp.type}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                hp.status === 'active'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-white/[0.04] text-text-muted'
              }`}>
                {hp.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{hp.hits}</span>
              <span className="text-[11px] font-medium text-text-muted">hits</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600" style={{ width: `${(hp.hits / 50) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
        <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Recent Honeypot Triggers</h3>
        <div className="space-y-2">
          {honeypotEvents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-muted text-sm font-medium">No honeypot triggers yet</p>
            </div>
          ) : (
            honeypotEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] slide-in">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-secondary">{ev.sessionId ? ev.sessionId.substring(0, 14) + '...' : 'Unknown'}</span>
                    <span className="text-[10px] text-text-muted ml-2 font-medium">{ev.ipAddress || ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ev.details && <span className="text-[10px] font-semibold text-text-muted bg-white/[0.04] px-2 py-0.5 rounded-md">{ev.details}</span>}
                  <RiskBadge score={ev.riskScore} size="sm" />
                  <span className="text-[10px] font-medium text-text-muted">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
