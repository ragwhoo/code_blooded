import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const cardBg = 'radial-gradient(ellipse at top right, rgba(108,99,255,0.10), transparent 60%), radial-gradient(ellipse at bottom left, rgba(110,231,255,0.06), transparent 50%), rgba(255,255,255,0.01)'

const gradients = [
  { id: 'pie0', from: '#6C63FF', to: 'rgba(108,99,255,0.2)' },
  { id: 'pie1', from: '#8B5CF6', to: 'rgba(139,92,246,0.2)' },
  { id: 'pie2', from: '#A78BFA', to: 'rgba(167,139,250,0.15)' },
  { id: 'pie3', from: '#6EE7FF', to: 'rgba(110,231,255,0.2)' },
  { id: 'pie4', from: '#818CF8', to: 'rgba(129,140,248,0.2)' },
  { id: 'pie5', from: '#C084FC', to: 'rgba(192,132,252,0.15)' },
]

export default function MitigationChart({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 animate-pulse" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="h-4 w-36" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
        <div className="h-[280px] mt-5" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
      </div>
    )
  }

  if (!propData || propData.length === 0) {
    return (
      <div className="rounded-3xl p-6 text-center" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <p className="text-sm font-medium py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>Waiting for data...</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl p-6" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
      <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Mitigation Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <defs>
            {gradients.map(g => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={g.from} stopOpacity={0.8} />
                <stop offset="100%" stopColor={g.to} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <Pie data={propData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={2} stroke="#050816">
            {propData.map((_, i) => <Cell key={i} fill={`url(#pie${i % gradients.length})`} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, padding: '12px' }} itemStyle={{ color: '#FFFFFF' }} labelStyle={{ color: '#FFFFFF' }} />
          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#A1A1AA' }} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
