# Interesthub User (Frontend)

Vite + React 사용자 앱

## 기술 스택

- React 19
- Vite 8
- React Router
- ESLint

## 시작하기

```bash
npm install
npm run dev
```

브라우저: http://localhost:5173

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |

## 환경 변수

`.env.example`을 참고해 `.env` 파일을 만드세요.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_URL` | `/api` | API base URL |

개발 환경에서는 Vite proxy가 `/api` 요청을 `http://localhost:5000`으로 전달합니다.

## 프로젝트 구조

```
src/
  api/          # API 클라이언트
  components/   # 공통 컴포넌트
  pages/        # 페이지 컴포넌트
  App.jsx       # 라우터 설정
  main.jsx      # 앱 진입점
```

## 백엔드 연동

API 서버(`server` 폴더)를 포트 5000에서 실행한 뒤 프론트엔드를 실행하면 홈 화면에서 서버 연결 상태를 확인할 수 있습니다.

```bash
# 터미널 1
cd ../server
npm run dev

# 터미널 2
cd user
npm run dev
```
