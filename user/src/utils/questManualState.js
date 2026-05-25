const STORAGE_PREFIX = 'interesthub-quest-manual-state'

const DEFAULT_DAILY_COMPLETED = {
  daily_study: false,
  daily_exercise: false,
}

const DEFAULT_WEEKLY_COMPLETED = {
  weekly_study: false,
  weekly_exercise: false,
}

export const DEFAULT_QUEST_MANUAL_STATE = {
  studyCount: 0,
  exerciseCount: 0,
  dailyCompleted: { ...DEFAULT_DAILY_COMPLETED },
  weeklyCompleted: { ...DEFAULT_WEEKLY_COMPLETED },
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}-${userId || 'guest'}`
}

function normalizeDailyCompleted(value) {
  return {
    daily_study: Boolean(value?.daily_study),
    daily_exercise: Boolean(value?.daily_exercise),
  }
}

function normalizeWeeklyCompleted(value) {
  return {
    weekly_study: Boolean(value?.weekly_study),
    weekly_exercise: Boolean(value?.weekly_exercise),
  }
}

function normalizeState(parsed) {
  return {
    studyCount: Number(parsed?.studyCount) || 0,
    exerciseCount: Number(parsed?.exerciseCount) || 0,
    dailyCompleted: normalizeDailyCompleted(parsed?.dailyCompleted),
    weeklyCompleted: normalizeWeeklyCompleted(parsed?.weeklyCompleted),
  }
}

export function loadQuestManualState(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { ...DEFAULT_QUEST_MANUAL_STATE }
    return normalizeState(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_QUEST_MANUAL_STATE }
  }
}

function saveQuestManualState(userId, state) {
  localStorage.setItem(storageKey(userId), JSON.stringify(state))
}

/** 디버그 버튼 전용 — 일일 퀘스트만 초기화, 주간 진행도는 유지 */
export function resetDailyQuestManualState(userId) {
  const current = loadQuestManualState(userId)
  const next = {
    ...current,
    dailyCompleted: { ...DEFAULT_DAILY_COMPLETED },
  }
  saveQuestManualState(userId, next)
  return next
}

/** 디버그 버튼 전용 — 날짜 자동 비교 없음 (전체 초기화) */
export function resetQuestManualState(userId) {
  const next = {
    studyCount: 0,
    exerciseCount: 0,
    dailyCompleted: { ...DEFAULT_DAILY_COMPLETED },
    weeklyCompleted: { ...DEFAULT_WEEKLY_COMPLETED },
  }
  saveQuestManualState(userId, next)
  return next
}

export function incrementStudyCount(userId) {
  const current = loadQuestManualState(userId)
  const next = {
    ...current,
    studyCount: current.studyCount + 1,
  }
  saveQuestManualState(userId, next)
  return next
}

export function incrementExerciseCount(userId) {
  const current = loadQuestManualState(userId)
  const next = {
    ...current,
    exerciseCount: current.exerciseCount + 1,
  }
  saveQuestManualState(userId, next)
  return next
}

export function markDailyQuestCompleted(userId, questCode) {
  const current = loadQuestManualState(userId)
  if (!Object.prototype.hasOwnProperty.call(current.dailyCompleted, questCode)) {
    return current
  }
  const next = {
    ...current,
    dailyCompleted: {
      ...current.dailyCompleted,
      [questCode]: true,
    },
  }
  saveQuestManualState(userId, next)
  return next
}

export function markWeeklyQuestCompleted(userId, questCode) {
  const current = loadQuestManualState(userId)
  if (!Object.prototype.hasOwnProperty.call(current.weeklyCompleted, questCode)) {
    return current
  }
  const next = {
    ...current,
    weeklyCompleted: {
      ...current.weeklyCompleted,
      [questCode]: true,
    },
  }
  saveQuestManualState(userId, next)
  return next
}

export function isDailyQuestDoneToday(quest, state) {
  const code = quest.questCode || quest._id
  return Boolean(state.dailyCompleted[code])
}

export function isWeeklyQuestClaimed(quest, state) {
  const code = quest.questCode || quest._id
  return Boolean(state.weeklyCompleted[code])
}

/**
 * @param {object} quest
 * @param {ReturnType<typeof loadQuestManualState>} state
 */
export function getWeeklyQuestProgressInfo(quest, state) {
  const code = quest.questCode || quest._id

  if (code === 'weekly_study') {
    const target = quest.requiredCount ?? 5
    return {
      current: state.studyCount,
      target,
      metricLabel: '공부',
    }
  }

  if (code === 'weekly_exercise') {
    const target = quest.requiredCount ?? 3
    return {
      current: state.exerciseCount,
      target,
      metricLabel: '운동',
    }
  }

  return { current: 0, target: 1, metricLabel: '' }
}

export function isWeeklyQuestReadyToClaim(quest, state) {
  if (isWeeklyQuestClaimed(quest, state)) return false
  const { current, target } = getWeeklyQuestProgressInfo(quest, state)
  return current >= target
}
