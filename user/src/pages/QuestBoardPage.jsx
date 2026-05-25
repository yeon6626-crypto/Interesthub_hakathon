import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getStoredUser } from '@/utils/auth'
import {
  loadAcceptedQuests,
  acceptQuest as addAcceptedQuest,
} from '@/utils/acceptedQuests'
import { buildDefaultQuests } from '@/data/questCatalog'
import './QuestBoard.css'

function QuestBoardPage() {
  const user = getStoredUser()
  const quests = useMemo(() => buildDefaultQuests(), [])
  const [acceptedIds, setAcceptedIds] = useState(
    () => new Set(loadAcceptedQuests(user?._id).map((q) => q._id))
  )
  const [acceptingQuestId, setAcceptingQuestId] = useState(null)

  const handleAccept = (quest) => {
    if (acceptingQuestId) return
    if (acceptedIds.has(quest._id)) return

    setAcceptingQuestId(quest._id)
    try {
      addAcceptedQuest(user?._id, quest)
      setAcceptedIds((prev) => new Set([...prev, quest._id]))
    } finally {
      setAcceptingQuestId(null)
    }
  }

  return (
    <div className="quest-board-page landing">
      <header className="landing-header">
        <Link to="/dashboard" className="landing-logo landing-logo-link">
          <span className="landing-logo-icon" aria-hidden="true">
            🔮
          </span>
          <span>Interesthub</span>
        </Link>
      </header>

      <main className="landing-main">
        <section className="quest-board-panel">
          <div className="quest-board-tab">⚔️ 퀘스트 게시판</div>

          <div className="quest-board-content">
            <div className="quest-board-header">
              <h1>모험가에게 맡겨진 퀘스트</h1>
              <Link to="/dashboard" className="quest-board-back">
                대시보드로 돌아가기
              </Link>
            </div>

            <div className="quest-board-grid">
              {quests.map((quest) => {
                const isAccepted = acceptedIds.has(quest._id)
                const isAccepting = acceptingQuestId === quest._id

                return (
                  <article key={quest._id} className="quest-board-card">
                    <div className="quest-board-card-body">
                      <p className="quest-board-type">{quest.typeLabel}</p>
                      <p className="quest-board-title">{quest.title}</p>
                      <p className="quest-board-reward">
                        보상: {quest.rewardLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="quest-accept-btn"
                      disabled={
                        isAccepted || Boolean(acceptingQuestId)
                      }
                      onClick={() => handleAccept(quest)}
                    >
                      {isAccepted
                        ? '받음'
                        : isAccepting
                          ? '처리 중...'
                          : '퀘스트 받기'}
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default QuestBoardPage
