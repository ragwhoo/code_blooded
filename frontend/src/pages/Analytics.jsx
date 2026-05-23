import { useState, useEffect } from 'react'
import { BarChart3, Clock, Activity, Shield } from 'lucide-react'
import RequestsOverTime from '../charts/RequestsOverTime'
import BotVsHumanChart from '../charts/BotVsHumanChart'
import RiskHistogram from '../charts/RiskHistogram'

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [timeseries, setTimeseries] = useState(null)
  const [botVsHuman, setBotVsHuman] = useState(null)
  const [riskDist, setRiskDist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/stats').then(r => r.json()),
      fetch('/api/analytics/timeseries?minutes=30').then(r => r.json()),
      fetch('/api/analytics/bot-vs-human?minutes=60').then(r => r.json()),
      fetch('/api/analytics/risk-distribution').then(r => r.json()),
    ]).then(([s, ts, bvh, rd]) => {
      setStats(s)
      setTimeseries(ts.series)
      setBotVsHuman(bvh)
      setRiskDist(rd.distribution)
      setLoading(false)
    }).catch(() => setLoading(false))

    const interval = setInterval(() => {
      fetch('/api/analytics/stats').then(r => r.json()).then(setStats).catch(() => {})
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const items = stats ? [
    { label: 'Requests/sec', value: stats.requestsPerSecond ?? '0.0', icon: Activity, color: '#6C63FF' },
    { label: 'Total Requests', value: stats.totalRequests ?? 0, icon: BarChart3, color: '#F59E0B' },
    { label: 'Bot Detections', value: stats.botDetections ?? 0, icon: Shield, color: '#EF4444' },
  ] : []

  return (
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Analytics</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Deep traffic insights</p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
          {items.map((item, i) => (
            <div key={i} className="rounded-3xl p-6 text-center"
                 style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
              <item.icon className="w-5 h-5 mx-auto mb-3" style={{ color: item.color }} />
              <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">{item.label}</span>
              <p className="text-2xl font-bold text-white mt-2">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RequestsOverTime data={timeseries} loading={loading} />
        <BotVsHumanChart data={botVsHuman} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskHistogram data={riskDist} loading={loading} />
        <div className="rounded-3xl p-6 flex items-center justify-center"
             style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          <p className="text-sm font-medium text-white/30">Geographic data will appear once traffic is recorded</p>
        </div>
      </div>
    </div>
  )
}
