import { applyExpWithLevelMilestones } from '@/utils/userEconomy'

const QUEST_REPUTATION_GAIN = 1

/**
 * 퀘스트 완료 보상: EXP + 코인 + 명성치(+1). 다이아는 지급하지 않음.
 * @param {object} user
 * @param {object} quest
 * @returns {{ user: object, milestones: number[] }}
 */
export function applyQuestRewardsToUser(user, quest) {
  const rewardExp = Number(quest.rewardExp) || 0
  const rewardCoin = Number(quest.rewardCoin) || 0

  const { user: withExp, milestones } = applyExpWithLevelMilestones(
    user,
    rewardExp
  )

  return {
    user: {
      ...withExp,
      coin: (withExp.coin || 0) + rewardCoin,
      reputation: (withExp.reputation || 0) + QUEST_REPUTATION_GAIN,
    },
    milestones,
  }
}
