import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import EventBadge from '../components/EventBadge'
import LiveThreatFeed from '../components/LiveThreatFeed'
import RequestsOverTime from '../charts/RequestsOverTime'
import BotVsHumanChart from '../charts/BotVsHumanChart'
import MitigationChart from '../charts/MitigationChart'
import RiskHistogram from '../charts/RiskHistogram'
import useStomp from '../hooks/useStomp'

export default function Dashboard({ wsConnected }) {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [threats, setThreats] = useState([])
  const [timeseries, setTimeseries] = useState(null)
  const [botVsHuman, setBotVsHuman] = useState(null)
  const [riskDist, setRiskDist] = useState(null)
  const [mitDist, setMitDist] = useState(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const seenRef = useRef(new Set())

  // Fetch all chart data
  useEffect(() => {
    setChartLoading(true)
    Promise.all([
      fetch('/api/analytics/timeseries?minutes=30').then(r => r.json()),
      fetch('/api/analytics/bot-vs-human?minutes=60').then(r => r.json()),
      fetch('/api/analytics/risk-distribution').then(r => r.json()),
      fetch('/api/analytics/mitigation-distribution').then(r => r.json()),
      fetch('/api/analytics/stats').then(r => r.json()),
      fetch('/api/analytics/events?limit=10').then(r => r.json()),
    ]).then(([ts, bvh, rd, md, s, ev]) => {
      setTimeseries(ts.series)
      setBotVsHuman(bvh)
      setRiskDist(rd.distribution)
      setMitDist(md.distribution)
      setStats(s)
      setEvents(ev || [])
      setLoading(false)
      setChartLoading(false)
    }).catch(() => { setLoading(false); setChartLoading(false) })

    const interval = setInterval(() => {
      fetch('/api/analytics/stats').then(r => r.json()).then(setStats).catch(() => {})
      fetch('/api/analytics/events?limit=10').then(r => r.json()).then(setEvents).catch(() => {})
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // WebSocket subscription for threats
  useStomp({
    topics: ['/topic/threats'],
    onEvent: (data) => {
      if (data) setThreats(prev => [data, ...prev].slice(0, 50))
    },
  })

  const topEvents = (events || []).slice(0, 5)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm font-medium text-text-muted mt-1">Real-time bot detection overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
            wsConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Requests" value={stats?.totalRequests} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} color="purple" trend={12} subtitle="vs last hour" loading={loading} />
        <StatCard title="Bots Detected" value={stats?.botDetections} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} color="danger" trend={8} subtitle="+18% from yesterday" loading={loading} />
        <StatCard title="Active Sessions" value={stats?.activeSessions} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} color="info" trend={-3} subtitle="currently active" loading={loading} />
        <StatCard title="Block Rate" value={stats?.blockedRequests != null ? `${((stats.blockedRequests / Math.max(stats.totalRequests, 1)) * 100).toFixed(1)}%` : null} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" /></svg>} color="warning" trend={0} subtitle="of total traffic" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><RequestsOverTime data={timeseries} loading={chartLoading} /></div>
        <LiveThreatFeed threats={threats} maxHeight={400} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BotVsHumanChart data={botVsHuman} loading={chartLoading} />
        <MitigationChart data={mitDist} loading={chartLoading} />
        <RiskHistogram data={riskDist} loading={chartLoading} />
      </div>

      <div className="rounded-3xl p-6 border border-white/5 shadow-2xl" style={{ background: '#171A23' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white tracking-wide">Recent Events</h3>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Live Feed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Type</th>
                <th className="text-left py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Session</th>
                <th className="text-left py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">IP</th>
                <th className="text-left py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Score</th>
                <th className="text-right py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-text-muted text-sm font-medium">No events yet — start the simulator to see data</td></tr>
              ) : (
                topEvents.map((ev, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3"><EventBadge type={ev.type} severity={ev.severity || 'info'} /></td>
                    <td className="py-3 text-text-secondary font-semibold text-xs">{ev.sessionId ? ev.sessionId.substring(0, 12) + '...' : '—'}</td>
                    <td className="py-3 text-text-muted font-medium text-xs">{ev.ipAddress || '—'}</td>
                    <td className="py-3"><RiskBadge score={ev.riskScore} size="sm" /></td>
                    <td className="py-3 text-text-muted text-xs font-medium text-right">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
