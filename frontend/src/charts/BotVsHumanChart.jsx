import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const cardBg = 'radial-gradient(ellipse at top right, rgba(108,99,255,0.10), transparent 60%), radial-gradient(ellipse at bottom left, rgba(110,231,255,0.06), transparent 50%), rgba(255,255,255,0.01)'
export default function BotVsHumanChart({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 animate-pulse" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="h-4 w-24" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
        <div className="h-[260px] mt-5" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
      </div>
    )
  }

  if (!propData) {
    return (
      <div className="rounded-3xl p-6 text-center" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <p className="text-sm font-medium py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>Waiting for data...</p>
      </div>
    )
  }

  const chartData = [
    { name: 'Human', requests: propData.human || 0 },
    { name: 'Bot', requests: propData.bot || 0 },
  ]

  return (
    <div className="rounded-3xl p-6" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
      <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Bot vs Human</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barGap={12}>
          <defs>
            <linearGradient id="humanBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
              <stop offset="100%" stopColor="#6C63FF" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="botBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" strokeWidth={1} />
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.01)' }} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.01)' }} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, padding: '12px' }} itemStyle={{ color: '#FFFFFF' }} labelStyle={{ color: '#FFFFFF' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey="requests" radius={[8, 8, 0, 0]} maxBarSize={60}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={`url(#${entry.name.toLowerCase()}Bar)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
