export const COINS_PER_DIAMOND = 10
export const MIN_EXCHANGE_COINS = 100

export const EXCHANGE_ALERT_MESSAGE =
  '코인은 최소 100코인 단위로만 환전할 수 있습니다!'

export const DIAMOND_EXCHANGE_ALERT_MESSAGE =
  '다이아는 최소 10다이아 단위로만 환전할 수 있습니다!'

export const MIN_EXCHANGE_DIAMONDS = 10

/**
 * @param {number} inputCoins 유저가 입력한 환전 코인 수
 * @param {number} userCoinBalance 보유 코인
 * @returns {{ ok: true, exchangedCoins: number, diamondsGained: number } | { ok: false }}
 */
export function calculateCoinExchange(inputCoins, userCoinBalance) {
  const amount = Number(inputCoins)

  if (
    !Number.isFinite(amount) ||
    amount < MIN_EXCHANGE_COINS ||
    amount > userCoinBalance
  ) {
    return { ok: false }
  }

  const exchangedCoins =
    Math.floor(amount / MIN_EXCHANGE_COINS) * MIN_EXCHANGE_COINS

  if (exchangedCoins < MIN_EXCHANGE_COINS) {
    return { ok: false }
  }

  return {
    ok: true,
    exchangedCoins,
    diamondsGained: exchangedCoins / COINS_PER_DIAMOND,
  }
}

/**
 * @param {number} inputDiamonds 유저가 입력한 환전 다이아 수
 * @param {number} userDiamondBalance 보유 다이아
 * @returns {{ ok: true, exchangedDiamonds: number, coinsGained: number } | { ok: false }}
 */
export function calculateDiamondExchange(inputDiamonds, userDiamondBalance) {
  const amount = Number(inputDiamonds)

  if (
    !Number.isFinite(amount) ||
    amount < MIN_EXCHANGE_DIAMONDS ||
    amount > userDiamondBalance
  ) {
    return { ok: false }
  }

  const exchangedDiamonds =
    Math.floor(amount / MIN_EXCHANGE_DIAMONDS) * MIN_EXCHANGE_DIAMONDS

  if (exchangedDiamonds < MIN_EXCHANGE_DIAMONDS) {
    return { ok: false }
  }

  return {
    ok: true,
    exchangedDiamonds,
    coinsGained: exchangedDiamonds * COINS_PER_DIAMOND,
  }
}
