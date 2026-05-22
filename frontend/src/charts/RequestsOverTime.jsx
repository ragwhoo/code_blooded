import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function RequestsOverTime({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 border border-white/5 shadow-2xl animate-pulse" style={{ background: '#171A23' }}>
        <div className="h-4 w-32 bg-white/5 rounded mb-5" />
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
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-white tracking-wide">Requests Over Time</h3>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-purple-400" />Total
          </span>
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />Bots
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={propData}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          <XAxis dataKey="time" tick={{ fill: '#71717A', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <YAxis tick={{ fill: '#71717A', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', padding: '12px' }}
          />
          <Area type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#totalGrad)" dot={false} activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#171A23', strokeWidth: 2 }} />
          <Area type="monotone" dataKey="bot" stroke="#F59E0B" strokeWidth={2} fill="url(#botGrad)" dot={false} activeDot={{ r: 4, fill: '#F59E0B', stroke: '#171A23', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
