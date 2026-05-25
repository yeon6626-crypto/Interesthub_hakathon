import { getCollection, CAREER_CARDS } from '@/utils/collection'
import { COLLECTION_COMPLETE_COIN_REWARD } from '@/utils/userEconomy'
import './CareerGacha.css'

function CareerCollection({ onSelectCard }) {
  const collection = getCollection()
  const collectedIds = new Set(collection.map((c) => c.id))

  return (
    <section className="collection-section">
      <h3>📖 진로 카드 도감</h3>
      <p className="collection-desc">
        획득한 카드를 클릭하면 직무 상세 정보를 확인할 수 있습니다. (
        {collection.length}/{CAREER_CARDS.length}) · 도감 완성 시{' '}
        {COLLECTION_COMPLETE_COIN_REWARD.toLocaleString()} 코인 보상 후 초기화
      </p>

      <div className="collection-grid">
        {CAREER_CARDS.map((card) => {
          const owned = collectedIds.has(card.id)
          const ownedCard = collection.find((c) => c.id === card.id)

          return (
            <button
              key={card.id}
              type="button"
              className={`collection-slot ${owned ? 'owned' : 'locked'} rarity-${card.rarity}`}
              onClick={() => owned && onSelectCard(ownedCard)}
              disabled={!owned}
            >
              {owned ? (
                <>
                  <span className="collection-icon">{card.icon}</span>
                  <span className="collection-class">{card.className}</span>
                  <span className="collection-title">{card.title}</span>
                </>
              ) : (
                <>
                  <span className="collection-icon">❓</span>
                  <span className="collection-locked">미획득</span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default CareerCollection
