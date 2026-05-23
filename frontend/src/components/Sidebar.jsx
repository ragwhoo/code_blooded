import { NavLink, useLocation } from 'react-router-dom'
import { Shield, Activity, Users, BarChart3, Siren, ShieldOff, Zap } from 'lucide-react'

const links = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/threats', label: 'Threat Feed', icon: Siren },
  { path: '/sessions', label: 'Sessions', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/honeypots', label: 'Honeypots', icon: ShieldOff },
  { path: '/mitigations', label: 'Mitigations', icon: Shield },
]

export default function Sidebar({ connected }) {
  const location = useLocation()

  return (
    <div className="fixed left-0 top-0 h-full z-50 w-[240px] flex flex-col"
         style={{
           background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
           borderRight: '1px solid rgba(255,255,255,0.05)'
         }}>
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-white/[0.05]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 24px rgba(108,99,255,0.35)' }}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Sphinx</span>
      </div>

      <div className="flex-1 py-5 space-y-1 px-3 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all text-sm ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
              }`}
              style={isActive ? { background: 'rgba(108,99,255,0.15)', boxShadow: 'inset 0 0 20px rgba(108,99,255,0.08)' } : {}}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#6C63FF]' : ''}`} />
              <span className="text-sm font-medium">{link.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#6C63FF', boxShadow: '0 0 8px rgba(108,99,255,0.6)' }} />
              )}
            </NavLink>
          )
        })}
      </div>

      <div className="mx-3 mb-4 p-4 rounded-2xl" style={{
        background: 'linear-gradient(135deg, rgba(91,91,255,0.15), rgba(155,231,255,0.08))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'} transition-colors`}
                style={connected ? { boxShadow: '0 0 12px rgba(34,197,94,0.5)' } : { boxShadow: '0 0 12px rgba(239,68,68,0.5)' }} />
          <div>
            <span className={`text-xs font-semibold ${connected ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            <p className="text-[10px] text-white/35 mt-0.5">WebSocket</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/35">Protected</span>
            <span className="text-[#6EE7FF] font-semibold" style={{ textShadow: '0 0 8px rgba(110,231,255,0.4)' }}>Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
