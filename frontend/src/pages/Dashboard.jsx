import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import EventBadge from '../components/EventBadge'
import RequestsOverTime from '../charts/RequestsOverTime'
import BotVsHumanChart from '../charts/BotVsHumanChart'
import MitigationChart from '../charts/MitigationChart'
import RiskHistogram from '../charts/RiskHistogram'
import useStomp from '../hooks/useStomp'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [threats, setThreats] = useState([])
  const [timeseries, setTimeseries] = useState(null)
  const [botVsHuman, setBotVsHuman] = useState(null)
  const [riskDist, setRiskDist] = useState(null)
  const [mitDist, setMitDist] = useState(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [loading, setLoading] = useState(true)

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

  useStomp({
    topics: ['/topic/threats'],
    onEvent: (data) => {
      if (data) setThreats(prev => [data, ...prev].slice(0, 50))
    },
  })

  const topEvents = (events || []).slice(0, 5)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7 pt-6">
      <div>
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Dashboard</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Real-time bot detection overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Requests" value={stats?.totalRequests}
          icon={<img src="/logos/totalrequests.png" alt="" className="w-full object-contain" />} color="primary"
          subtitle="vs last hour" loading={loading} />
        <StatCard title="Bots Detected" value={stats?.botDetections}
          icon={<img src="/logos/botdetected.png" alt="" className="w-full object-contain" />} color="danger"
          subtitle="from total traffic" loading={loading} />
        <StatCard title="Active Sessions" value={stats?.activeSessions}
          icon={<img src="/logos/active sessions.png" alt="" className="w-full object-contain" />} color="cyan"
          subtitle="currently active" loading={loading} />
        <StatCard title="Block Rate" value={stats?.blockedRequests != null ? `${((stats.blockedRequests / Math.max(stats.totalRequests, 1)) * 100).toFixed(1)}%` : null}
          icon={<img src="/logos/botsblocked.png" alt="" className="w-full object-contain" />} color="warning"
          subtitle="of total traffic" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RequestsOverTime data={timeseries} loading={chartLoading} />
        </div>
        <div className="rounded-3xl p-6 overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white tracking-wide">Live Threats</h3>
            <span className="text-[10px] font-semibold text-[#EF4444] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse-slow" />
              {threats.length} active
            </span>
          </div>
          <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 340 }}>
            {threats.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-xs font-medium">No active threats</div>
            ) : (
              threats.slice(0, 20).map((threat, i) => (
                <motion.div
                  key={(threat.timestamp || '') + i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-3">
                    <RiskBadge score={threat.payload?.riskScore} size="sm" />
                    <span className="text-[10px] font-medium text-white/50">{(threat.sessionId || '').substring(0, 10)}...</span>
                  </div>
                  <span className="text-[9px] font-medium text-white/35">
                    {threat.payload?.mitigationAction || ''}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BotVsHumanChart data={botVsHuman} loading={chartLoading} />
        <MitigationChart data={mitDist} loading={chartLoading} />
        <RiskHistogram data={riskDist} loading={chartLoading} />
      </div>

      <div className="rounded-3xl p-6"
           style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white tracking-wide">Recent Events</h3>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[#6C63FF]" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Live</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left py-3 text-[10px] font-bold text-white/35 uppercase tracking-wider">Type</th>
                <th className="text-left py-3 text-[10px] font-bold text-white/35 uppercase tracking-wider">Session</th>
                <th className="text-left py-3 text-[10px] font-bold text-white/35 uppercase tracking-wider">IP</th>
                <th className="text-left py-3 text-[10px] font-bold text-white/35 uppercase tracking-wider">Score</th>
                <th className="text-right py-3 text-[10px] font-bold text-white/35 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-white/30 text-sm font-medium">No events yet — start the simulator to see data</td></tr>
              ) : (
                topEvents.map((ev, i) => (
                  <tr key={i} className="border-b border-white/[0.03] transition-colors" style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <td className="py-3.5"><EventBadge type={ev.type} severity={ev.severity || 'info'} /></td>
                    <td className="py-3.5 text-white/50 font-semibold text-xs">{ev.sessionId ? ev.sessionId.substring(0, 12) + '...' : '—'}</td>
                    <td className="py-3.5 text-white/35 font-medium text-xs">{ev.ipAddress || '—'}</td>
                    <td className="py-3.5"><RiskBadge score={ev.riskScore} size="sm" /></td>
                    <td className="py-3.5 text-white/35 text-xs font-medium text-right">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '—'}</td>
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
