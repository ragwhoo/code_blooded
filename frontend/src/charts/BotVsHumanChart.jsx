import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = { human: '#22C55E', bot: '#8B5CF6' }

export default function BotVsHumanChart({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 border border-white/5 shadow-2xl animate-pulse" style={{ background: '#171A23' }}>
        <div className="h-4 w-24 bg-white/5 rounded mb-5" />
        <div className="h-[260px] bg-white/5 rounded" />
      </div>
    )
  }

  if (!propData) {
    return (
      <div className="rounded-3xl p-6 border border-white/5 shadow-2xl text-center" style={{ background: '#171A23' }}>
        <p className="text-text-muted text-sm font-medium py-12">Waiting for data...</p>
      </div>
    )
  }

  const chartData = [
    { name: 'Human', requests: propData.human || 0 },
    { name: 'Bot', requests: propData.bot || 0 },
  ]

  return (
    <div className="rounded-3xl p-6 border border-white/5 shadow-2xl" style={{ background: '#171A23' }}>
      <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Bot vs Human</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 12, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <YAxis tick={{ fill: '#71717A', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, padding: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey="requests" radius={[8, 8, 0, 0]} maxBarSize={60}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
