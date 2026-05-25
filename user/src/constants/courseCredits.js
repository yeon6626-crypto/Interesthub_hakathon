export const CREDITS_PER_COURSE = 3

export function calcCreditPoints(completedCount) {
  return completedCount * CREDITS_PER_COURSE
}
