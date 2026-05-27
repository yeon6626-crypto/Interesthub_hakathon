import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  requestPayback,
  getMyExchanges,
  getExchangeMeta,
} from '@/api/client'
import { PAYBACK_CATEGORIES } from '@/data/paybackCategories'
import {
  calculateRequiredDia,
  getPaybackAmountError,
  MIN_PAYBACK_AMOUNT_KRW,
  PAYBACK_AMOUNT_STEP_KRW,
  snapPaybackAmount,
} from '@/utils/paybackDiamond'
import './AiPaybackPanel.css'

const STATUS_LABELS = {
  PENDING: '승인 대기',
  COMPLETED: '지급 완료',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
}

function AiPaybackPanel({
  diamondBalance = 0,
  onNotify,
  onPaybackComplete,
}) {
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [naverPayId, setNaverPayId] = useState('')
  const [diaMultiplier, setDiaMultiplier] = useState(1.3)
  const [myExchanges, setMyExchanges] = useState([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedCategory = PAYBACK_CATEGORIES.find(
    (item) => item.id === selectedServiceId
  )

  const amount = useMemo(() => {
    const parsed = Math.floor(Number(amountInput))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }, [amountInput])

  const requiredDia = useMemo(() => {
    if (amount <= 0) return 0
    return calculateRequiredDia(amount)
  }, [amount])

  const amountError = useMemo(() => getPaybackAmountError(amount), [amount])

  const hasEnoughDia = requiredDia > 0 && diamondBalance >= requiredDia
  const meetsMinAmount = amount >= MIN_PAYBACK_AMOUNT_KRW

  const canSubmit =
    Boolean(selectedCategory) &&
    meetsMinAmount &&
    !amountError &&
    hasEnoughDia &&
    !isSubmitting &&
    !isLoadingMeta

  const loadMetaAndHistory = useCallback(async () => {
    setIsLoadingMeta(true)
    try {
      const [metaRes, historyRes] = await Promise.all([
        getExchangeMeta(),
        getMyExchanges(),
      ])
      if (metaRes?.data?.diaMultiplier) {
        setDiaMultiplier(metaRes.data.diaMultiplier)
      }
      setMyExchanges(historyRes?.data ?? [])
    } catch {
      setMyExchanges([])
    } finally {
      setIsLoadingMeta(false)
    }
  }, [])

  useEffect(() => {
    loadMetaAndHistory()
  }, [loadMetaAndHistory])

  const handleAmountBlur = () => {
    const snapped = snapPaybackAmount(amountInput)
    if (snapped > 0 && snapped !== amount) {
      setAmountInput(String(snapped))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit || !selectedCategory) return

    const submitAmount = snapPaybackAmount(amount) || amount
    if (submitAmount !== amount) {
      setAmountInput(String(submitAmount))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await requestPayback({
        serviceName: selectedCategory.serviceName,
        amount: submitAmount,
        naverPayId: naverPayId.trim(),
      })

      window.alert(res.message || '네이버페이 포인트 환급 신청이 접수되었습니다.')

      onNotify?.(
        `${selectedCategory.label} · ${submitAmount.toLocaleString()}원 환급 신청 (💎 ${requiredDia.toLocaleString()} 차감)`
      )

      if (res.data?.user) {
        onPaybackComplete?.(res.data.user)
      }

      setAmountInput('')
      setNaverPayId('')
      await loadMetaAndHistory()
    } catch (err) {
      window.alert(err.message || '환급 신청에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ai-payback-panel">
      <p className="ai-payback-intro">
        환급 받을 서비스와 결제 금액을 입력하세요. 결제 금액의{' '}
        <strong>{diaMultiplier}%</strong>(÷100)만큼 다이아를 소모하고, 승인 후
        네이버페이 포인트로 동일 금액이 지급됩니다. (최소{' '}
        {MIN_PAYBACK_AMOUNT_KRW.toLocaleString()}원 ·{' '}
        {PAYBACK_AMOUNT_STEP_KRW.toLocaleString()}원 단위 · 예: 29,000원 → 💎377)
      </p>

      <p className="ai-payback-dia-notice">
        보유 다이아: <strong>💎 {diamondBalance.toLocaleString()}</strong>
      </p>

      {isLoadingMeta ? (
        <div className="ai-payback-loading" role="status">
          <span className="ai-payback-spinner" aria-hidden="true" />
          환급 정보를 불러오는 중...
        </div>
      ) : (
        <form className="ai-payback-form" onSubmit={handleSubmit}>
          <div className="ai-payback-form-layout">
            <fieldset className="ai-payback-fieldset ai-payback-col-services">
              <legend>환급 대상 서비스</legend>
              <div className="ai-payback-grid">
                {PAYBACK_CATEGORIES.map((category) => {
                  const isSelected = selectedServiceId === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`ai-payback-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedServiceId(category.id)}
                      disabled={isSubmitting}
                    >
                      <span className="ai-payback-card-icon" aria-hidden="true">
                        {category.icon}
                      </span>
                      <span className="ai-payback-card-label">
                        {category.label}
                      </span>
                      <span className="ai-payback-card-desc">
                        {category.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="ai-payback-col-inputs">
              <label
                className={`ai-payback-field ${amountError ? 'has-error' : ''}`}
              >
                <span>결제 금액 (원)</span>
                <input
                  type="number"
                  min={MIN_PAYBACK_AMOUNT_KRW}
                  step={PAYBACK_AMOUNT_STEP_KRW}
                  inputMode="numeric"
                  placeholder={`${PAYBACK_AMOUNT_STEP_KRW.toLocaleString()}원 단위 (예: 29000)`}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  onBlur={handleAmountBlur}
                  disabled={isSubmitting}
                  aria-invalid={amountError ? 'true' : 'false'}
                  aria-describedby={
                    amountError ? 'payback-amount-error' : undefined
                  }
                />
                {amountError && (
                  <span
                    id="payback-amount-error"
                    className="ai-payback-field-error"
                    role="alert"
                  >
                    {amountError}
                  </span>
                )}
              </label>

              <label className="ai-payback-field">
                <span>네이버페이 ID (선택)</span>
                <input
                  type="text"
                  placeholder="포인트 지급용 ID"
                  value={naverPayId}
                  onChange={(e) => setNaverPayId(e.target.value)}
                  disabled={isSubmitting}
                />
              </label>

              {amount > 0 && (
                <div className="ai-payback-summary" role="status">
                  <p>
                    환급 예정 포인트:{' '}
                    <strong>{amount.toLocaleString()}원</strong>
                  </p>
                  <p className="ai-payback-dia-cost">
                    필요 다이아:{' '}
                    <strong>💎 {requiredDia.toLocaleString()}</strong>
                    {!hasEnoughDia && (
                      <span className="ai-payback-insufficient">
                        {' '}
                        (부족:{' '}
                        {(requiredDia - diamondBalance).toLocaleString()}개)
                      </span>
                    )}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="ai-payback-claim-btn"
                disabled={!canSubmit}
              >
                {isSubmitting
                  ? '신청 중...'
                  : canSubmit
                    ? `포인트 환급 신청 (💎 ${requiredDia.toLocaleString()})`
                    : amountError?.includes('단위')
                      ? `${PAYBACK_AMOUNT_STEP_KRW.toLocaleString()}원 단위로 입력`
                      : amountError
                        ? `최소 ${MIN_PAYBACK_AMOUNT_KRW.toLocaleString()}원 이상`
                        : amount > 0 && !hasEnoughDia
                        ? '다이아 부족'
                        : '서비스와 금액을 입력하세요'}
              </button>
            </div>
          </div>
        </form>
      )}

      {myExchanges.length > 0 && (
        <section className="ai-payback-history">
          <h3>내 환급 신청 내역</h3>
          <ul className="ai-payback-history-list">
            {myExchanges.map((row) => (
              <li key={row._id} className={`ai-payback-history-item status-${row.status?.toLowerCase()}`}>
                <span className="ai-payback-history-service">{row.serviceName}</span>
                <span>{row.amount?.toLocaleString()}원</span>
                <span className={`ai-payback-history-status status-${row.status}`}>
                  {STATUS_LABELS[row.status] || row.status}
                </span>
                <span className="ai-payback-history-dia">
                  💎 {row.diaCost?.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default AiPaybackPanel
