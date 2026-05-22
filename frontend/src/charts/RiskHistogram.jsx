import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const colors = ['#22C55E', '#A78BFA', '#8B5CF6', '#F59E0B', '#EF4444']

export default function RiskHistogram({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 border border-white/5 shadow-2xl animate-pulse" style={{ background: '#171A23' }}>
        <div className="h-4 w-36 bg-white/5 rounded mb-5" />
        <div className="h-[260px] bg-white/5 rounded" />
      </div>
    )
  }

  if (!propData || propData.length === 0) {
    return (
      <div className="rounded-3xl p-6 border border-white/5 shadow-2xl text-center" style={{ background: '#171A23' }}>
        <p className="text-text-muted text-sm font-medium py-12">Waiting for data...</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl p-6 border border-white/5 shadow-2xl" style={{ background: '#171A23' }}>
      <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Risk Score Distribution</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={propData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          <XAxis dataKey="range" tick={{ fill: '#71717A', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <YAxis tick={{ fill: '#71717A', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, padding: '12px' }} cursor={{ fill: 'rgba(139,92,246,0.1)' }} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
            {propData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
