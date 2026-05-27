/** 결제 금액 대비 다이아 배율 (1.3%) */
export const PAYBACK_DIA_MULTIPLIER = 1.3

/** 원 → 다이아 환산 시 나누는 단위 (amount × 1.3 ÷ 100) */
export const PAYBACK_DIA_UNIT_DIVISOR = 100

/** 환급 신청 최소 결제 금액 (원) */
export const MIN_PAYBACK_AMOUNT_KRW = 20_000

/** 결제 금액 입력 단위 (원) */
export const PAYBACK_AMOUNT_STEP_KRW = 100

/**
 * @param {number} amount
 * @returns {number} 100원 단위로 반올림한 금액 (0 이하면 0)
 */
export function snapPaybackAmount(amount) {
  const price = Math.floor(Number(amount) || 0)
  if (price <= 0) return 0
  return Math.round(price / PAYBACK_AMOUNT_STEP_KRW) * PAYBACK_AMOUNT_STEP_KRW
}

/**
 * @param {number} amount
 * @returns {string|null} 에러 메시지 (유효하면 null)
 */
export function getPaybackAmountError(amount) {
  const price = Math.floor(Number(amount) || 0)
  if (price <= 0) return null
  if (price % PAYBACK_AMOUNT_STEP_KRW !== 0) {
    return `결제 금액은 ${PAYBACK_AMOUNT_STEP_KRW.toLocaleString()}원 단위로 입력해 주세요.`
  }
  if (price < MIN_PAYBACK_AMOUNT_KRW) {
    return `환급 신청은 최소 ${MIN_PAYBACK_AMOUNT_KRW.toLocaleString()}원부터 가능합니다.`
  }
  return null
}

/**
 * @param {number} amount 결제 금액 P (원)
 * @returns {number} 필요 다이아 round(P × 1.3 ÷ 100)
 * @example calculateRequiredDia(29000) // 377
 */
export function calculateRequiredDia(amount) {
  const price = Math.floor(Number(amount) || 0)
  if (price <= 0) return 0
  return Math.round(
    (price * PAYBACK_DIA_MULTIPLIER) / PAYBACK_DIA_UNIT_DIVISOR
  )
}
