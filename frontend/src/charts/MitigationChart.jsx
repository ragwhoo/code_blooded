import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const colors = ['#22C55E', '#F59E0B', '#A78BFA', '#EF4444', '#8B5CF6', '#6B7280']

export default function MitigationChart({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 border border-white/5 shadow-2xl animate-pulse" style={{ background: '#171A23' }}>
        <div className="h-4 w-36 bg-white/5 rounded mb-5" />
        <div className="h-[280px] bg-white/5 rounded" />
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
      <h3 className="text-sm font-bold text-white mb-5 tracking-wide">Mitigation Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={propData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={2} stroke="#171A23">
            {propData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, padding: '12px' }} />
          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#A1A1AA' }} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
