import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const links = [
  { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/threats', label: 'Threat Feed', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { path: '/sessions', label: 'Session Inspector', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/honeypots', label: 'Honeypot Monitor', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { path: '/mitigations', label: 'Mitigation View', icon: 'M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01' },
]

export default function Navbar({ connected }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <nav className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
         style={{ background: '#12141C' }}>
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">BotGuard</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors text-text-muted hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      <div className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-transparent text-purple-400 font-semibold'
                  : 'text-text-muted hover:bg-white/[0.04] hover:text-text-secondary'
              }`}
            >
              <svg className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-purple-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
              {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              )}
            </NavLink>
          )
        })}
      </div>

      <div className="mx-3 mb-3 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]'} transition-colors`} />
          {!collapsed && (
            <div>
              <span className={`text-xs font-semibold ${connected ? 'text-success' : 'text-danger'}`}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
              <p className="text-[10px] text-text-muted mt-0.5">WebSocket</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
