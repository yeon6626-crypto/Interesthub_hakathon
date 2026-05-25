import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { saveUser } from '@/utils/auth'

const TOKEN_KEY = 'token'

function LoginModal({ onClose }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await api.login({
        email: form.email,
        password: form.password,
      })

      localStorage.setItem(TOKEN_KEY, response.data.token)
      saveUser(response.data.user, { skipSync: true })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = () => {
    onClose()
    navigate('/signup')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <h2 id="login-modal-title" className="login-modal-title">
          🔒 모험가 자격 증명
        </h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-label">이메일 (Email)</span>
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
            <span className="form-label">암호 (Password)</span>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="********"
              value={form.password}
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
            {isSubmitting ? '로그인 중...' : '⚔️ 모험 시작하기'}
          </button>

          <button
            type="button"
            className="login-signup-btn"
            onClick={handleSignup}
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
