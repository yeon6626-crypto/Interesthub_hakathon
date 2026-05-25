import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import {
  MAJOR_OPTIONS,
  GRADE_OPTIONS,
  TARGET_CLASS_OPTIONS,
} from '@/constants/profileOptions'

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    major: MAJOR_OPTIONS[0],
    grade: GRADE_OPTIONS[0],
    targetClass: TARGET_CLASS_OPTIONS[0],
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const {
      email,
      nickname,
      password,
      confirmPassword,
      major,
      grade,
      targetClass,
    } = form

    if (!email || !nickname || !password) {
      setError('이메일, 모험가 이름, 비밀번호는 필수 입력 항목입니다.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const signupPayload = {
      email: email.trim(),
      nickname: nickname.trim(),
      password,
      major,
      grade,
      targetClass,
    }

    try {
      await api.createUser(signupPayload)

      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="landing signup-page">
      <header className="landing-header">
        <Link to="/" className="landing-logo landing-logo-link">
          <span className="landing-logo-icon" aria-hidden="true">
            🔮
          </span>
          <span>Interesthub</span>
        </Link>
      </header>

      <main className="landing-main">
        <section className="quest-board signup-board">
          <div className="quest-tab">📜 회원가입 퀘스트</div>

          <div className="quest-content">
            <h1 className="quest-title">[ 신규 모험가 등록 ]</h1>
            <div className="quest-divider" />
            <p className="quest-description signup-description">
              모험가 정보를 입력하고 Interesthub에 합류하세요.
            </p>
            <div className="quest-divider" />

            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="form-field">
                <span className="form-label">이메일 (Email) *</span>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">모험가 이름 (Nickname) *</span>
                <input
                  type="text"
                  name="nickname"
                  className="form-input"
                  placeholder="모험가 이름을 입력하세요"
                  value={form.nickname}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">학과 (Major)</span>
                <select
                  name="major"
                  className="form-input form-select"
                  value={form.major}
                  onChange={handleChange}
                >
                  {MAJOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="form-label">학년/학기 (Grade)</span>
                <select
                  name="grade"
                  className="form-input form-select"
                  value={form.grade}
                  onChange={handleChange}
                >
                  {GRADE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="form-label">관심 직무 (Target Class)</span>
                <select
                  name="targetClass"
                  className="form-input form-select"
                  value={form.targetClass}
                  onChange={handleChange}
                >
                  {TARGET_CLASS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="form-label">암호 (Password) *</span>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="비밀번호를 입력하세요"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">암호 확인 *</span>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </label>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? '등록 중...' : '⚔️ 모험가 등록하기'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default SignupPage
