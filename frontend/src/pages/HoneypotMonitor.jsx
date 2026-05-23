import { useState, useEffect } from 'react'
import { ShieldOff, Activity, AlertTriangle } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'

const honeypotData = [
  { name: 'Hidden Field Trap', hits: 42, type: 'hidden_input', status: 'active' },
  { name: 'Deceptive Link', hits: 28, type: 'fake_link', status: 'active' },
  { name: 'CSS Trap', hits: 15, type: 'css_trap', status: 'active' },
  { name: 'Deceptive Form', hits: 9, type: 'fake_form', status: 'inactive' },
]

const statusColors = {
  active: { bg: 'rgba(34,197,94,0.1)', text: '#22C55E' },
  inactive: { bg: 'rgba(255,255,255,0.01)', text: 'rgba(255,255,255,0.35)' },
}

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
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Honeypot Monitor</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Deception trap activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        {honeypotData.map((hp, i) => (
          <div key={i} className="rounded-3xl p-6 card-transition"
               style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{hp.name}</h3>
                <span className="text-[10px] font-medium text-white/35 mt-0.5 block">{hp.type}</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                    style={{ background: statusColors[hp.status]?.bg, color: statusColors[hp.status]?.text }}>
                {hp.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{hp.hits}</span>
              <span className="text-[11px] font-medium text-white/35">hits</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="h-full rounded-full" style={{ width: `${(hp.hits / 50) * 100}%`, background: 'linear-gradient(90deg, #6C63FF, #6EE7FF)' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl p-6"
           style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Recent Honeypot Triggers</h3>
        <div className="space-y-2">
          {honeypotEvents.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldOff className="w-8 h-8 mx-auto mb-3 text-white/20" />
              <p className="text-white/30 text-sm font-medium">No honeypot triggers yet</p>
            </div>
          ) : (
            honeypotEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl slide-in"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(108,99,255,0.15)' }}>
                    <ShieldOff className="w-4 h-4 text-[#6C63FF]" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white/50">{ev.sessionId ? ev.sessionId.substring(0, 14) + '...' : 'Unknown'}</span>
                    <span className="text-[10px] text-white/35 ml-2 font-medium">{ev.ipAddress || ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ev.details && <span className="text-[10px] font-semibold text-white/35 px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>{ev.details}</span>}
                  <RiskBadge score={ev.riskScore} size="sm" />
                  <span className="text-[10px] font-medium text-white/35">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
