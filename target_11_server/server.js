import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'

const BH = process.env.BACKEND_HOST || 'localhost'
const BP = process.env.BACKEND_PORT || '8080'
const SPHINX_API = `http://${BH}:${BP}/api/target`
const SPHINX_RENDER = `http://${BH}:${BP}/api/target/render?path=`
const SPHINX_TOGGLE = `http://${BH}:${BP}/api/sphinx/status`
const ROOT = process.env.TARGET_11_ROOT || join(import.meta.dirname, '..', 'target_11')

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.json': 'application/json',
}

async function isSphinxEnabled() {
  try {
    const r = await fetch(SPHINX_TOGGLE)
    const data = await r.json()
    return data.enabled !== false
  } catch {
    return true
  }
}

createServer(async (req, res) => {
  let path = req.url.split('?')[0]
  if (path === '/') path = '/index.html'
  const ext = extname(path)

  const ip = req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1'
  const ua = req.headers['user-agent'] || 'Unknown'

  // Honeytrap links: proxy directly to Sphinx so it catches the scraper
  if (path.startsWith('/api/target/honeypot/')) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : ''
    const targetUrl = `http://${BH}:${BP}${path}${qs ? '?' + qs : ''}`
    try {
      const r = await fetch(targetUrl, { headers: { 'User-Agent': ua, 'X-Forwarded-For': ip } })
      const body = await r.text()
      res.writeHead(r.status, { 'Content-Type': 'text/html', 'X-Sphinx': 'honeytrap' })
      res.end(body)
    } catch {
      res.writeHead(502)
      res.end('Bad Gateway')
    }
    return
  }

  // CAPTCHA API: proxy to Sphinx backend
  if (path.startsWith('/api/captcha/')) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : ''
    const targetUrl = `http://${BH}:${BP}${path}${qs ? '?' + qs : ''}`
    const bodyBuf = await new Promise(resolve => {
      const chunks = []
      req.on('data', c => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    })
    try {
      const r = await fetch(targetUrl, {
        method: req.method,
        headers: { 'Content-Type': 'application/json', 'User-Agent': ua, 'X-Forwarded-For': ip },
        body: bodyBuf || undefined
      })
      const data = await r.json()
      res.writeHead(r.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } catch {
      res.writeHead(502)
      res.end('Bad Gateway')
    }
    return
  }

  if (ext === '.html' || ext === '' || path === '/index.html') {
    const enabled = await isSphinxEnabled()

    if (enabled) {
      // SPHINX ON: score + block + inject honeytraps
      try {
        const scoreRes = await fetch(`${SPHINX_API}/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, ip, userAgent: ua, timestamp: Date.now() })
        })
        const scoreResult = await scoreRes.json()
        const score = scoreResult.score || 0
        const action = scoreResult.action || 'ALLOW'

        if (action === 'TEMP_BLOCK' || (action !== 'CAPTCHA_SIM' && action !== 'RATE_LIMIT' && score >= 80)) {
          res.writeHead(403, {
            'Content-Type': 'text/html',
            'X-BotGuard-Score': String(score),
            'X-BotGuard-Level': scoreResult.riskLevel || 'CRITICAL'
          })
          res.end(blockPage(score))
          return
        }

        if (action === 'RATE_LIMIT') {
          res.writeHead(429, {
            'Content-Type': 'text/html',
            'X-BotGuard-Score': String(score),
            'Retry-After': '60'
          })
          res.end(rateLimitPage())
          return
        }

        if (action === 'CAPTCHA_SIM') {
          const captchaPage = captchaChallengePage(path)
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'X-BotGuard-Score': String(score),
            'X-BotGuard-Captcha': 'true'
          })
          res.end(captchaPage)
          return
        }

        const htmlRes = await fetch(SPHINX_RENDER + encodeURIComponent(path))
        const html = await htmlRes.text()
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'X-BotGuard-Score': String(score),
          'X-BotGuard-Level': scoreResult.riskLevel || 'LOW',
          'X-Sphinx': 'enabled'
        })
        res.end(html)
        return
      } catch {}
    }

    // SPHINX OFF or fallback: serve raw HTML without blocking or honeytraps
    try {
      const htmlRes = await fetch(SPHINX_RENDER + encodeURIComponent(path))
      const html = await htmlRes.text()
      res.writeHead(200, { 'Content-Type': 'text/html', 'X-Sphinx': enabled ? 'enabled' : 'disabled' })
      res.end(html)
      return
    } catch {
      const filePath = join(ROOT, path)
      if (existsSync(filePath)) {
        const content = readFileSync(filePath)
        res.writeHead(200, { 'Content-Type': 'text/html', 'X-Sphinx': 'disabled' })
        res.end(content)
        return
      }
    }

    res.writeHead(404)
    res.end('Not Found')
    return
  }

  const filePath = join(ROOT, path)
  if (existsSync(filePath)) {
    const content = readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(content)
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
}).listen(5173, () => {
  console.log('target_11 → http://localhost:5173')
})

function blockPage(score) {
  return `<html><body style="background:#050816;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:12px">
    <h1 style="font-size:48px;color:#EF4444">403</h1>
    <p style="font-size:16px;color:rgba(255,255,255,0.6)">Request blocked — automated scraping detected</p>
    <span style="font-size:12px;color:rgba(255,255,255,0.3)">Sphinx • Bot Score: ${score}</span>
  </body></html>`
}

function rateLimitPage() {
  return `<html><body style="background:#050816;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:12px">
    <h1 style="font-size:36px;color:#F59E0B">429</h1>
    <p style="font-size:16px;color:rgba(255,255,255,0.6)">Too many requests — rate limit applied</p>
    <span style="font-size:12px;color:rgba(255,255,255,0.3)">Sphinx • Back off and retry after 60s</span>
  </body></html>`
}

function captchaChallengePage(originalPath) {
  return `<html><head><style>
    body{background:#050816;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:16px;margin:0}
    .box{background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;text-align:center;max-width:400px}
    h2{font-size:20px;margin:0 0 8px}
    p{font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 20px}
    .challenge{font-size:28px;font-weight:bold;color:#6EE7FF;margin-bottom:16px}
    input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px;color:#fff;font-size:16px;width:120px;text-align:center;outline:none}
    input:focus{border-color:#6C63FF}
    button{background:#6C63FF;border:none;border-radius:12px;padding:12px 32px;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;margin-top:12px}
    button:hover{background:#5A52E0}
    .error{color:#EF4444;font-size:12px;display:none;margin-top:8px}
  </style></head><body>
    <div class="box">
      <h2>Verification Required</h2>
      <p>Please solve this challenge to continue</p>
      <div class="challenge" id="question">...</div>
      <input type="number" id="answer" placeholder="Answer" autofocus>
      <div class="error" id="error">Incorrect answer, try again</div>
      <button onclick="verify()">Verify</button>
    </div>
    <script>
      async function loadChallenge() {
        try {
          const r = await fetch('/api/captcha/challenge', { method:'POST' });
          const data = await r.json();
          document.getElementById('question').textContent = data.challenge;
          window.challengeId = data.id;
        } catch(e) {
          document.getElementById('question').textContent = 'Error loading challenge';
        }
      }
      async function verify() {
        const answer = document.getElementById('answer').value;
        const r = await fetch('/api/captcha/verify', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ id: window.challengeId, answer: parseInt(answer) })
        });
        const data = await r.json();
        if (data.verified) {
          window.location.href = '${originalPath}?captcha_verified=1';
        } else {
          document.getElementById('error').style.display = 'block';
          loadChallenge();
        }
      }
      loadChallenge();
    </script>
  </body></html>`
}
