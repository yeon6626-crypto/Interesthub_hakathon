# Interesthub Server

Node.js + Express + MongoDB API server.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and edit values:

```bash
cp .env.example .env
```

3. Set `MONGODB_ATLAS_URL` in `server/.env` for MongoDB Atlas. If it is empty, the server uses local `mongodb://localhost:27017/interesthub`.

**`querySrv ECONNREFUSED` troubleshooting**

- Allow your IP (or `0.0.0.0/0` for dev) in Atlas → **Network Access**.
- If SRV DNS fails on your network, copy the **standard** connection string (`mongodb://…`, not `mongodb+srv`) from Atlas → Connect → Drivers into `MONGODB_ATLAS_STANDARD_URL` in `.env`.
- Optionally set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env`.
- Run the server with `npm run dev` from the `server` folder (uses IPv4-first DNS).

## Run

Development (with auto-reload):

```bash
npm run dev
```

Production:

```bash
npm start
```

## Deploy on Render (recommended)

Monorepo: set **Root Directory** to `server`, or use the repo root `render.yaml` Blueprint.

| Dashboard field | Value |
|-----------------|--------|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Node version | `20` (matches `package.json` engines) |

### Environment variables (Render → Environment)

| Key | Required | Example |
|-----|----------|---------|
| `MONGODB_ATLAS_URL` | Yes | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | long random string |
| `JWT_EXPIRES_IN` | Yes | `7d` |
| `NODE_ENV` | Yes | `production` |
| `ADMIN_EMAILS` | Yes | `admin@example.com` |

Do **not** set `PORT` — Render injects it automatically.

Optional: `DNS_SERVERS=8.8.8.8,1.1.1.1`, `MONGODB_ATLAS_STANDARD_URL` (if SRV fails).

After deploy, API base URL: `https://<your-service>.onrender.com/api`

Set Vercel `VITE_API_URL` to that URL and redeploy the frontend.

**Free plan:** service sleeps after inactivity; first request may take 30–60s (cold start).

## API

- `GET /api/health` — health check (Render health check path)

## Project structure

```
index.js          # entry (DB connect → HTTP server)
src/
  config/         # env, connectMongo
  middleware/
  models/
  routes/
  services/
  app.js
Procfile          # optional (Render uses Start Command: npm start)
```
