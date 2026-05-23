import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
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
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Threat Feed</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Real-time event stream</p>
      </div>

      <div className="rounded-3xl p-6"
           style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {['all', 'bot_detected', 'suspicious', 'rate_limit', 'honeypot', 'mitigation'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={filter === f
                ? { background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.25)' }
                : { background: 'rgba(255,255,255,0.01)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}
            >
              {f === 'all' ? <span className="flex items-center gap-1"><Filter className="w-3 h-3" />All</span> : f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <svg className="w-5 h-5 mx-auto text-white/20" style={{ padding: 2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-white/30 text-sm font-medium">No events matching filter</p>
            </div>
          ) : (
            filtered.map((ev, i) => (
              <div key={i}
                   className="flex items-center justify-between px-4 py-3 rounded-2xl slide-in transition-all"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                   onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              >
                <div className="flex items-center gap-3">
                  <EventBadge type={ev.type} severity={ev.severity || 'info'} />
                  <div>
                    <span className="text-xs font-semibold text-white/50">{ev.sessionId ? ev.sessionId.substring(0, 16) + '...' : 'Unknown'}</span>
                    <span className="text-[10px] text-white/35 ml-2 font-medium">{ev.ipAddress || ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
