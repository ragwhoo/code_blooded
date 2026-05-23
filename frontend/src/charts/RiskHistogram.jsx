import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const cardBg = 'radial-gradient(ellipse at top right, rgba(108,99,255,0.10), transparent 60%), radial-gradient(ellipse at bottom left, rgba(110,231,255,0.06), transparent 50%), rgba(255,255,255,0.01)'

const gradients = [
  { id: 'grad0', from: '#6C63FF', to: 'rgba(108,99,255,0.15)' },
  { id: 'grad1', from: '#A78BFA', to: 'rgba(167,139,250,0.12)' },
  { id: 'grad2', from: '#6EE7FF', to: 'rgba(110,231,255,0.15)' },
  { id: 'grad3', from: '#F59E0B', to: 'rgba(245,158,11,0.10)' },
  { id: 'grad4', from: '#EF4444', to: 'rgba(239,68,68,0.12)' },
]

export default function RiskHistogram({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 animate-pulse" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="h-4 w-36" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
        <div className="h-[260px] mt-5" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
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
      <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Risk Score Distribution</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={propData}>
          <defs>
            {gradients.map(g => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.from} stopOpacity={0.7} />
                <stop offset="100%" stopColor={g.to} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" strokeWidth={1} />
          <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.01)' }} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.01)' }} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, padding: '12px' }} cursor={{ fill: 'rgba(108,99,255,0.1)' }} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
            {propData.map((_, i) => <Cell key={i} fill={`url(#grad${i % gradients.length})`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
