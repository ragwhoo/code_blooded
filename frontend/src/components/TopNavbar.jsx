import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Shield, Activity, Users, BarChart3, Siren, ShieldOff, Bug, Power } from 'lucide-react'

const links = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/threats', label: 'Threat Feed', icon: Siren },
  { path: '/sessions', label: 'Sessions', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/scraper', label: 'Scraper', icon: Bug },
  { path: '/honeypots', label: 'Honeypots', icon: ShieldOff },
  { path: '/mitigations', label: 'Mitigations', icon: Shield },
]

export default function TopNavbar({ connected }) {
  const location = useLocation()
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    fetch('/api/sphinx/status').then(r => r.json()).then(d => setEnabled(d.enabled)).catch(() => {})
  }, [])

  const toggle = async () => {
    const r = await fetch('/api/sphinx/toggle', { method: 'POST' })
    const d = await r.json()
    setEnabled(d.enabled)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center px-6"
         style={{
           background: 'rgba(5,8,22,0.85)',
           backdropFilter: 'blur(24px)',
           WebkitBackdropFilter: 'blur(24px)',
           borderBottom: '1px solid rgba(255,255,255,0.05)'
         }}>
      <div className="flex items-center gap-3 mr-10">
        <img src="/logos/sphinx.png" alt="Sphinx" className="w-7 h-7 object-contain" />
        <span className="text-lg font-bold text-white tracking-tight">Sphinx</span>
      </div>

      <div className="flex items-center gap-1 flex-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm"
              style={isActive
                ? { background: 'rgba(108,99,255,0.12)', color: '#FFFFFF' }
                : { color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' } }}
            >
              <Icon className={`w-[16px] h-[16px] ${isActive ? 'text-[#6C63FF]' : ''}`} />
              <span className="text-sm font-medium">{link.label}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={toggle}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-xs font-bold cursor-pointer"
                style={{
                  background: enabled ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${enabled ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: enabled ? '#22C55E' : '#EF4444',
                }}>
          <Power className="w-3.5 h-3.5" />
          <span>{enabled ? 'Protected' : 'Exposed'}</span>
        </button>

        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
                style={connected ? { boxShadow: '0 0 10px rgba(34,197,94,0.5)' } : { boxShadow: '0 0 10px rgba(239,68,68,0.5)' }} />
          <span className={`text-xs font-semibold ${connected ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </nav>
  )
}
