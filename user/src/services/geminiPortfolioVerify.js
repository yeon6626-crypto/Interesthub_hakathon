import { geminiGenerateContent, hashGeminiKey } from './geminiClient'
import { fileToBase64 } from './geminiQuestVerify'

const PORTFOLIO_VERIFY_PROMPT = `너는 이력서 스펙 검증 시스템이야. 유저가 제출한 설명 텍스트와 첨부 이미지를 교차 검증해야 해.
- 만약 유저가 '프로젝트 경험'으로 제출했다면, 첨부된 사진이 실제 소스 코드 파일 스크린샷, 깃허브 커밋 내역, 실행 화면, 아키텍처 다이어그램 등 프로젝트 관련 파일 사진이 맞는지 철저히 판단해 줘.
- 만약 '자격증'으로 제출했다면, 첨부된 사진이 실제 국가기술자격증, 어학 성적표, 수료증 등 공식 자격 증명 사진이 맞는지 판단해 줘.
유저가 작성한 설명 내용과 이미지의 일치 여부를 판단해서, 정상적인 인증 건이 맞다면 부연 설명 없이 오직 아래 JSON 한 줄로만 응답해 줘:
{ 'result': 'success', 'verifiedItem': '유저가 작성한 핵심 내용을 요약한 10~15자 내외의 깔끔한 문구' }
만약 허위 인증이거나, 프로젝트/자격증과 무관한 사진이거나, 식별이 불가능하다면 { 'result': 'fail', 'message': '실패 사유 한글 문구' }를 반환해 줘.`

const SUBMISSION_LABELS = {
  project: '프로젝트 경험',
  certification: '자격증',
}

/**
 * @param {string} text
 * @returns {{ result: 'success'|'fail', verifiedItem?: string, message?: string }}
 */
function parsePortfolioVerifyResult(text) {
  const raw = (text || '').trim()

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { result: 'fail', message: 'AI 응답을 해석할 수 없습니다.' }
    }

    const normalized = jsonMatch[0].replace(/'/g, '"')
    const parsed = JSON.parse(normalized)
    const result = String(parsed.result || '').toLowerCase()

    if (result === 'success') {
      const verifiedItem = String(parsed.verifiedItem || '').trim()
      if (!verifiedItem) {
        return {
          result: 'fail',
          message: '인증 항목을 추출하지 못했습니다. 다시 시도해 주세요.',
        }
      }
      return { result: 'success', verifiedItem }
    }

    return {
      result: 'fail',
      message:
        String(parsed.message || '').trim() ||
        '스펙 인증에 실패했습니다. 설명과 증빙 이미지를 확인해 주세요.',
    }
  } catch {
    return {
      result: 'fail',
      message: 'AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.',
    }
  }
}

/**
 * @param {{
 *   submissionType: 'project' | 'certification',
 *   description: string,
 *   file: File,
 * }} params
 * @returns {Promise<{ result: 'success'|'fail', verifiedItem?: string, message?: string }>}
 */
export async function verifyPortfolioSpec({ submissionType, description, file }) {
  const trimmedDescription = String(description || '').trim()
  if (!trimmedDescription) {
    return { result: 'fail', message: '설명 텍스트를 입력해 주세요.' }
  }

  if (!file) {
    return { result: 'fail', message: '증빙 이미지를 첨부해 주세요.' }
  }

  if (!file.type.startsWith('image/')) {
    return { result: 'fail', message: '증빙 파일은 이미지만 업로드할 수 있습니다.' }
  }

  const base64Data = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'
  const typeLabel = SUBMISSION_LABELS[submissionType] || '스펙'
  const imageFingerprint = base64Data.slice(0, 12_000)

  const requestKey = `portfolio:${hashGeminiKey([
    submissionType,
    trimmedDescription,
    mimeType,
    imageFingerprint,
  ])}`

  const prompt = `${PORTFOLIO_VERIFY_PROMPT}

유저 제출 유형: ${typeLabel}
유저 설명:
${trimmedDescription}`

  const text = await geminiGenerateContent({
    requestKey,
    useResponseCache: true,
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ],
  })

  return parsePortfolioVerifyResult(text)
}
