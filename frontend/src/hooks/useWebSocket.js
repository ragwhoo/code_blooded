import { useState, useRef } from 'react'
import useStomp from './useStomp'

export default function useWebSocket() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState(null)
  const maxEvents = 500
  const seenRef = useRef(new Set())

  const onEvent = (data, topic) => {
    if (!data) return
    if (topic === '/topic/events') {
      const key = (data.timestamp || '') + (data.sessionId || '') + (data.type || '')
      if (seenRef.current.has(key)) return
      seenRef.current.add(key)
      setEvents(prev => {
        const next = [data, ...prev]
        return next.slice(0, maxEvents)
      })
    }
  }

  const onStats = (data) => {
    setStats(data)
  }

  const stomp = useStomp({
    topics: ['/topic/events', '/topic/stats'],
    onEvent,
    onStats,
  })

  return { connected: stomp.connected, events, stats }
}
