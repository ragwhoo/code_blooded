# BotGuard — Anti-Bot Platform

A containerized anti-bot detection and mitigation platform with real-time threat analysis.

## Architecture

```
                     ┌─────────────┐
                     │   Browser   │
                     └──────┬──────┘
                            │
                    ┌───────┴───────┐
                    │   NGINX (:80) │  (optional: docker compose --profile with-proxy up)
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────┴──────┐ ┌───┴────┐ ┌──────┴──────┐
       │   Frontend  │ │  API   │ │  WebSocket  │
       │  React/Vite │ │ /api/* │ │    /ws/*    │
       │   (:80/5173)│ └───┬────┘ └──────┬──────┘
       └─────────────┘     │             │
                    ┌──────┴─────────────┴──────┐
                    │      Backend (:8080)       │
                    │     Spring Boot / Java     │
                    └──────┬─────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Redis 7    │
                    │  (:6379)    │
                    └─────────────┘
```

## Quick Start

```bash
# Start all services (direct frontend access)
docker compose up --build

# Start with NGINX reverse proxy
docker compose --profile with-proxy up --build

# Run in background
docker compose up -d --build
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_REDIS_HOST` | `redis` | Redis hostname |
| `SPRING_PROFILES_ACTIVE` | `docker` | Spring profile |

## Port Mapping

| Service | Dev Mode | Docker |
|---------|----------|--------|
| Frontend | 5173 | 80 |
| Backend | 8080 | 8080 |
| Redis | 6379 | 6379 |
| NGINX | — | 80/443 |

## API Endpoints

- `GET  /api/health` — Health check
- `POST /api/analyze` — Analyze request for bot behavior
- `POST /api/report` — Report suspicious activity
- `WS   /ws/monitor` — Real-time monitoring stream

## Simulator Controls

Use the frontend dashboard to simulate traffic patterns:

- **Human Traffic** — Normal browser requests with realistic headers
- **Bot Traffic** — Automated requests (headless browsers, scrapers)
- **Load Test** — Configurable concurrency and rate
