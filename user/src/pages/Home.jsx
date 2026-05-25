import { useEffect, useState } from 'react'
import { api } from '@/api/client'

function Home() {
  const [serverStatus, setServerStatus] = useState('checking')

  useEffect(() => {
    api
      .getHealth()
      .then(() => setServerStatus('connected'))
      .catch(() => setServerStatus('disconnected'))
  }, [])

  return (
    <section className="home">
      <h2>환영합니다</h2>
      <p>Vite + React 프로젝트가 준비되었습니다.</p>

      <div className="status-card">
        <span className="status-label">서버 연결 상태</span>
        <span className={`status-badge status-${serverStatus}`}>
          {serverStatus === 'checking' && '확인 중...'}
          {serverStatus === 'connected' && '연결됨'}
          {serverStatus === 'disconnected' && '연결 안 됨'}
        </span>
      </div>

      <p className="hint">
        개발 서버는 <code>npm run dev</code>, API 서버는{' '}
        <code>server</code> 폴더에서 실행하세요.
      </p>
    </section>
  )
}

export default Home
