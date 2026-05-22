import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import useWebSocket from './hooks/useWebSocket'
import Dashboard from './pages/Dashboard'
import ThreatFeed from './pages/ThreatFeed'
import SessionInspector from './pages/SessionInspector'
import Analytics from './pages/Analytics'
import HoneypotMonitor from './pages/HoneypotMonitor'
import MitigationView from './pages/MitigationView'

export default function App() {
  const { connected } = useWebSocket()
  const location = useLocation()

  return (
    <div className="min-h-screen" style={{ background: '#0F1117' }}>
      <Navbar connected={connected} />
      <main className="ml-64 p-6 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Dashboard wsConnected={connected} />} />
              <Route path="/threats" element={<ThreatFeed />} />
              <Route path="/sessions" element={<SessionInspector />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/honeypots" element={<HoneypotMonitor />} />
              <Route path="/mitigations" element={<MitigationView />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
