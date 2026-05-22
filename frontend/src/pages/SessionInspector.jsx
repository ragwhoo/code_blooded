import { useState, useEffect } from 'react'
import RiskBadge from '../components/RiskBadge'

export default function SessionInspector() {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)

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
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Session Inspector</h1>
        <p className="text-sm font-medium text-text-muted mt-1">Detailed session analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl p-6 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
          <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Active Sessions ({sessions.length})</h3>
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-muted text-sm font-medium">No active sessions</p>
              </div>
            ) : (
              sessions.slice(0, 20).map((s, i) => (
                <div
                  key={i}
                  onClick={() => setSelected(s)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border cursor-pointer transition-all ${
                    selected?.sessionId === s.sessionId
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-600/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-text-secondary">{s.sessionId ? s.sessionId.substring(0, 16) + '...' : 'Unknown'}</span>
                      <span className="text-[10px] text-text-muted ml-2 font-medium">{s.ipAddress || ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-text-muted bg-white/[0.04] px-2 py-0.5 rounded-md">{s.userAgent ? s.userAgent.substring(0, 30) : '—'}</span>
                    <RiskBadge score={s.riskScore} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
          <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Session Details</h3>
          {selected ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Session ID</span>
                <p className="text-sm font-semibold text-text-secondary mt-1 break-all">{selected.sessionId || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">IP Address</span>
                <p className="text-sm font-semibold text-text-secondary mt-1">{selected.ipAddress || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Risk Score</span>
                <div className="mt-1"><RiskBadge score={selected.riskScore} /></div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">User Agent</span>
                <p className="text-xs font-medium text-text-secondary mt-1 break-all">{selected.userAgent || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Request Count</span>
                <p className="text-sm font-semibold text-text-secondary mt-1">{selected.requestCount ?? '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">First Seen</span>
                <p className="text-xs font-medium text-text-secondary mt-1">{selected.firstSeen ? new Date(selected.firstSeen).toLocaleString() : '—'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Last Seen</span>
                <p className="text-xs font-medium text-text-secondary mt-1">{selected.lastSeen ? new Date(selected.lastSeen).toLocaleString() : '—'}</p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-text-muted text-sm font-medium">Select a session to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
