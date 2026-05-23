import { defineConfig } from 'vite'
import { createServer } from 'http'

const SPHINX_API = 'http://localhost:8080'

export default defineConfig({
  root: '.',
  server: {
    port: 5174,
    open: false,
  },
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const path = req.url.split('?')[0]
      if (path === '/' || path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.js')) {
        const ip = req.socket.remoteAddress || '127.0.0.1'
        const ua = req.headers['user-agent'] || 'Unknown'
        try {
          await fetch(`${SPHINX_API}/api/target/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, ip, userAgent: ua, timestamp: Date.now() })
          })
        } catch {}
      }
      next()
    })
  }
})
