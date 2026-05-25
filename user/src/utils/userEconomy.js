/** 다이아 — DB 필드명은 gold */
export const INITIAL_DIAMONDS = 100
export const INITIAL_COINS = 250
export const INITIAL_REPUTATION = 0
export const INITIAL_LEVEL = 1
export const INITIAL_EXP = 0

/** 레벨과 무관한 고정 경험치 상한 */
export const EXP_CAP = 4000

export const LEVEL_MILESTONE_COIN_REWARD = 500
export const COLLECTION_COMPLETE_COIN_REWARD = 1500

/**
 * @param {object | null | undefined} user
 */
export function hydrateUserEconomy(user) {
  if (!user) return user

  return {
    ...user,
    level: user.level ?? INITIAL_LEVEL,
    exp: user.exp ?? INITIAL_EXP,
    expToNext: EXP_CAP,
    gold: user.gold != null ? user.gold : INITIAL_DIAMONDS,
    coin: user.coin != null ? user.coin : INITIAL_COINS,
    reputation: user.reputation != null ? user.reputation : INITIAL_REPUTATION,
  }
}

/**
 * 로그인·대시보드 로드 시 서버(DB) 값을 그대로 사용합니다.
 * @param {object} apiUser
 */
export function mergeUserFromApi(apiUser) {
  return hydrateUserEconomy(apiUser)
}

/**
 * @param {object | null | undefined} prev
 * @param {object} next
 */
export function mergeUserState(prev, next) {
  if (!next) return prev ?? null
  if (!prev) return hydrateUserEconomy(next)

  return hydrateUserEconomy({
    ...prev,
    ...next,
    gold: next.gold !== undefined ? next.gold : prev.gold,
    coin: next.coin !== undefined ? next.coin : prev.coin,
    reputation:
      next.reputation !== undefined ? next.reputation : prev.reputation,
    level: next.level !== undefined ? next.level : prev.level,
    exp: next.exp !== undefined ? next.exp : prev.exp,
    expToNext: EXP_CAP,
  })
}

/**
 * @param {object} user
 * @param {number} expGain
 * @returns {{ user: object, milestones: number[] }}
 */
export function applyExpWithLevelMilestones(user, expGain) {
  let level = user.level || 1
  let exp = (user.exp || 0) + (Number(expGain) || 0)
  const expToNext = EXP_CAP
  let coin = user.coin ?? 0
  const milestones = []

  while (exp >= expToNext) {
    exp -= expToNext
    level += 1

    if (level % 5 === 0) {
      coin += LEVEL_MILESTONE_COIN_REWARD
      milestones.push(level)
    }
  }

  return {
    user: {
      ...user,
      level,
      exp,
      expToNext,
      coin,
      gold: user.gold ?? INITIAL_DIAMONDS,
      reputation: user.reputation ?? INITIAL_REPUTATION,
    },
    milestones,
  }
}
