const STORAGE_PREFIX = 'interesthub-accepted-quests'

function storageKey(userId) {
  return `${STORAGE_PREFIX}-${userId || 'guest'}`
}

function isWeeklyQuestEntry(quest) {
  return (
    quest?.questType === 'WEEKLY' ||
    String(quest?.questCode || quest?._id || '').startsWith('weekly_')
  )
}

export function loadAcceptedQuests(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveAcceptedQuests(userId, quests) {
  localStorage.setItem(storageKey(userId), JSON.stringify(quests))
}

export function acceptQuest(userId, quest) {
  const current = loadAcceptedQuests(userId)
  if (current.some((q) => q._id === quest._id)) {
    return current
  }
  const next = [...current, quest]
  saveAcceptedQuests(userId, next)
  return next
}

export function removeAcceptedQuest(userId, questId) {
  const next = loadAcceptedQuests(userId).filter((q) => q._id !== questId)
  saveAcceptedQuests(userId, next)
  return next
}

export function clearAcceptedQuests(userId) {
  saveAcceptedQuests(userId, [])
  return []
}

/** 일일 퀘스트만 제거하고 주간 퀘스트는 유지 */
export function clearDailyAcceptedQuests(userId) {
  const weeklyOnly = loadAcceptedQuests(userId).filter(isWeeklyQuestEntry)
  saveAcceptedQuests(userId, weeklyOnly)
  return weeklyOnly
}
