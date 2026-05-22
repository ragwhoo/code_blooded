import { useState, useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export default function useStomp({ topics = [], onEvent, onStats } = {}) {
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)
  const subscriptionsRef = useRef([])
  const reconnectRef = useRef(0)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-stomp'),
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: Math.min(1000 * Math.pow(2, reconnectRef.current), 30000),
      onConnect: () => {
        setConnected(true)
        reconnectRef.current = 0

        if (topics.length === 0) return
        topics.forEach(topic => {
          const sub = client.subscribe(topic, message => {
            try {
              const data = JSON.parse(message.body)
              if (topic === '/topic/stats' && onStats) {
                onStats(data)
              } else if (onEvent) {
                onEvent(data, topic)
              }
            } catch (e) {
              console.error('STOMP parse error:', e)
            }
          })
          subscriptionsRef.current.push(sub)
        })
      },
      onDisconnect: () => {
        setConnected(false)
        reconnectRef.current = Math.min(reconnectRef.current + 1, 5)
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers?.message)
        setConnected(false)
        reconnectRef.current = Math.min(reconnectRef.current + 1, 5)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe())
      subscriptionsRef.current = []
      client.deactivate()
    }
  }, [])

  const subscribe = useCallback((topic, callback) => {
    if (clientRef.current?.connected) {
      const sub = clientRef.current.subscribe(topic, message => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (e) {
          console.error('STOMP parse error:', e)
        }
      })
      return () => sub.unsubscribe()
    }
    return () => {}
  }, [])

  return { connected, subscribe }
}
