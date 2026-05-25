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
