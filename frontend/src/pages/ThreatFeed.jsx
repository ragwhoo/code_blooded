import { useState, useEffect } from 'react'
import RiskBadge from '../components/RiskBadge'
import EventBadge from '../components/EventBadge'

export default function ThreatFeed() {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/analytics/events?limit=100')
      .then(r => r.json()).then(setEvents).catch(() => {})

    const interval = setInterval(() => {
      fetch('/api/analytics/events?limit=100')
        .then(r => r.json()).then(setEvents).catch(() => {})
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Threat Feed</h1>
        <p className="text-sm font-medium text-text-muted mt-1">Real-time event stream</p>
      </div>

      <div className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {['all', 'bot_detected', 'suspicious', 'rate_limit', 'honeypot', 'mitigation'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/[0.04] text-text-muted border border-transparent hover:bg-white/[0.07] hover:text-text-secondary'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-text-muted text-sm font-medium">No events matching filter</p>
            </div>
          ) : (
            filtered.map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all slide-in"
                style={{ animationDelay: `${(i % 20) * 30}ms` }}
              >
                <div className="flex items-center gap-4">
                  <EventBadge type={ev.type} severity={ev.severity || 'info'} />
                  <div>
                    <span className="text-xs font-semibold text-text-secondary">{ev.sessionId ? ev.sessionId.substring(0, 16) + '...' : 'Unknown'}</span>
                    <span className="text-[10px] text-text-muted ml-2 font-medium">{ev.ipAddress || ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
