import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import TopNavbar from './components/TopNavbar'
import Footer from './components/BottomBar'
import AmbientGlow from './components/AmbientGlow'
import SmoothScroll from './components/SmoothScroll'
import ScraperAlertBanner from './components/ScraperAlertBanner'
import useWebSocket from './hooks/useWebSocket'
import Dashboard from './pages/Dashboard'
import ThreatFeed from './pages/ThreatFeed'
import SessionInspector from './pages/SessionInspector'
import Analytics from './pages/Analytics'
import HoneypotMonitor from './pages/HoneypotMonitor'
import MitigationView from './pages/MitigationView'
import ScraperReport from './pages/ScraperReport'

export default function App() {
  const { connected, events, stats } = useWebSocket()
  const location = useLocation()

  return (
    <SmoothScroll>
      <AmbientGlow />
      <TopNavbar connected={connected} />
      <ScraperAlertBanner events={events} />
      <main className="pt-[68px] p-8 min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/threats" element={<ThreatFeed />} />
              <Route path="/sessions" element={<SessionInspector />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/honeypots" element={<HoneypotMonitor />} />
              <Route path="/mitigations" element={<MitigationView />} />
              <Route path="/scraper" element={<ScraperReport />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        <Footer events={events} stats={stats} connected={connected} />
      </main>
    </SmoothScroll>
  )
}
