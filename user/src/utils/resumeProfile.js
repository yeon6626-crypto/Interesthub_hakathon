import { loadVerifiedSpecs } from '@/utils/verifiedSpecs'

/**
 * @param {object | null | undefined} user
 * @returns {import('@/utils/guildParties').ResumeProfile}
 */
export function buildResumeProfile(user) {
  const specialNotes = loadVerifiedSpecs(user?._id)

  return {
    major: user?.major || '정보 없음',
    grade: user?.grade || '정보 없음',
    targetClass: user?.targetClass || '정해지지 않음',
    level: user?.level ?? 1,
    reputation: user?.reputation ?? 0,
    specialNotes: specialNotes.length > 0 ? specialNotes : ['없음'],
  }
}

/**
 * @param {import('@/utils/guildParties').ResumeProfile} resume
 */
export function formatSpecialNotes(resume) {
  const notes = resume?.specialNotes
  if (!Array.isArray(notes) || notes.length === 0 || notes[0] === '없음') {
    return '없음'
  }
  return notes.join(', ')
}

/**
 * @param {import('@/utils/guildParties').ResumeProfile} resume
 */
export function formatResumeLines(resume) {
  return [
    `학과: ${resume.major}`,
    `학년: ${resume.grade}`,
    `목표 직무: ${resume.targetClass}`,
    `레벨: ${resume.level} · 명성: ${resume.reputation}`,
    `특이사항: ${formatSpecialNotes(resume)}`,
  ]
}

/**
 * @param {import('@/utils/guildParties').ResumeProfile} resume
 */
export function formatResumeBlock(resume) {
  return formatResumeLines(resume).join('\n')
}

/**
 * 포트폴리오 제련소 미리보기용 샘플 (디버그 신청자 본뜨기)
 */
export function buildSampleResumeProfile() {
  return {
    major: 'School of Electronics Engineering',
    grade: '2학년 2학기',
    targetClass: 'Frontend Developer',
    level: 5,
    reputation: 12,
    specialNotes: ['React 웹 프로젝트 완성', '정보처리기사 자격증'],
  }
}
