import './QuestVerdictModal.css'

function QuestVerdictModal({
  isOpen,
  status,
  reason,
  questTitle,
  isSubmitting,
  onConfirmSuccess,
  onClose,
}) {
  if (!isOpen) return null

  const isSuccess = status === 'SUCCESS'

  return (
    <div className="quest-verdict-overlay" onClick={onClose}>
      <div
        className={`quest-verdict-modal ${isSuccess ? 'success' : 'fail'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-verdict-title"
      >
        <div className="quest-verdict-tab">
          {isSuccess ? '⚔️ AI 길드장의 승인' : '🛡️ AI 길드장의 반려'}
        </div>

        <div className="quest-verdict-body">
          <div className="quest-verdict-guild-master" aria-hidden="true">
            🧙‍♂️
          </div>

          <span
            className={`quest-verdict-badge ${isSuccess ? 'badge-success' : 'badge-fail'}`}
          >
            {isSuccess ? '✨ SUCCESS' : '⛔ FAIL'}
          </span>

          <h2 id="quest-verdict-title" className="quest-verdict-title">
            {isSuccess ? '퀘스트 인증 성공!' : '퀘스트 인증 실패'}
          </h2>

          {questTitle && (
            <p className="quest-verdict-quest-name">미션: {questTitle}</p>
          )}

          <div className="quest-verdict-speech">
            <p className="quest-verdict-reason">{reason}</p>
          </div>

          <div className="quest-verdict-actions">
            {isSuccess ? (
              <button
                type="button"
                className="quest-verdict-btn quest-verdict-btn-primary"
                onClick={onConfirmSuccess}
                disabled={isSubmitting}
              >
                {isSubmitting ? '보상 지급 중...' : '🎁 보상 받고 완료'}
              </button>
            ) : (
              <button
                type="button"
                className="quest-verdict-btn quest-verdict-btn-primary"
                onClick={onClose}
              >
                다시 증거 제출하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestVerdictModal
