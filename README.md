# Sphinx — Anti-Bot / Anti-Scraping Protection Platform

A full-stack anti-bot detection and mitigation platform that protects web applications from scrapers, crawlers, and automated threats using multi-layered scoring, honeytraps, and real-time mitigation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Sphinx Dashboard                      │
│           React + Vite + Tailwind v4 + Recharts              │
│                    localhost:5175                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────┴──────────────────────────────────┐
│                    Backend (Spring Boot)                      │
│   Scoring Pipeline · Heuristic Rules · Behavior Analysis     │
│   JA3 Fingerprinting · IP Reputation · Mitigation Engine     │
│   CAPTCHA · Honeytraps · Real-time Events                    │
│                    localhost:8080                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ Redis / HTTP
          ┌────────────────┼────────────────┐
          │                │                │
┌─────────┴──────┐  ┌──────┴───────┐  ┌────┴──────────┐
│   Redis 7       │  │  Target 11   │  │  LocalCrawler  │
│  localhost:6379  │  │  Node.js     │  │  Python Tkinter│
│  (WSL / Docker)  │  │  localhost:5173│  │  Playwright    │
└────────────────┘  └──────────────┘  └───────────────┘
```

## Features

### Scoring Pipeline (4 engines, layered)

| Engine | Weight | What It Does |
|--------|--------|-------------|
| **Heuristic Rules** | 35% | 8 configurable rules: RPM velocity, missing headers, suspicious UAs, odd timing patterns |
| **Weighted Signals** | 35% | 5 signals: RequestVelocity, HoneypotInteraction, BrowserFingerprint, BehaviorEntropy, IPReputation |
| **Behavior Analysis** | 20% | `SessionBehaviorAnalyzer` — computes human-likeness from timing intervals, route diversity, navigation depth, asset ratio |
| **JA3 Suspicion** | additive | TLS fingerprint analysis — browser vs headless vs custom client identification |
| **Missing Fingerprint** | 10% penalty (-15pt if no browser fingerprint) | Detects Playwright/Puppeteer/Selenium headless browsers |

### Honeytraps (5 types per page)

| Type | HTML Injection | How It Catches Scrapers |
|------|---------------|------------------------|
| **Hidden Admin Links** | `<a display:none>` → `/api/target/honeypot/backup.sql`, `.env`, `api-docs` | Scrapers that follow all `<a>` tags hit hidden endpoints |
| **Hidden Form Field** | `<input name="email_confirm_..." opacity:0>` | Bots that auto-fill form fields get caught |
| **CSS Position Trap** | `<div style="position:absolute;top:-5000px;left:-5000px">` with internal link | Scrapers that render off-screen elements follow the decoy link |
| **Fake Debug Comment** | `<!-- TODO: remove debug endpoint before production -->` | Scrapers parsing HTML comments see a fake endpoint URL |
| **JS-Generated Decoy** | `<script>` creates a hidden div with link | JS-enabled scrapers trigger by executing the script |

Hitting any honeytrap endpoint → instant **score 100, TEMP_BLOCK**.

### Mitigation Actions

| Action | Threshold | Response |
|--------|-----------|----------|
| **ALLOW** | < 70 | Normal page with honeytraps injected |
| **RATE_LIMIT** | >= 70 | 429 Too Many Requests + Retry-After header |
| **CAPTCHA_SIM** | >= 80 | Math challenge page (must solve to proceed) |
| **TEMP_BLOCK** | >= 90 | 403 Forbidden page + IP blocklisted in Redis (24h TTL) |

### Real-Time Monitoring

- **WebSocket** (`/ws-stomp`) → events pushed to `/topic/events` and `/topic/threats`
- **ScraperAlertBanner** — red pulsing banner when scraping detected, auto-hides after 5s idle
- **Live analytics**: requests over time, bot vs human breakdown, risk score distribution, mitigation actions
- **Honeypot monitor**: 5 traps with hit counters, progress bars, recent trigger log

### Toggle

Master on/off switch (TopNavbar button): **Protected** (Sphinx active) ↔ **Exposed** (passthrough, no scoring, no honeytraps, no blocking).

## Installation

### Prerequisites

- **Java 17+** (Temurin recommended) — [Download](https://adoptium.net/)
- **Node.js 22+** — [Download](https://nodejs.org/)
- **Redis 7** — runs via WSL (`docker-desktop` distro) or Docker
- **Maven MVND** — `C:\Users\raghu\Desktop\maven-mvnd-1.0.5-windows-amd64\bin\mvnd.cmd`

### 1. Clone & Structure

```
botguard/
├── backend/              # Spring Boot 3.2.5 / Java 17
│   ├── src/main/java/    # Controllers, services, scoring, mitigation
│   ├── Dockerfile        # Temurin 17 multi-stage build
│   └── pom.xml
├── frontend/             # React + Vite + Tailwind v4
│   ├── src/              # Components, pages, charts
│   ├── Dockerfile        # Node 22 build → nginx serve
│   └── nginx.conf        # envsubst template for backend proxy
├── target_11/            # Levels.fyi clone (6 static HTML pages)
│   ├── index.html
│   ├── companies.html
│   ├── leaderboard.html
│   ├── salaries.html
│   ├── locations.html
│   └── calculator.html
├── target_11_server/     # Node.js proxy server (port 5173)
│   ├── server.js         # Scoring proxy, honeytrap relay, CAPTCHA/RATE_LIMIT handling
│   └── Dockerfile        # Node 22 Alpine
├── docker-compose.yml    # 4 services: redis, backend, target_11, frontend
├── railway.json.bak      # Railway deployment config (disabled)
└── README.md             # This file
```

### 2. Start Redis

```bash
# Via WSL (docker-desktop distro):
wsl -d docker-desktop -- redis-server --daemonize yes

# Verify:
wsl -d docker-desktop -- redis-cli ping
# → PONG
```

### 3. Build & Start Backend

```bash
cd backend

# Build JAR:
mvnd clean package -DskipTests

# Run:
java -jar target/botguard-backend-1.0.0.jar --server.port=8080
```

Backend starts on `http://localhost:8080`. Verify:
```bash
curl http://localhost:8080/api/sphinx/status
# → {"enabled":true}
```

### 4. Start Target-11 Server

```bash
cd ..
node target_11_server/server.js
```

Target-11 starts on `http://localhost:5173`. Open in browser — you should see the Levels.fyi salary comparison page. If Sphinx is ON, honeytraps are invisibly injected into the HTML.

### 5. Start Frontend Dashboard

```bash
cd frontend
npm run dev
```

Dashboard starts on `http://localhost:5175`. Pages:
- **Analytics** — timeseries, bot vs human, risk distribution
- **Honeypot Monitor** — 5 trap status, hit counters, trigger log
- **Scraper Report** — live scraper detection details
- **Mitigation View** — blocked IPs, actions taken

### 6. Run LocalCrawler (Scraper Test Tool)

```bash
# Requires: Python 3.10+, Playwright, lxml
python C:\Users\raghu\Desktop\LocalCrawler\LocalCrawler\localcrawler.py
```

Set target URL to `http://localhost:5173` and click **Start Crawling**. Watch the Sphinx dashboard show scoring, honeytrap hits, and blocks in real time.

## Configuration

### Backend (`application.yml`)

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | `8080` | Backend HTTP port |
| `spring.redis.host` | `localhost` | Redis host |
| `spring.redis.port` | `6379` | Redis port |
| `spring.redis.password` | (none) | Redis password |

### Environment Variables (Docker/Production)

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_REDIS_HOST` | `localhost` | Redis hostname |
| `SPRING_REDIS_PORT` | `6379` | Redis port |
| `SPRING_REDIS_PASSWORD` | (none) | Redis password |
| `BACKEND_HOST` | `localhost` | Backend hostname (for target-11) |
| `BACKEND_PORT` | `8080` | Backend port |
| `TARGET_11_ROOT` | `../target_11` | Path to static HTML files |

### Mitigation Thresholds (`MitigationEngine.java`)

| Constant | Default | Description |
|----------|---------|-------------|
| `THROTTLE_THRESHOLD` | `70` | Score ≥ 70 → RATE_LIMIT |
| `CHALLENGE_THRESHOLD` | `80` | Score ≥ 80 → CAPTCHA_SIM |
| `BLOCK_THRESHOLD` | `90` | Score ≥ 90 → TEMP_BLOCK (24h) |
| `BAN_THRESHOLD` | `99` | Score ≥ 99 → TEMP_BLOCK |

## API Endpoints

### Sphinx Toggle

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sphinx/status` | Get toggle state `{enabled: true/false}` |
| `POST` | `/api/sphinx/toggle` | Toggle on/off |
| `POST` | `/api/sphinx/enable` | Enable Sphinx |
| `POST` | `/api/sphinx/disable` | Disable Sphinx |

### Scoring

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/target/score` | Score a request — returns `{score, riskLevel, action}` |
| `GET` | `/api/target/render?path=` | Serve HTML with honeytraps injected |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/target/report` | Scraper hit log + stats |
| `POST` | `/api/analytics/reset` | Clear analytics counters and event buffer |

### Honeytraps

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/honeytraps/status` | List 5 traps with hit counts, recent triggers |
| `GET` | `/api/target/honeypot/{type}` | Trap trigger endpoint (triggers block) |

### Debug

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/debug/unblock` | `{"ip":"::1"}` — remove IP from blocklist |

## Docker Deployment

```bash
# Build & start all services:
docker compose up --build

# Individual services:
docker compose up redis -d
docker compose up backend --build -d
docker compose up target_11 --build -d
docker compose up frontend --build -d
```

## API Flow (How Sphinx Catches Scrapers)

```
Browser/Scraper → target_11 (port 5173)
  ↓
server.js checks sphinx toggle
  ↓
[Sphinx ON]
  ↓
POST /api/target/score → scoring pipeline evaluates
  ↓
[ALLOW] → GET /api/target/render → HTML + 5 honeytraps injected
  ↓
[Clicks honeytrap link] → GET /api/target/honeypot/{type}
  ↓
Score = 100 → TEMP_BLOCK → IP blocklisted in Redis (24h)
  ↓
[Next request from same IP] → 403 Forbidden
```

## License

MIT
