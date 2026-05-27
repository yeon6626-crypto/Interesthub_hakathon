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

## API

- `GET /api/health` — health check

## Project structure

```
src/
  config/       # env & database config
  middleware/   # express middleware
  models/       # mongoose models
  routes/       # API routes
  app.js        # express app
  index.js      # entry point
```
