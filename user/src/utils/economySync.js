import { api } from '@/api/client'
import { getStoredToken } from '@/utils/auth'

let syncTimer = null
let pendingPayload = null
let inflight = null

function pickEconomyPayload(user) {
  return {
    level: user.level ?? 1,
    exp: user.exp ?? 0,
    gold: user.gold ?? 0,
    coin: user.coin ?? 0,
    reputation: user.reputation ?? 0,
  }
}

async function runSync() {
  if (!pendingPayload || !getStoredToken()) return

  const payload = pendingPayload
  pendingPayload = null

  if (inflight) {
    await inflight.catch(() => {})
  }

  inflight = api
    .syncEconomy(payload)
    .catch((err) => {
      console.warn('[economySync]', err.message)
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** 재화·레벨 변경 시 서버 DB에 저장 (디바운스) */
export function scheduleEconomySync(user) {
  if (!user?._id || !getStoredToken()) return

  pendingPayload = pickEconomyPayload(user)
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    runSync()
  }, 400)
}

/** 로그아웃 직전 등 — 대기 중인 동기화를 즉시 반영 */
export async function flushEconomySync() {
  clearTimeout(syncTimer)
  if (!pendingPayload && !inflight) return
  await runSync()
  if (inflight) await inflight
}
