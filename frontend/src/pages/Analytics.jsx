import { useState, useEffect } from 'react'
import { BarChart3, Clock, Fingerprint, Globe } from 'lucide-react'
import RequestsOverTime from '../charts/RequestsOverTime'
import BotVsHumanChart from '../charts/BotVsHumanChart'
import RiskHistogram from '../charts/RiskHistogram'

export default function Analytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/analytics/stats').then(r => r.json()).then(setStats).catch(() => {})
    const interval = setInterval(() => {
      fetch('/api/analytics/stats').then(r => r.json()).then(setStats).catch(() => {})
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const items = [
    { label: 'Avg Response Time', value: stats?.avgResponseTime ? `${stats.avgResponseTime.toFixed(1)}ms` : '—', icon: Clock, color: '#6C63FF' },
    { label: 'Peak Requests/min', value: stats?.peakRpm ?? '—', icon: BarChart3, color: '#F59E0B' },
    { label: 'Data Processed', value: stats?.dataProcessed || '—', icon: Fingerprint, color: '#6EE7FF' },
  ]

  const sources = [
    { country: 'United States', pct: 34 },
    { country: 'China', pct: 18 },
    { country: 'Russia', pct: 12 },
    { country: 'Germany', pct: 8 },
    { country: 'India', pct: 7 },
    { country: 'Other', pct: 21 },
  ]

  return (
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Analytics</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Deep traffic insights</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RequestsOverTime />
        <BotVsHumanChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskHistogram />
        <div className="rounded-3xl p-6"
             style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Traffic Sources</h3>
          <div className="space-y-4">
            {sources.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#6C63FF] flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white/50">{item.country}</span>
                    <span className="text-[10px] font-bold text-white/35">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: 'linear-gradient(90deg, #6C63FF, #6EE7FF)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
