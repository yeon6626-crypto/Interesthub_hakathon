import { geminiGenerateContent, hashGeminiKey } from './geminiClient'

/**
 * File → base64 순수 문자열 (data URL 헤더 제거)
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('파일을 읽을 수 없습니다.'))
        return
      }

      const commaIndex = result.indexOf(',')
      if (commaIndex === -1) {
        reject(new Error('이미지 인코딩 형식이 올바르지 않습니다.'))
        return
      }

      resolve(result.slice(commaIndex + 1))
    }

    reader.onerror = () => {
      reject(new Error('인증 사진을 읽는 중 오류가 발생했습니다.'))
    }

    reader.readAsDataURL(file)
  })
}

function buildVerificationPrompt(questTitle) {
  return `너는 RPG 게임 세계관의 "AI 길드장"이야. 제출된 사진이 [${questTitle}] 미션과 관련이 있어 보이면 SUCCESS, 전혀 무관하면 FAIL로 판정해.
관대하게 판정해: 학습·운동·실습·과제·강의 화면 등 미션 수행으로 볼 수 있으면 SUCCESS.

반드시 다른 설명 없이 아래의 JSON 형식으로만 응답해줘.
{
  "status": "SUCCESS" 또는 "FAIL",
  "reason": "성공 시 '훌륭하군, 모험가여! 전자공학의 기초를 다졌으니 다음 스킬로 나아가게.' 같은 칭찬 / 실패 시 '이보게, 치킨 사진으로는 이 퀘스트를 깰 수 없네! 다시 증거를 가져오시게.' 같은 위트 있는 반려 사유"
}`
}

/**
 * @param {string} text
 * @returns {{ status: 'SUCCESS'|'FAIL', reason: string }}
 */
function parseVerificationResult(text) {
  const raw = (text || '').trim()

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const statusRaw = String(parsed.status || parsed.verdict || '')
        .trim()
        .toUpperCase()
      const status = statusRaw === 'SUCCESS' ? 'SUCCESS' : 'FAIL'
      const reason =
        String(parsed.reason || '').trim() ||
        (status === 'SUCCESS'
          ? '훌륭하군, 모험가여! 미션을 완수했으니 보상을 받게.'
          : '이보게, 이 증거로는 퀘스트를 깰 수 없네! 다시 가져오시게.')

      return { status, reason }
    }
  } catch {
    /* JSON 파싱 실패 시 아래 폴백 */
  }

  const normalized = raw.toUpperCase()
  if (normalized.includes('SUCCESS')) {
    return {
      status: 'SUCCESS',
      reason: '훌륭하군, 모험가여! 미션 인증에 성공했네.',
    }
  }

  return {
    status: 'FAIL',
    reason:
      raw.slice(0, 200) ||
      '이보게, 미션과 무관한 증거인 것 같군. 다른 사진을 가져오시게.',
  }
}

/**
 * @param {string} questTitle
 * @param {string} base64Data 순수 base64 (헤더 없음)
 * @param {string} mimeType 예: image/jpeg
 * @returns {Promise<{ status: 'SUCCESS'|'FAIL', reason: string }>}
 */
export async function verifyQuestImage(questTitle, base64Data, mimeType) {
  const imageFingerprint = base64Data.slice(0, 12_000)
  const requestKey = `quest:${hashGeminiKey([
    questTitle,
    mimeType,
    imageFingerprint,
  ])}`

  const text = await geminiGenerateContent({
    requestKey,
    useResponseCache: true,
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: buildVerificationPrompt(questTitle) },
        ],
      },
    ],
  })

  return parseVerificationResult(text)
}
