/** 시연용: 이미 환급 처리된 주문번호 목록 */
export const MOCK_APPROVED_ORDERS = [
  'ORD-20240115-88231',
  'AUTH-77881234',
  'FC-9938471',
  'INF-5520198',
]

const STORAGE_PREFIX = 'interesthub-approved-receipt-orders'

function storageKey(userId) {
  return `${STORAGE_PREFIX}-${userId || 'guest'}`
}

export function loadApprovedOrderIds(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveApprovedOrderId(userId, orderId) {
  const normalized = String(orderId || '').trim()
  if (!normalized) return

  const current = loadApprovedOrderIds(userId)
  if (current.includes(normalized)) return

  localStorage.setItem(
    storageKey(userId),
    JSON.stringify([...current, normalized])
  )
}

export function isDuplicateOrderId(orderId, userId) {
  const normalized = String(orderId || '').trim().toUpperCase()
  if (!normalized) return true

  const allApproved = [
    ...MOCK_APPROVED_ORDERS.map((id) => id.toUpperCase()),
    ...loadApprovedOrderIds(userId).map((id) => id.toUpperCase()),
  ]

  return allApproved.includes(normalized)
}
