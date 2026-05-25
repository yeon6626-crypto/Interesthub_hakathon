const REFUNDS_KEY = 'interesthub-pending-diamond-refunds'

function loadRefundMap() {
  try {
    const raw = localStorage.getItem(REFUNDS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveRefundMap(map) {
  localStorage.setItem(REFUNDS_KEY, JSON.stringify(map))
}

/**
 * 다른 유저에게 환급할 다이아를 대기열에 적재 (동일 브라우저·다른 계정 로그인 시 수령)
 * @param {string} userId
 * @param {number} amount
 */
export function queueDiamondRefund(userId, amount) {
  if (!userId || amount <= 0) return

  const map = loadRefundMap()
  const key = String(userId)
  map[key] = (Number(map[key]) || 0) + amount
  saveRefundMap(map)
}

/**
 * 로그인 유저의 대기 환급액을 꺼내 반환
 * @param {string} userId
 * @returns {number}
 */
export function consumePendingDiamondRefunds(userId) {
  if (!userId) return 0

  const map = loadRefundMap()
  const key = String(userId)
  const amount = Number(map[key]) || 0

  if (amount > 0) {
    delete map[key]
    saveRefundMap(map)
  }

  return amount
}
