import { useEffect, useState } from 'react'
import AiPaybackPanel from '@/components/AiPaybackPanel'
import { DIA_CHARGE_PACKAGES } from '@/data/diaPackages'
import {
  COINS_PER_DIAMOND,
  MIN_EXCHANGE_COINS,
  MIN_EXCHANGE_DIAMONDS,
} from '@/utils/currencyExchange'
import './CurrencyShopModal.css'

function CurrencyShopModal({
  isOpen,
  coinBalance,
  diamondBalance,
  isProcessing,
  userId,
  userNickname,
  onDeductDiamonds,
  onNotify,
  onClose,
  onExchange,
  onExchangeDiaToCoin,
  onChargeDia,
}) {
  const [activeTab, setActiveTab] = useState('exchange')
  const [coinExchangeInput, setCoinExchangeInput] = useState('')
  const [diaExchangeInput, setDiaExchangeInput] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('exchange')
      setCoinExchangeInput('')
      setDiaExchangeInput('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCoinExchangeSubmit = (event) => {
    event.preventDefault()
    if (isProcessing) return

    const success = onExchange(coinExchangeInput)
    if (success) {
      setCoinExchangeInput('')
    }
  }

  const handleDiaExchangeSubmit = (event) => {
    event.preventDefault()
    if (isProcessing) return

    const success = onExchangeDiaToCoin(diaExchangeInput)
    if (success) {
      setDiaExchangeInput('')
    }
  }

  const handlePackageClick = (pkg) => {
    if (isProcessing) return
    onChargeDia(pkg)
  }

  const isPaybackTab = activeTab === 'payback'

  return (
    <div className="currency-shop-overlay" onClick={onClose}>
      <div
        className={`currency-shop-modal ${isPaybackTab ? 'wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="currency-shop-title"
      >
        <div className="currency-shop-tab">💎 길드 재화 상점</div>

        <div className="currency-shop-nav">
          <button
            type="button"
            className={`currency-shop-nav-btn ${
              activeTab === 'exchange' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('exchange')}
            disabled={isProcessing}
          >
            환전 · 충전
          </button>
          <button
            type="button"
            className={`currency-shop-nav-btn ${
              activeTab === 'payback' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('payback')}
            disabled={isProcessing}
          >
            AI 영수증 환급
          </button>
        </div>

        <div className="currency-shop-body">
          {activeTab === 'exchange' ? (
            <>
              <h2 id="currency-shop-title" className="currency-shop-title">
                환전 · 다이아 충전
              </h2>

              <div className="currency-shop-balance">
                <span>보유 코인: {coinBalance} 💰</span>
                <span>보유 다이아: {diamondBalance} 💎</span>
              </div>

              <div className="currency-shop-columns">
                <div className="currency-shop-column currency-shop-column-left">
                  <section className="currency-shop-section">
                    <h3>코인 ➔ 다이아 환전</h3>
                    <p className="currency-shop-desc">
                      {MIN_EXCHANGE_COINS}코인 단위 · {COINS_PER_DIAMOND}코인 =
                      1다이아
                    </p>
                    <form
                      className="currency-exchange-form"
                      onSubmit={handleCoinExchangeSubmit}
                    >
                      <label
                        className="currency-exchange-label"
                        htmlFor="exchange-coins"
                      >
                        환전할 코인 수량
                      </label>
                      <input
                        id="exchange-coins"
                        type="number"
                        min={MIN_EXCHANGE_COINS}
                        step={MIN_EXCHANGE_COINS}
                        className="currency-exchange-input"
                        value={coinExchangeInput}
                        onChange={(e) => setCoinExchangeInput(e.target.value)}
                        placeholder={`예: ${MIN_EXCHANGE_COINS}, 150, 250`}
                        disabled={isProcessing}
                      />
                      <button
                        type="submit"
                        className="currency-shop-btn currency-shop-btn-primary"
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중...' : '코인 → 다이아'}
                      </button>
                    </form>
                  </section>

                  <section className="currency-shop-section currency-shop-section-last">
                    <h3>다이아 ➔ 코인 환전</h3>
                    <p className="currency-shop-desc">
                      {MIN_EXCHANGE_DIAMONDS}다이아 단위 · 1다이아 ={' '}
                      {COINS_PER_DIAMOND}코인
                    </p>
                    <form
                      className="currency-exchange-form"
                      onSubmit={handleDiaExchangeSubmit}
                    >
                      <label
                        className="currency-exchange-label"
                        htmlFor="exchange-dia"
                      >
                        환전할 다이아 수량
                      </label>
                      <input
                        id="exchange-dia"
                        type="number"
                        min={MIN_EXCHANGE_DIAMONDS}
                        step={MIN_EXCHANGE_DIAMONDS}
                        className="currency-exchange-input"
                        value={diaExchangeInput}
                        onChange={(e) => setDiaExchangeInput(e.target.value)}
                        placeholder={`예: ${MIN_EXCHANGE_DIAMONDS}, 15, 25`}
                        disabled={isProcessing}
                      />
                      <button
                        type="submit"
                        className="currency-shop-btn currency-shop-btn-primary"
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중...' : '다이아 → 코인'}
                      </button>
                    </form>
                  </section>
                </div>

                <div
                  className="currency-shop-column-divider"
                  aria-hidden="true"
                />

                <div className="currency-shop-column currency-shop-column-right">
                  <section className="currency-shop-section currency-shop-section-last">
                    <h3>다이아 충전 패키지</h3>
                    <ul className="currency-package-list">
                      {DIA_CHARGE_PACKAGES.map((pkg) => (
                        <li key={pkg.id}>
                          <button
                            type="button"
                            className={`currency-package-card ${
                              pkg.highlight ? 'highlight' : ''
                            }`}
                            onClick={() => handlePackageClick(pkg)}
                            disabled={isProcessing}
                          >
                            <span className="currency-package-name">
                              {pkg.name}
                            </span>
                            <span className="currency-package-price">
                              {pkg.priceKrw.toLocaleString()}원
                            </span>
                            <span className="currency-package-reward">
                              +{pkg.diamonds} 💎
                            </span>
                            <span className="currency-package-desc">
                              {pkg.description}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 id="currency-shop-title" className="currency-shop-title">
                AI 영수증 자동 환급
              </h2>
              <AiPaybackPanel
                userId={userId}
                userNickname={userNickname}
                diamondBalance={diamondBalance}
                onDeductDiamonds={onDeductDiamonds}
                onNotify={onNotify}
              />
            </>
          )}

          <button
            type="button"
            className="currency-shop-btn currency-shop-btn-close"
            onClick={onClose}
            disabled={isProcessing}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default CurrencyShopModal
