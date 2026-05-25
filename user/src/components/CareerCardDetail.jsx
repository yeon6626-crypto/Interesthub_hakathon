function CareerCardDetail({ card, onClose }) {
  if (!card) return null

  return (
    <div className="gacha-overlay" onClick={onClose}>
      <div
        className="card-detail-modal"
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

        <div className={`card-detail-header rarity-${card.rarity}`}>
          <span className="card-detail-icon">{card.icon}</span>
          <div>
            <p className="card-detail-class">[{card.className}]</p>
            <h2>{card.title}</h2>
          </div>
        </div>

        <section className="card-detail-section">
          <h3>직무 소개</h3>
          <p>{card.description}</p>
        </section>

        <section className="card-detail-section">
          <h3>핵심 역량</h3>
          <ul>
            {card.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>

        <section className="card-detail-section">
          <h3>필요 스펙</h3>
          <ul>
            {card.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        </section>

        {card.acquiredAt && (
          <p className="card-detail-acquired">
            획득일: {new Date(card.acquiredAt).toLocaleDateString('ko-KR')}
          </p>
        )}
      </div>
    </div>
  )
}

export default CareerCardDetail
