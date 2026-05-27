# Interesthub

해커톤 프로젝트 — RPG 테마 진로·퀘스트 대시보드

## 구조

- `user/` — React (Vite) 프론트엔드
- `server/` — Express + MongoDB API

## 실행

### 서버

```bash
cd server
npm install
# .env 설정 후
npm run dev
```

### 클라이언트

```bash
cd user
npm install
cp .env.example .env
# VITE_GEMINI_API_KEY, VITE_API_URL 등 설정
npm run dev
```

## 환경 변수

- `user/.env.example` — 프론트엔드 (Gemini API 키 등)
- `server/.env` — MongoDB URI, JWT 등 (저장소에 커밋하지 마세요)

## 배포 (Vercel + Render)

| 대상 | 플랫폼 | Root Directory |
|------|--------|----------------|
| 프론트 `user/` | Vercel | `user` |
| API `server/` | Render | `server` |

1. **Render** — Web Service, Start `npm start`, Health `/api/health`, env 5개 (`MONGODB_ATLAS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`, `ADMIN_EMAILS`). 상세: `server/README.md`, 또는 루트 `render.yaml` Blueprint.
2. **Vercel** — `VITE_API_URL=https://<render-service>.onrender.com/api`, `VITE_GEMINI_API_KEY` 설정 후 Deploy.
3. Atlas **Network Access** `0.0.0.0/0` 허용.

프론트 SPA 새로고침: `user/vercel.json` (rewrites → `index.html`).
