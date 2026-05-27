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

function resolveQuestCategory(questCode, questTitle) {
  const code = String(questCode || '').toLowerCase()
  const title = String(questTitle || '')

  if (
    code.includes('exercise') ||
    code.includes('workout') ||
    /운동|헬스|피트니스|러닝|조깅/.test(title)
  ) {
    return 'exercise'
  }

  if (
    code.includes('study') ||
    /공부|학습|독서|강의|과제|시험|도서|책/.test(title)
  ) {
    return 'study'
  }

  return 'unknown'
}

function buildVerificationPrompt(questTitle, questCode) {
  const category = resolveQuestCategory(questCode, questTitle)

  const studyRules = `【공부 퀘스트 인증 기준 — 엄격 적용】
SUCCESS는 아래 중 하나 이상이 사진에서 명확히 보일 때만 허용:
1) 책·교재·노트·필기가 보이는 사진 (책 표지, 펼친 책, 책상 위 교재 등)
2) 공부하는 사람이 보이는 사진 (책/노트/노트북을 보며 학습하는 모습, 도서관·카페·책상에서 공부하는 장면)

아래는 무조건 FAIL:
- 음식, 반려동물, 풍경, 셀카·인물만 있는 사진, 게임·SNS·쇼핑 화면
- 운동·헬스장·기구 사진
- 공부와 무관한 일상 사진`

  const exerciseRules = `【운동 퀘스트 인증 기준 — 엄격 적용】
SUCCESS는 아래 중 하나 이상이 사진에서 명확히 보일 때만 허용:
1) 헬스장·피트니스 센터·운동 시설 내부 사진
2) 운동 기구(머신, 덤벨, 러닝머신, 바벨, 요가매트 등)가 보이는 사진
3) 운동하는 사람의 전신 또는 상반신이 보이는 사진 (운동 복장·기구 사용·스트레칭·달리기 등 운동 맥락이 분명할 것)

아래는 무조건 FAIL:
- 책·공부·강의·노트북으로 학습하는 장면
- 음식, 풍경, 일반 실내·거리 사진만 있는 경우
- 운동과 무관한 일상·셀카`

  const categoryRules =
    category === 'study'
      ? studyRules
      : category === 'exercise'
        ? exerciseRules
        : `${studyRules}\n\n${exerciseRules}\n\n미션 제목을 보고 공부/운동 중 해당하는 기준만 적용하세요.`

  return `너는 RPG 게임 세계관의 "AI 길드장"이야.
유저가 제출한 사진이 미션 [${questTitle}]의 증거로 적합한지 판정한다.
관대하게 통과시키지 말고, 아래 기준을 엄격히 적용한다. 애매하면 FAIL.

${categoryRules}

판정:
- 기준에 명확히 부합 → "SUCCESS"
- 부합하지 않거나 불명확 → "FAIL"

반드시 다른 설명 없이 아래 JSON 형식으로만 응답:
{
  "status": "SUCCESS" 또는 "FAIL",
  "reason": "성공 시 짧은 칭찬(한국어) / 실패 시 왜 반려했는지와 어떤 사진을 올려야 하는지 안내(한국어, 위트 있게)"
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
    /* JSON 파싱 실패 */
  }

  return {
    status: 'FAIL',
    reason:
      '이보게, 인증 결과를 확인할 수 없네. 공부 퀘스트는 책·공부 장면, 운동 퀘스트는 헬스장·기구·운동 전신 사진을 다시 올려보시게.',
  }
}

/**
 * @param {string} questTitle
 * @param {string} base64Data 순수 base64 (헤더 없음)
 * @param {string} mimeType 예: image/jpeg
 * @param {string} [questCode] 예: daily_study, daily_exercise
 * @returns {Promise<{ status: 'SUCCESS'|'FAIL', reason: string }>}
 */
export async function verifyQuestImage(
  questTitle,
  base64Data,
  mimeType,
  questCode = ''
) {
  const imageFingerprint = base64Data.slice(0, 12_000)
  const requestKey = `quest-v2:${hashGeminiKey([
    questCode,
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
          { text: buildVerificationPrompt(questTitle, questCode) },
        ],
      },
    ],
  })

  return parseVerificationResult(text)
}
