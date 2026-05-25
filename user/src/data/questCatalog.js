/** 1~3시간 중 랜덤 */
export function randomStudyHours() {
  return Math.floor(Math.random() * 3) + 1
}

export function buildDefaultQuests() {
  const studyHours = randomStudyHours()

  return [
    {
      _id: 'daily_study',
      questCode: 'daily_study',
      questType: 'DAILY',
      typeLabel: 'Daily Quest',
      title: `${studyHours}시간 공부하기`,
      studyHours,
      targetClass: 'ALL',
      rewardExp: 500,
      rewardCoin: 10,
      rewardLabel: '500 EXP / 10 Coins',
    },
    {
      _id: 'daily_exercise',
      questCode: 'daily_exercise',
      questType: 'DAILY',
      typeLabel: 'Daily Quest',
      title: '1시간 운동하기',
      targetClass: 'ALL',
      rewardExp: 400,
      rewardCoin: 10,
      rewardLabel: '400 EXP / 10 Coins',
    },
    {
      _id: 'weekly_study',
      questCode: 'weekly_study',
      questType: 'WEEKLY',
      typeLabel: 'Weekly Quest',
      title: '주 5회 공부',
      requiredCount: 5,
      targetClass: 'ALL',
      rewardExp: 1500,
      rewardCoin: 30,
      rewardLabel: '1500 EXP / 30 Coins',
    },
    {
      _id: 'weekly_exercise',
      questCode: 'weekly_exercise',
      questType: 'WEEKLY',
      typeLabel: 'Weekly Quest',
      title: '주 3~4회 운동',
      requiredCount: 3,
      targetClass: 'ALL',
      rewardExp: 1200,
      rewardCoin: 25,
      rewardLabel: '1200 EXP / 25 Coins',
    },
  ]
}

export function isLocalQuestId(questId) {
  return (
    typeof questId === 'string' &&
    !/^[0-9a-f]{24}$/i.test(questId)
  )
}

export function isWeeklyQuest(quest) {
  return (
    quest?.questType === 'WEEKLY' ||
    String(quest?.questCode || quest?._id || '').startsWith('weekly_')
  )
}

export function isDailyStudyQuest(quest) {
  const code = quest?.questCode || quest?._id
  return code === 'daily_study'
}

export function isDailyExerciseQuest(quest) {
  const code = quest?.questCode || quest?._id
  return code === 'daily_exercise'
}

/** 저장된 퀘스트의 보상 수치를 최신 카탈로그와 동기화 */
export function syncQuestRewardsFromCatalog(quests) {
  const catalogByKey = new Map(
    buildDefaultQuests().flatMap((q) => [
      [q._id, q],
      [q.questCode, q],
    ])
  )

  return quests.map((quest) => {
    const template =
      catalogByKey.get(quest.questCode) || catalogByKey.get(quest._id)
    if (!template) return quest

    return {
      ...quest,
      rewardExp: template.rewardExp,
      rewardCoin: template.rewardCoin,
      rewardLabel: template.rewardLabel,
    }
  })
}
