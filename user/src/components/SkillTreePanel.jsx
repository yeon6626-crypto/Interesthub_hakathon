import { useState, useMemo } from 'react'
import { normalizeRoadmapByYear } from '@/utils/roadmapYears'
import { calcCreditPoints } from '@/constants/courseCredits'
import './SkillTree.css'

function SkillTreePanel({
  user,
  roadmap,
  onClose,
  onToggleCourse,
  actionLoading,
}) {
  const years = useMemo(() => normalizeRoadmapByYear(roadmap), [roadmap])

  const [activeYear, setActiveYear] = useState(1)

  const activeYearData = years.find((y) => y.year === activeYear) || {
    year: activeYear,
    title: `${activeYear}차 (${activeYear}학년)`,
    items: [],
    mastered: false,
    progress: { completed: 0, total: 0 },
  }

  const totalCourses = years.reduce(
    (sum, year) => sum + (year.progress?.total || 0),
    0
  )
  const completedCourses = years.reduce(
    (sum, year) => sum + (year.progress?.completed || 0),
    0
  )
  const expPercent =
    totalCourses > 0
      ? Math.round((completedCourses / totalCourses) * 100)
      : 0

  const skillPoints = calcCreditPoints(completedCourses)

  return (
    <div className="skill-tree-overlay" onClick={onClose}>
      <div
        className="skill-tree-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-tree-title"
      >
        <header className="skill-tree-header">
          <h2 id="skill-tree-title">Interest Hub - 스킬 도감</h2>
          <div className="skill-tree-header-right">
            <span className="skill-tree-sp">
              보유 학점 포인트(SP): <strong>{skillPoints}</strong>
            </span>
            <button
              type="button"
              className="skill-tree-close"
              onClick={onClose}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="skill-tree-body">
          <aside className="skill-tree-sidebar">
            <div className="skill-tree-profile">
              <div className="skill-tree-avatar">🧙</div>
              <h3>{user?.nickname || '모험가'}</h3>
              <p className="skill-tree-title">
                [ 칭호: 회로의 지배자 수습생 ]
              </p>
            </div>

            <dl className="skill-tree-stats">
              <div>
                <dt>클래스(진로)</dt>
                <dd>{user?.targetClass || '-'}</dd>
              </div>
              <div>
                <dt>학적 소속</dt>
                <dd>{user?.major || '-'}</dd>
              </div>
              <div>
                <dt>현재 레벨</dt>
                <dd>Lv. {user?.level ?? 1}</dd>
              </div>
              <div>
                <dt>보유 다이아</dt>
                <dd>{user?.gold ?? 0} 💎</dd>
              </div>
            </dl>

            <div className="skill-tree-exp-box">
              <p>이수 성취도 (EXP)</p>
              <div className="skill-tree-exp-bar">
                <div
                  className="skill-tree-exp-fill"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <p className="skill-tree-exp-text">
                {completedCourses} / {totalCourses} ({expPercent}%)
              </p>
            </div>
          </aside>

          <section className="skill-tree-main">
            <nav className="skill-tree-year-tabs" aria-label="학년별 과목">
              {years.map((year) => (
                <button
                  key={year.year}
                  type="button"
                  className={`skill-tree-year-tab ${activeYear === year.year ? 'active' : ''}`}
                  onClick={() => setActiveYear(year.year)}
                >
                  {year.title}
                </button>
              ))}
            </nav>

            <ul className="skill-tree-course-list">
              {activeYearData.items.length === 0 ? (
                <li className="skill-tree-empty">
                  이 학년에 등록된 과목이 없습니다.
                </li>
              ) : (
                activeYearData.items.map((course) => {
                  const isCompleted =
                    course.status === 'COMPLETED' || course.isCompleted === true
                  const isLoading = actionLoading === course._id

                  const handleToggle = () => {
                    if (isLoading) return
                    onToggleCourse(course._id, isCompleted)
                  }

                  return (
                    <li
                      key={course._id}
                      className={`skill-tree-course ${isCompleted ? 'done clickable-done' : 'available'}`}
                      onClick={handleToggle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleToggle()
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="skill-tree-course-icon">{course.icon}</span>
                      <div className="skill-tree-course-info">
                        <p className="skill-tree-course-name">
                          {course.displayName || course.name}
                        </p>
                        <p className="skill-tree-course-level">
                          {isCompleted
                            ? '마스터 레벨 [1/1] (이수 완료)'
                            : '스킬 레벨 [0/1]'}
                        </p>
                        {!isCompleted && course.prerequisiteLabel && (
                          <p className="skill-tree-prereq">
                            ※ 선행 요구 스킬: {course.prerequisiteLabel}
                          </p>
                        )}
                      </div>

                      {isCompleted ? (
                        <span
                          className="skill-tree-master-badge"
                          title="클릭하면 이수 취소"
                        >
                          {isLoading ? '…' : 'MASTER'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="skill-tree-action-btn"
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggle()
                          }}
                          title="스킬 마스터하기 (+3 SP)"
                        >
                          {isLoading ? '…' : '+'}
                        </button>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SkillTreePanel
