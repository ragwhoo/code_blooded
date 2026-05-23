import { useState, useEffect } from 'react'
import { Shield, Activity, Ban, AlertTriangle, Check } from 'lucide-react'

const mitigations = [
  { id: 1, type: 'ip_block', ip: '198.51.100.45', reason: 'Brute force detected', status: 'active', severity: 'high', timestamp: '2025-01-15T10:30:00Z' },
  { id: 2, type: 'rate_limit', ip: '203.0.113.22', reason: 'Excessive requests', status: 'active', severity: 'medium', timestamp: '2025-01-15T10:28:00Z' },
  { id: 3, type: 'challenge', ip: '192.0.2.100', reason: 'Suspicious UA', status: 'resolved', severity: 'low', timestamp: '2025-01-15T10:25:00Z' },
  { id: 4, type: 'ip_block', ip: '198.51.100.77', reason: 'Known botnet', status: 'active', severity: 'critical', timestamp: '2025-01-15T10:20:00Z' },
  { id: 5, type: 'rate_limit', ip: '203.0.113.55', reason: 'API abuse', status: 'active', severity: 'medium', timestamp: '2025-01-15T10:18:00Z' },
  { id: 6, type: 'challenge', ip: '192.0.2.200', reason: 'Headless browser', status: 'resolved', severity: 'low', timestamp: '2025-01-15T10:15:00Z' },
  { id: 7, type: 'ip_block', ip: '198.51.100.33', reason: 'SQL injection attempt', status: 'active', severity: 'critical', timestamp: '2025-01-15T10:10:00Z' },
]

const severityColors = {
  critical: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
  high: { bg: 'rgba(249,115,22,0.1)', text: '#F97316' },
  medium: { bg: 'rgba(234,179,8,0.1)', text: '#EAB308' },
  low: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
}

const typeIcons = {
  ip_block: Ban,
  rate_limit: Activity,
  challenge: Shield,
}

const stats = [
  { label: 'Active Blocks', value: 4, icon: Ban, color: '#EF4444' },
  { label: 'Rate Limits', value: 2, icon: Activity, color: '#F97316' },
  { label: 'Challenges', value: 1, icon: Shield, color: '#3B82F6' },
  { label: 'Total Today', value: 7, icon: AlertTriangle, color: '#6C63FF' },
]

export default function MitigationView() {
  const [selectedType, setSelectedType] = useState('all')

  const filtered = selectedType === 'all' ? mitigations : mitigations.filter(m => m.type === selectedType)

  return (
    <div className="fade-in pt-6">
      <div className="mb-7">
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-none">Mitigations</h1>
        <p className="text-sm font-medium text-white/50 mt-2">Active defenses & actions taken</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-7">
        {stats.map((s, i) => (
          <div key={i} className="rounded-3xl p-5 text-center"
               style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
            <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
            <span className="text-[9px] font-bold text-white/35 uppercase tracking-wider">{s.label}</span>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl p-6"
           style={{ background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {['all', 'ip_block', 'rate_limit', 'challenge'].map(t => (
            <button key={t} onClick={() => setSelectedType(t)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={selectedType === t
                      ? { background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.25)' }
                      : { background: 'rgba(255,255,255,0.01)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}>
              {t === 'all' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map(m => {
            const Icon = typeIcons[m.type] || Shield
            return (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                   style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: severityColors[m.severity]?.bg }}>
                    <Icon className="w-4 h-4" style={{ color: severityColors[m.severity]?.text }} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white/50">{m.ip}</span>
                    <span className="text-[10px] text-white/35 ml-2 font-medium">{m.reason}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: severityColors[m.severity]?.bg, color: severityColors[m.severity]?.text }}>
                    {m.severity}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{ background: m.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.01)',
                                 color: m.status === 'active' ? '#22C55E' : 'rgba(255,255,255,0.35)' }}>
                    {m.status === 'active' ? <Activity className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                    {m.status}
                  </span>
                  <span className="text-[10px] font-medium text-white/35">{new Date(m.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
