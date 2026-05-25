export const PAYBACK_DIA_MULTIPLIER = 1.3

/**
 * @param {number} amount 영수증 금액(원)
 * @returns {number} 필요 다이아
 */
export function calculateRequiredDia(amount) {
  const price = Number(amount) || 0
  if (price <= 0) return 0
  return Math.round(price * PAYBACK_DIA_MULTIPLIER)
}
