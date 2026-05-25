import { useEffect, useState } from 'react'
import { GACHA_COST, GACHA_DRAW_COUNT, drawRandomCards } from '@/data/careerCards'
import { api } from '@/api/client'
import { saveToCollection } from '@/utils/collection'
import './CareerGacha.css'

function GachaFlipCard({ card, index, isRevealed }) {
  return (
    <div
      className={`gacha-flip-card ${isRevealed ? 'revealed' : ''} rarity-${card.rarity}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="gacha-flip-inner">
        <div className="gacha-flip-front">
          <span className="gacha-card-back-icon">🃏</span>
          <span>운명의 카드</span>
        </div>
        <div className="gacha-flip-back">
          <span className="gacha-card-icon">{card.icon}</span>
          <span className="gacha-card-class">{card.className}</span>
          <span className="gacha-card-title">{card.title}</span>
        </div>
      </div>
    </div>
  )
}

function CareerGachaModal({
  coins = 0,
  onDeductCoins,
  onClose,
  onDrawComplete,
}) {
  const [phase, setPhase] = useState('idle')
  const [drawnCards, setDrawnCards] = useState([])
  const [revealedCount, setRevealedCount] = useState(0)
  const [acquireBanner, setAcquireBanner] = useState(null)
  const [newCount, setNewCount] = useState(0)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (coins >= GACHA_COST) {
      setError('')
    }
  }, [coins])

  const runGachaAnimation = (cards, spentUser) => {
    setDrawnCards(cards)
    setPhase('drawing')
    setRevealedCount(0)
    setAcquireBanner(null)
    setIsSubmitting(false)

    setTimeout(() => {
      setPhase('revealing')
      cards.forEach((_, i) => {
        setTimeout(() => {
          setRevealedCount(i + 1)
          setAcquireBanner(cards[i])
        }, i * 400 + 300)
      })

      setTimeout(() => {
        const { newCount: added } = saveToCollection(cards)
        setNewCount(added)
        setPhase('done')
        onDrawComplete?.(spentUser)
      }, cards.length * 400 + 800)
    }, 600)
  }

  const handleDraw = async () => {
    if (coins < GACHA_COST) {
      setError(`코인이 부족합니다. (필요: ${GACHA_COST}, 보유: ${coins})`)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const cards = drawRandomCards(GACHA_DRAW_COUNT)
      let spentUser = null

      try {
        const spendRes = await api.spendCoins(GACHA_COST)
        spentUser = spendRes.data.user
      } catch (apiErr) {
        const isInsufficient =
          apiErr.message?.includes('코인이 부족') ||
          apiErr.message?.includes('insufficient')

        if (!isInsufficient) {
          throw apiErr
        }

        // 서버 잔액 부족(디버그 코인 등): 클라이언트에서만 1회 차감
        onDeductCoins?.(GACHA_COST)
      }

      runGachaAnimation(cards, spentUser)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  const isRevealed = (index) =>
    phase === 'revealing' || phase === 'done'
      ? index < revealedCount
      : false

  return (
    <div className="gacha-overlay" onClick={onClose}>
      <div
        className="gacha-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="gacha-close-btn"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <h2 className="gacha-modal-title">🎲 꿈 찾기 카드깡!</h2>
        <p className="gacha-modal-desc">
          진로를 정하지 못했다면, 운명의 카드 5장을 뽑아 직업을 탐색해보세요.
        </p>
        <p className="gacha-modal-cost">
          비용: {GACHA_COST} 코인 · 1회 {GACHA_DRAW_COUNT}장 · 보유:{' '}
          {coins.toLocaleString()} 코인
        </p>

        {error && <p className="gacha-error">{error}</p>}

        {acquireBanner && phase !== 'idle' && phase !== 'done' && (
          <div className={`gacha-acquire-banner rarity-${acquireBanner.rarity}`}>
            <span className="gacha-acquire-sparkle">✦</span>
            [{acquireBanner.className}] {acquireBanner.title} 획득!
            <span className="gacha-acquire-sparkle">✦</span>
          </div>
        )}

        {(phase === 'revealing' || phase === 'done') && (
          <div className="gacha-cards-row">
            {drawnCards.map((card, index) => (
              <GachaFlipCard
                key={`${card.id}-${index}`}
                card={card}
                index={index}
                isRevealed={isRevealed(index)}
              />
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div className="gacha-result">
            <p>
              뽑기 완료! 새로운 카드 <strong>{newCount}장</strong>이 도감에
              등록되었습니다.
            </p>
            <p className="gacha-result-hint">
              운명의 타로 덱 탭에서 컬렉션을 확인하세요.
            </p>
          </div>
        )}

        <div className="gacha-actions">
          {phase === 'idle' && (
            <button
              type="button"
              className="gacha-draw-btn"
              onClick={handleDraw}
              disabled={isSubmitting || coins < GACHA_COST}
            >
              {isSubmitting ? '뽑는 중...' : `🃏 ${GACHA_DRAW_COUNT}장 뽑기 (-${GACHA_COST} 코인)`}
            </button>
          )}
          {phase === 'drawing' && (
            <p className="gacha-drawing-text">카드를 섞는 중...</p>
          )}
          {(phase === 'done' || phase === 'idle') && phase !== 'drawing' && (
            <button type="button" className="gacha-secondary-btn" onClick={onClose}>
              {phase === 'done' ? '확인' : '닫기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CareerGachaModal
