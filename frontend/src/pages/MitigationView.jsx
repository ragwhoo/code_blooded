import { useState, useEffect } from 'react'
import MitigationChart from '../charts/MitigationChart'
import RiskBadge from '../components/RiskBadge'
import EventBadge from '../components/EventBadge'

export default function MitigationView() {
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

  const mitigationEvents = (events || []).filter(e => e.type === 'mitigation')

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Mitigation View</h1>
        <p className="text-sm font-medium text-text-muted mt-1">Active countermeasures</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Active Rules', value: 12, color: 'text-success' },
          { label: 'Threats Blocked', value: 87, color: 'text-danger' },
          { label: 'Avg Response', value: '8ms', color: 'text-purple-400' },
        ].map((item, i) => (
          <div key={i} className="rounded-3xl p-5 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{item.label}</span>
            <p className={`text-3xl font-bold text-white mt-2 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MitigationChart />
        <div className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
          <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Mitigation Rules</h3>
          <div className="space-y-2">
            {[
              { name: 'Rate Limiting', status: 'active', threshold: '100/min', action: 'throttle' },
              { name: 'IP Reputation', status: 'active', threshold: '< 30', action: 'block' },
              { name: 'Behavioral Analysis', status: 'active', threshold: 'score > 70', action: 'challenge' },
              { name: 'Honeypot Detection', status: 'active', threshold: 'triggered', action: 'block' },
              { name: 'Fingerprint Mismatch', status: 'inactive', threshold: 'N/A', action: 'review' },
            ].map((rule, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${rule.status === 'active' ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-text-muted'}`} />
                  <div>
                    <span className="text-xs font-semibold text-text-secondary">{rule.name}</span>
                    <span className="text-[10px] text-text-muted ml-2 font-medium">{rule.threshold}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  rule.action === 'block' ? 'bg-red-500/10 text-red-400' :
                  rule.action === 'throttle' ? 'bg-amber-500/10 text-amber-400' :
                  rule.action === 'challenge' ? 'bg-purple-500/10 text-purple-400' :
                  'bg-white/[0.04] text-text-muted'
                }`}>
                  {rule.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
        <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Mitigation Log</h3>
        <div className="space-y-2">
          {mitigationEvents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-muted text-sm font-medium">No mitigation actions recorded yet</p>
            </div>
          ) : (
            mitigationEvents.map((ev, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] slide-in">
                <div className="flex items-center gap-3">
                  <EventBadge type={ev.action || 'mitigation'} severity={ev.severity || 'medium'} />
                  <span className="text-xs font-semibold text-text-secondary">{ev.sessionId ? ev.sessionId.substring(0, 14) + '...' : 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {ev.ipAddress && <span className="text-[10px] font-medium text-text-muted">{ev.ipAddress}</span>}
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
