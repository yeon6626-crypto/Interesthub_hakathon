import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { saveUser } from '@/utils/auth'
import {
  MAJOR_OPTIONS,
  GRADE_OPTIONS,
  TARGET_CLASS_OPTIONS,
} from '@/constants/profileOptions'
import './MyPage.css'

function MyPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    nickname: '',
    major: MAJOR_OPTIONS[0],
    grade: GRADE_OPTIONS[0],
    targetClass: TARGET_CLASS_OPTIONS[0],
    password: '',
    confirmPassword: '',
  })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getDashboardMe()
        const user = res.data
        setForm({
          email: user.email || '',
          nickname: user.nickname || '',
          major: user.major || MAJOR_OPTIONS[0],
          grade: user.grade || GRADE_OPTIONS[0],
          targetClass: user.targetClass || TARGET_CLASS_OPTIONS[0],
          password: '',
          confirmPassword: '',
        })
        setStats({
          level: user.level,
          exp: user.exp,
          expToNext: user.expToNext,
          gold: user.gold,
          coin: user.coin,
          reputation: user.reputation,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nickname.trim()) {
      setError('모험가 이름을 입력해주세요.')
      return
    }

    if (form.password && form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        nickname: form.nickname.trim(),
        major: form.major,
        grade: form.grade,
        targetClass: form.targetClass,
      }

      if (form.password) {
        payload.password = form.password
      }

      const res = await api.updateProfile(payload)
      saveUser(res.data)
      setStats({
        level: res.data.level,
        exp: res.data.exp,
        expToNext: res.data.expToNext,
        gold: res.data.gold,
        coin: res.data.coin,
        reputation: res.data.reputation,
      })
      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }))
      setSuccess('프로필이 저장되었습니다.')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mypage-page landing">
        <p className="mypage-loading">프로필 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="mypage-page landing">
      <header className="landing-header">
        <Link to="/dashboard" className="landing-logo landing-logo-link">
          <span className="landing-logo-icon" aria-hidden="true">
            🔮
          </span>
          <span>Interesthub</span>
        </Link>
      </header>

      <main className="landing-main">
        <section className="quest-board signup-board mypage-board">
          <div className="quest-tab">📜 마이페이지</div>

          <div className="quest-content">
            <h1 className="quest-title">[ 모험가 정보 수정 ]</h1>
            <div className="quest-divider" />

            {stats && (
              <div className="mypage-stats">
                <span>Lv.{stats.level}</span>
                <span>EXP {stats.exp}/{stats.expToNext}</span>
                <span>💎 {stats.gold}</span>
                <span>💰 {stats.coin}</span>
                <span>⭐ {stats.reputation}</span>
              </div>
            )}

            <div className="quest-divider" />

            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="form-field">
                <span className="form-label">이메일 (Email)</span>
                <input
                  type="email"
                  name="email"
                  className="form-input form-input-readonly"
                  value={form.email}
                  readOnly
                />
              </label>

              <label className="form-field">
                <span className="form-label">모험가 이름 (Nickname) *</span>
                <input
                  type="text"
                  name="nickname"
                  className="form-input"
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
                <span className="form-label">새 비밀번호 (변경 시에만)</span>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="변경하지 않으면 비워두세요"
                  value={form.password}
                  onChange={handleChange}
                />
              </label>

              <label className="form-field">
                <span className="form-label">새 비밀번호 확인</span>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </label>

              {error && <p className="form-error">{error}</p>}
              {success && <p className="form-success">{success}</p>}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : '⚔️ 저장하기'}
              </button>

              <button
                type="button"
                className="login-signup-btn"
                onClick={() => navigate('/dashboard')}
              >
                대시보드로 돌아가기
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default MyPage
