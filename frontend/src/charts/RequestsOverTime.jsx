import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const cardBg = 'radial-gradient(ellipse at top right, rgba(108,99,255,0.10), transparent 60%), radial-gradient(ellipse at bottom left, rgba(110,231,255,0.06), transparent 50%), rgba(255,255,255,0.01)'

export default function RequestsOverTime({ data: propData, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl p-6 animate-pulse" style={{ background: cardBg, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
        <div className="h-4 w-32" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} />
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
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-white tracking-wide">Requests Over Time</h3>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#6C63FF' }} />Total
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />Bots
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={propData}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" strokeWidth={1} />
          <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.01)' }} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.01)' }} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', padding: '12px' }}
            itemStyle={{ color: '#FFFFFF' }}
            labelStyle={{ color: '#FFFFFF' }}
          />
          <Area type="monotone" dataKey="total" stroke="#6C63FF" strokeWidth={2.5} fill="url(#totalGrad)" dot={false} activeDot={{ r: 4, fill: '#6C63FF', stroke: 'transparent', strokeWidth: 0 }} />
          <Area type="monotone" dataKey="bot" stroke="#F59E0B" strokeWidth={2} fill="url(#botGrad)" dot={false} activeDot={{ r: 4, fill: '#F59E0B', stroke: 'transparent', strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
