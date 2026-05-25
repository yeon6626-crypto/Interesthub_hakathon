import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchGeminiRoadmap,
  getCachedGeminiRoadmap,
  EMPTY_ROADMAP,
} from '@/services/geminiRoadmap'
import { calcCreditPoints, CREDITS_PER_COURSE } from '@/constants/courseCredits'
import './MapleSkillWindow.css'

const GRADE_TABS = [
  { key: 'grade1', label: '1차 (1학년)' },
  { key: 'grade2', label: '2차 (2학년)' },
  { key: 'grade3', label: '3차 (3학년)' },
  { key: 'grade4', label: '4차 (4학년)' },
]

function masteredStorageKey(userId) {
  return `interesthub-gemini-mastered-${userId || 'guest'}`
}

function loadMasteredIds(userId) {
  try {
    const raw = localStorage.getItem(masteredStorageKey(userId))
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveMasteredIds(userId, ids) {
  localStorage.setItem(
    masteredStorageKey(userId),
    JSON.stringify([...ids])
  )
}

function MapleSkillWindow({ user, onClose }) {
  const [roadmapData, setRoadmapData] = useState(() => {
    const cached = getCachedGeminiRoadmap(user?.major, user?.targetClass)
    return cached?.grade1?.length ? cached : EMPTY_ROADMAP
  })
  const [activeGrade, setActiveGrade] = useState('grade1')
  const [masteredIds, setMasteredIds] = useState(() =>
    loadMasteredIds(user?._id)
  )
  const [loading, setLoading] = useState(() => {
    const cached = getCachedGeminiRoadmap(user?.major, user?.targetClass)
    return !(cached?.grade1?.length)
  })
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const loadRoadmap = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchGeminiRoadmap(
        user?.major,
        user?.targetClass,
        { forceRefresh }
      )
      setRoadmapData(data)
    } catch (err) {
      const cached = getCachedGeminiRoadmap(user?.major, user?.targetClass)
      if (cached?.grade1?.length) {
        setRoadmapData(cached)
        setError('')
      } else {
        setError(err.message || '로드맵을 불러오지 못했습니다.')
        setRoadmapData(EMPTY_ROADMAP)
      }
    } finally {
      setLoading(false)
    }
  }, [user?.major, user?.targetClass])

  useEffect(() => {
    const cached = getCachedGeminiRoadmap(user?.major, user?.targetClass)
    if (cached?.grade1?.length) {
      setRoadmapData(cached)
      setLoading(false)
      setError('')
      return
    }
    loadRoadmap()
  }, [user?.major, user?.targetClass, loadRoadmap])

  useEffect(() => {
    setMasteredIds(loadMasteredIds(user?._id))
  }, [user?._id])

  const currentCourses = roadmapData[activeGrade] || []

  const { totalCourses, completedCount, expPercent } = useMemo(() => {
    const all = GRADE_TABS.flatMap((tab) => roadmapData[tab.key] || [])
    const total = all.length
    const completed = all.filter((c) => masteredIds.has(c.id)).length
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { totalCourses: total, completedCount: completed, expPercent: percent }
  }, [roadmapData, masteredIds])

  const skillPoints = calcCreditPoints(completedCount)

  const toggleMaster = (courseId) => {
    if (actionId) return
    setActionId(courseId)

    setMasteredIds((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) {
        next.delete(courseId)
      } else {
        next.add(courseId)
      }
      saveMasteredIds(user?._id, next)
      return next
    })

    setTimeout(() => setActionId(null), 200)
  }

  return (
    <div className="maple-skill-overlay" onClick={onClose}>
      <div
        className="maple-skill-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="maple-skill-title"
      >
        <header className="maple-skill-header">
          <h2 id="maple-skill-title">Interest Hub - 스킬 도감</h2>
          <div className="maple-skill-header-meta">
            <span className="maple-skill-sp">
              보유 학점 포인트(SP): <strong>{skillPoints}</strong>
            </span>
            <button
              type="button"
              className="maple-skill-close"
              onClick={onClose}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </header>

        {loading ? (
          <div className="maple-skill-loading">
            <div className="maple-skill-spinner" aria-hidden="true" />
            <p>AI 길드장이 로드맵을 분석 중입니다...</p>
          </div>
        ) : error ? (
          <div className="maple-skill-error">
            <p>{error}</p>
            <button type="button" onClick={() => loadRoadmap(true)}>
              다시 시도
            </button>
          </div>
        ) : (
          <>
            <div className="maple-skill-exp">
              <p>이수 성취도 (EXP)</p>
              <div className="maple-skill-exp-bar">
                <div
                  className="maple-skill-exp-fill"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <p className="maple-skill-exp-text">
                {completedCount} / {totalCourses} ({expPercent}%)
              </p>
            </div>

            <div className="skill-window">
              <nav className="skill-tabs" aria-label="학년별 과목">
                {GRADE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`tab-item ${activeGrade === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveGrade(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="skill-body">
                {currentCourses.length === 0 ? (
                  <p className="skill-body-empty">
                    이 학년에 추천 과목이 없습니다.
                  </p>
                ) : (
                  currentCourses.map((item) => {
                    const isMastered = masteredIds.has(item.id)
                    const isBusy = actionId === item.id

                    return (
                      <div
                        key={item.id}
                        className={`skill-card ${isMastered ? 'mastered' : ''}`}
                        onClick={() => !isBusy && toggleMaster(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (!isBusy) toggleMaster(item.id)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="skill-left">
                          <div
                            className={`skill-icon-box ${isMastered ? 'mastered' : 'available'}`}
                          >
                            {item.icon}
                          </div>
                          <div className="skill-info">
                            <div className="skill-name">{item.name}</div>
                            <div className="skill-level-text">
                              {isMastered
                                ? '마스터 레벨 [1/1] (이수 완료)'
                                : '스킬 레벨 [0/1]'}
                            </div>
                          </div>
                        </div>
                        <div className="skill-right">
                          {isMastered ? (
                            <span
                              className="skill-master-badge"
                              title={`클릭 시 이수 취소 (-${CREDITS_PER_COURSE} SP)`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              MASTER
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="sp-plus-btn"
                              disabled={isBusy}
                              title={`마스터 (+${CREDITS_PER_COURSE} SP)`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleMaster(item.id)
                              }}
                            >
                              {isBusy ? '…' : '➕'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MapleSkillWindow
