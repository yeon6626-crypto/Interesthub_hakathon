import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import LoginModal from '@/components/LoginModal'
import SignupConfirmModal from '@/components/SignupConfirmModal'
import { isAuthenticated } from '@/utils/auth'

function MainPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupConfirmOpen, setIsSignupConfirmOpen] = useState(false)

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  const openLogin = () => setIsLoginOpen(true)
  const closeLogin = () => setIsLoginOpen(false)

  const openSignupConfirm = () => setIsSignupConfirmOpen(true)
  const closeSignupConfirm = () => setIsSignupConfirmOpen(false)

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <span className="landing-logo-icon" aria-hidden="true">
            🔮
          </span>
          <span>Interesthub</span>
        </div>

        <div className="landing-header-actions">
          <button type="button" className="landing-nav-btn" onClick={openLogin}>
            로그인
          </button>
          <button
            type="button"
            className="landing-nav-btn"
            onClick={openSignupConfirm}
          >
            회원가입
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="quest-board">
          <div className="quest-tab">📜 메인 퀘스트 공고</div>

          <div className="quest-content">
            <h1 className="quest-title">[ 메인 퀘스트 ]</h1>
            <div className="quest-divider" />
            <p className="quest-description">
              막연한 불안감을 깨부수고 꿈을 증명하라
            </p>
            <div className="quest-divider" />

            <button
              type="button"
              className="quest-accept-btn"
              onClick={openLogin}
            >
              ⚔️ 퀘스트 수락하기 (ACCEPT)
            </button>
          </div>
        </section>
      </main>

      {isLoginOpen && <LoginModal onClose={closeLogin} />}
      {isSignupConfirmOpen && (
        <SignupConfirmModal onClose={closeSignupConfirm} />
      )}
    </div>
  )
}

export default MainPage
