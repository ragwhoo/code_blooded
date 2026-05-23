import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Siren } from 'lucide-react'

export default function ScraperAlertBanner({ events = [] }) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    const hasScraping = events.some(e => {
      const trapType = e.details?.trapType || e.payload?.trapType
      const path = e.details?.path || e.payload?.path || ''
      const action = e.details?.mitigationAction || e.payload?.mitigationAction || ''
      const isApiCall = path.startsWith('/api/')
      return trapType || (action !== 'ALLOW' && !isApiCall && path !== '')
    })

    if (hasScraping) {
      setVisible(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setVisible(false), 5000)
    }

    return () => clearTimeout(timeoutRef.current)
  }, [events])

  return (
    <div className="fixed top-[76px] left-1/2 -translate-x-1/2 z-[60] w-full max-w-lg px-4 pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto rounded-2xl px-5 py-4 flex items-center gap-4 border"
            style={{
              background: 'rgba(239,68,68,0.12)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(239,68,68,0.3)',
              boxShadow: '0 0 30px rgba(239,68,68,0.15), 0 0 60px rgba(239,68,68,0.08)',
              animation: 'scrapeAlertPulse 1s ease-in-out infinite',
            }}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.2)' }}>
                <Siren className="w-5 h-5 text-[#EF4444]" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#EF4444] animate-ping" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Active Scraping Detected</div>
              <div className="text-[11px] font-medium text-white/50 mt-0.5">Sphinx is blocking automated requests to target site</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes scrapeAlertPulse {
          0%, 100% { border-color: rgba(239,68,68,0.3); box-shadow: 0 0 30px rgba(239,68,68,0.15), 0 0 60px rgba(239,68,68,0.08); }
          50% { border-color: rgba(239,68,68,0.7); box-shadow: 0 0 50px rgba(239,68,68,0.35), 0 0 100px rgba(239,68,68,0.12); }
        }
      `}</style>
    </div>
  )
}
