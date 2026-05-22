import { useState, useEffect } from 'react'
import RequestsOverTime from '../charts/RequestsOverTime'
import BotVsHumanChart from '../charts/BotVsHumanChart'
import RiskHistogram from '../charts/RiskHistogram'

export default function Analytics() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/analytics/stats')
      .then(r => r.json()).then(setStats).catch(() => {})

    const interval = setInterval(() => {
      fetch('/api/analytics/stats')
        .then(r => r.json()).then(setStats).catch(() => {})
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-sm font-medium text-text-muted mt-1">Deep traffic insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Avg Response Time', value: stats?.avgResponseTime ? `${stats.avgResponseTime.toFixed(1)}ms` : '—', color: 'from-purple-400 to-purple-600' },
          { label: 'Peak Requests/min', value: stats?.peakRpm ?? '—', color: 'from-amber-400 to-amber-600' },
          { label: 'Data Processed', value: stats?.dataProcessed || '—', color: 'from-emerald-400 to-emerald-600' },
        ].map((item, i) => (
          <div key={i} className="rounded-3xl p-5 border border-white/[0.06] shadow-2xl text-center" style={{ background: '#171A23' }}>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{item.label}</span>
            <p className={`text-2xl font-bold text-white mt-2 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RequestsOverTime />
        <BotVsHumanChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskHistogram />
        <div className="rounded-3xl p-6 border border-white/[0.06] shadow-2xl" style={{ background: '#171A23' }}>
          <h3 className="text-sm font-bold text-white mb-4 tracking-wide">Traffic Sources</h3>
          <div className="space-y-3">
            {[
              { country: 'United States', flag: '🇺🇸', pct: 34 },
              { country: 'China', flag: '🇨🇳', pct: 18 },
              { country: 'Russia', flag: '🇷🇺', pct: 12 },
              { country: 'Germany', flag: '🇩🇪', pct: 8 },
              { country: 'India', flag: '🇮🇳', pct: 7 },
              { country: 'Other', flag: '🌍', pct: 21 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base">{item.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-secondary">{item.country}</span>
                    <span className="text-[10px] font-bold text-text-muted">{item.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                      style={{ width: `${item.pct}%` }}
                    />
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
