import { useState, useEffect } from 'react'
import { Search, User, Info } from 'lucide-react'
import RiskBadge from '../components/RiskBadge'

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'suspicious', label: 'Suspicious' },
  { key: 'bot', label: 'Bots' },
  { key: 'clean', label: 'Clean' },
]

export default function SessionInspector() {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/analytics/sessions')
      .then(r => r.json()).then(setSessions).catch(() => {})
    const interval = setInterval(() => {
      fetch('/api/analytics/sessions')
        .then(r => r.json()).then(setSessions).catch(() => {})
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Session Inspector</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Detailed session analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl p-6 overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white tracking-wide">Active Sessions ({sessions.length})</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {filterOptions.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={filter === f.key
                          ? { background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.25)' }
                          : { background: 'rgba(255,255,255,0.01)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 mx-auto mb-3 text-white/20" />
                <p className="text-white/30 text-sm font-medium">No active sessions</p>
              </div>
            ) : (
              sessions.slice(0, 20).map((s, i) => (
                <div key={i} onClick={() => setSelected(s)}
                     className="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all"
                     style={selected?.sessionId === s.sessionId
                       ? { background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }
                       : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                     onMouseEnter={e => { if (selected?.sessionId !== s.sessionId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                     onMouseLeave={e => { if (selected?.sessionId !== s.sessionId) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(108,99,255,0.15)' }}>
                      <User className="w-4 h-4 text-[#6C63FF]" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white/50">{s.sessionId ? s.sessionId.substring(0, 16) + '...' : 'Unknown'}</span>
                      <span className="text-[10px] text-white/35 ml-2 font-medium">{s.ipAddress || ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-white/35 px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      {s.userAgent ? s.userAgent.substring(0, 30) : '—'}
                    </span>
                    <RiskBadge score={s.riskScore} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl p-6"
             style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Details</h3>
          {selected ? (
            <div className="space-y-5">
              {[
                { label: 'Session ID', value: selected.sessionId },
                { label: 'IP Address', value: selected.ipAddress },
                { label: 'Risk Score', value: <RiskBadge score={selected.riskScore} /> },
                { label: 'User Agent', value: selected.userAgent },
                { label: 'Request Count', value: selected.requestCount },
                { label: 'First Seen', value: selected.firstSeen ? new Date(selected.firstSeen).toLocaleString() : '—' },
                { label: 'Last Seen', value: selected.lastSeen ? new Date(selected.lastSeen).toLocaleString() : '—' },
              ].map((item, i) => (
                <div key={i}>
                  <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">{item.label}</span>
                  <div className="text-sm font-semibold text-white/50 mt-1 break-all">{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <Info className="w-8 h-8 mx-auto mb-3 text-white/20" />
              <p className="text-white/30 text-sm font-medium">Select a session to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
