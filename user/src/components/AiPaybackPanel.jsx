import { useMemo, useRef, useState } from 'react'
import {
  PAYBACK_CATEGORIES,
  PAYBACK_BANKS,
} from '@/data/paybackCategories'
import { verifyReceiptImage } from '@/services/geminiReceiptVerify'
import {
  isDuplicateOrderId,
  saveApprovedOrderId,
} from '@/utils/paybackOrderGuard'
import { calculateRequiredDia } from '@/utils/paybackDiamond'
import './AiPaybackPanel.css'

function AiPaybackPanel({
  userId,
  userNickname,
  diamondBalance = 0,
  onDeductDiamonds,
  onNotify,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [verification, setVerification] = useState(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [diaCharged, setDiaCharged] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accountForm, setAccountForm] = useState({
    bank: PAYBACK_BANKS[0],
    accountNumber: '',
    accountHolder: userNickname || '',
  })

  const fileInputRef = useRef(null)
  const verifyingRef = useRef(false)

  const selectedCategory = PAYBACK_CATEGORIES.find(
    (item) => item.id === selectedCategoryId
  )

  const canClaim =
    verification?.result === 'success' && !isDuplicate && !isVerifying

  const requiredDia = useMemo(() => {
    if (verification?.result !== 'success') return 0
    return calculateRequiredDia(verification.amount)
  }, [verification])

  const resetAll = () => {
    setSelectedCategoryId(null)
    setVerification(null)
    setIsDuplicate(false)
    setShowAccountForm(false)
    setDiaCharged(false)
    setIsVerifying(false)
    setIsSubmitting(false)
    setAccountForm({
      bank: PAYBACK_BANKS[0],
      accountNumber: '',
      accountHolder: userNickname || '',
    })
    verifyingRef.current = false
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSelectCategory = (categoryId) => {
    if (isVerifying || isSubmitting) return

    setSelectedCategoryId(categoryId)
    setVerification(null)
    setIsDuplicate(false)
    setShowAccountForm(false)
    setDiaCharged(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadClick = () => {
    if (!selectedCategory || isVerifying) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedCategory || verifyingRef.current) return

    if (!file.type.startsWith('image/')) {
      window.alert('영수증은 이미지 파일만 업로드할 수 있습니다.')
      event.target.value = ''
      return
    }

    verifyingRef.current = true
    setIsVerifying(true)
    setVerification(null)
    setIsDuplicate(false)
    setShowAccountForm(false)

    try {
      const result = await verifyReceiptImage(file, selectedCategory.label)

      if (result.result !== 'success') {
        setVerification({ result: 'fail' })
        window.alert(
          '영수증 인증에 실패했습니다. 주문번호·카드 정보가 식별 가능한 원본 영수증을 업로드해 주세요.'
        )
        return
      }

      const duplicated = isDuplicateOrderId(result.orderId, userId)
      setVerification(result)
      setIsDuplicate(duplicated)

      if (duplicated) {
        window.alert('이미 환급 처리가 완료된 고유 영수증입니다.')
      }
    } catch (err) {
      window.alert(err.message || '영수증 분석 중 오류가 발생했습니다.')
      setVerification({ result: 'fail' })
    } finally {
      verifyingRef.current = false
      setIsVerifying(false)
      event.target.value = ''
    }
  }

  const handleOpenAccountForm = () => {
    if (!canClaim || isSubmitting || showAccountForm || diaCharged) return

    if (requiredDia > 0 && diamondBalance < requiredDia) {
      window.alert(
        `보유하신 다이아가 부족합니다. 필요한 다이아: ${requiredDia.toLocaleString()}개 / 보유한 다이아: ${diamondBalance.toLocaleString()}개`
      )
      return
    }

    if (requiredDia > 0) {
      const deducted = onDeductDiamonds?.(requiredDia)
      if (deducted === false) {
        window.alert(
          `보유하신 다이아가 부족합니다. 필요한 다이아: ${requiredDia.toLocaleString()}개 / 보유한 다이아: ${diamondBalance.toLocaleString()}개`
        )
        return
      }
    }

    setDiaCharged(true)
    setShowAccountForm(true)
  }
  const handleAccountChange = (field, value) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitRefund = (event) => {
    event.preventDefault()
    if (!canClaim || isSubmitting || !verification?.orderId) return

    const accountNumber = accountForm.accountNumber.trim()
    const accountHolder = accountForm.accountHolder.trim()

    if (!accountNumber || !accountHolder) {
      window.alert('계좌번호와 예금주를 모두 입력해 주세요.')
      return
    }

    setIsSubmitting(true)

    saveApprovedOrderId(userId, verification.orderId)

    const amountText =
      verification.amount > 0
        ? `${verification.amount.toLocaleString()}원`
        : '확인된 금액'

    window.alert(
      `환급 신청이 완료되었습니다!\n\n서비스: ${verification.provider}\n주문번호: ${verification.orderId}\n환급 예정: ${amountText}\n차감 다이아: 💎 ${requiredDia.toLocaleString()}개\n입금 계좌: ${accountForm.bank} ${accountNumber} (${accountHolder})`
    )

    onNotify?.(
      `AI 영수증 환급 완료 · ${verification.provider} (💎 ${requiredDia.toLocaleString()} 차감)`
    )
    resetAll()
  }

  return (
    <div className="ai-payback-panel">
      <p className="ai-payback-warning">
        ⚠️ 주문번호 및 카드 정보가 식별 가능한 원본 영수증만 인증됩니다.
      </p>
      <p className="ai-payback-dia-notice">
        ※ 각 환급권에 필요한 다이아는 영수증 가격의 1.3배만큼의 다이아 수량입니다.
      </p>      <p className="ai-payback-intro">
        AI가 영수증의 보안 식별자(주문번호·카드 정보)를 검증하고 환급을
        처리합니다.
      </p>

      <div className="ai-payback-grid">
        {PAYBACK_CATEGORIES.map((category) => {
          const isSelected = selectedCategoryId === category.id

          return (
            <button
              key={category.id}
              type="button"
              className={`ai-payback-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectCategory(category.id)}
              disabled={isVerifying || isSubmitting}
            >
              <span className="ai-payback-card-icon" aria-hidden="true">
                {category.icon}
              </span>
              <span className="ai-payback-card-label">{category.label}</span>
              <span className="ai-payback-card-desc">{category.description}</span>
              {category.notice && (
                <span className="ai-payback-card-notice">{category.notice}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="ai-payback-upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="ai-payback-file-input"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="ai-payback-upload-btn"
          onClick={handleUploadClick}
          disabled={!selectedCategory || isVerifying || isSubmitting}
        >
          {selectedCategory
            ? `${selectedCategory.label} 영수증 업로드`
            : '환급권을 먼저 선택하세요'}
        </button>

        {isVerifying && (
          <div className="ai-payback-loading" role="status">
            <span className="ai-payback-spinner" aria-hidden="true" />
            Google AI가 영수증 보안 식별자를 분석 중입니다...
          </div>
        )}

        {!isVerifying && verification?.result === 'success' && !isDuplicate && (
          <div className="ai-payback-result success" role="status">
            <p className="ai-payback-result-title">✅ 영수증 인증 성공</p>
            <p>
              서비스: <strong>{verification.provider}</strong>
            </p>
            <p>
              주문번호: <strong>{verification.orderId}</strong>
            </p>
            <p>
              카드 정보: <strong>{verification.cardInfo}</strong>
            </p>
            {verification.amount > 0 && (
              <p className="ai-payback-dia-cost">
                인증된 금액:{' '}
                <strong>{verification.amount.toLocaleString()}원</strong>
                {' → '}
                필요 재화:{' '}
                <strong>💎 {requiredDia.toLocaleString()} 다이아</strong>
              </p>
            )}          </div>
        )}

        {!isVerifying && isDuplicate && (
          <div className="ai-payback-result duplicate" role="alert">
            <p>🚫 이미 환급 처리가 완료된 고유 영수증입니다.</p>
          </div>
        )}

        {!isVerifying && verification?.result === 'fail' && !isDuplicate && (
          <div className="ai-payback-result fail" role="status">
            <p>❌ 인증 실패 — 조건에 맞는 영수증을 다시 제출해 주세요.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        className="ai-payback-claim-btn"
        onClick={handleOpenAccountForm}
        disabled={!canClaim || isSubmitting || showAccountForm || diaCharged}
      >
        {canClaim && requiredDia > 0
          ? `환급받기 (💎 ${requiredDia.toLocaleString()})`
          : '환급받기'}      </button>

      {showAccountForm && canClaim && (
        <form className="ai-payback-account-form" onSubmit={handleSubmitRefund}>
          <h3 className="ai-payback-account-title">환급 계좌 입력</h3>

          <label className="ai-payback-field">
            <span>은행 선택</span>
            <select
              value={accountForm.bank}
              onChange={(e) => handleAccountChange('bank', e.target.value)}
              disabled={isSubmitting}
            >
              {PAYBACK_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>

          <label className="ai-payback-field">
            <span>계좌번호</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="계좌번호를 입력하세요"
              value={accountForm.accountNumber}
              onChange={(e) =>
                handleAccountChange('accountNumber', e.target.value)
              }
              disabled={isSubmitting}
            />
          </label>

          <label className="ai-payback-field">
            <span>예금주</span>
            <input
              type="text"
              placeholder="예금주명"
              value={accountForm.accountHolder}
              onChange={(e) =>
                handleAccountChange('accountHolder', e.target.value)
              }
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            className="ai-payback-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? '신청 중...' : '최종 환급 신청'}
          </button>
        </form>
      )}
    </div>
  )
}

export default AiPaybackPanel
