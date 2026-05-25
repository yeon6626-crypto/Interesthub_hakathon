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

3. Start MongoDB locally, or set `MONGODB_URI` to your MongoDB Atlas connection string.

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
