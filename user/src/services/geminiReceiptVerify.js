import { geminiGenerateContent, hashGeminiKey } from './geminiClient'
import { fileToBase64 } from './geminiQuestVerify'

const RECEIPT_VERIFY_PROMPT = `너는 영수증 검증 및 부정 수급 방지 자동화 시스템이야. 제출된 이미지가 '오픈AI(ChatGPT), 앤트로픽(Claude), 구글(Gemini)' 또는 '인프런, 패스트캠퍼스' 중 하나의 결제 완료 영수증이나 이용 내역 화면이 확실히 맞는지 검증해 줘.
특히 중복 방지를 위해 영수증 내부에 적힌 '주문번호(또는 승인번호)'와 결제에 사용된 '카드 정보(카드사 명 또는 카드번호 일부)'를 반드시 찾아내야 해.
조건(조건)에 맞는 영수증이 확실하다면 다른 부연 설명은 절대 하지 말고, 오직 아래 JSON 형식으로만 딱 한 줄 응답해 줘:
{ "result": "success", "provider": "확인된서비스명", "amount": 22000, "orderId": "추출된주문번호또는승인번호", "cardInfo": "추출된카드사또는카드정보" }
만약 영수증이 아니거나, 주문번호/카드정보 식별이 불가능하거나, 조건에 맞지 않는 다른 이미지라면 { "result": "fail" }을 반환해 줘.`

/**
 * @param {string} text
 * @returns {{
 *   result: 'success'|'fail',
 *   provider?: string,
 *   amount?: number,
 *   orderId?: string,
 *   cardInfo?: string,
 * }}
 */
function parseReceiptVerifyResult(text) {
  const raw = (text || '').trim()

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { result: 'fail' }

    const normalized = jsonMatch[0].replace(/'/g, '"')
    const parsed = JSON.parse(normalized)
    const result = String(parsed.result || '').toLowerCase()

    if (result !== 'success') {
      return { result: 'fail' }
    }

    const orderId = String(parsed.orderId || '').trim()
    const cardInfo = String(parsed.cardInfo || '').trim()

    if (!orderId || !cardInfo) {
      return { result: 'fail' }
    }

    return {
      result: 'success',
      provider: String(parsed.provider || '').trim(),
      amount: Number(parsed.amount) || 0,
      orderId,
      cardInfo,
    }
  } catch {
    return { result: 'fail' }
  }
}

/**
 * @param {File} file
 * @param {string} categoryLabel
 */
export async function verifyReceiptImage(file, categoryLabel) {
  const base64Data = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'
  const imageFingerprint = base64Data.slice(0, 12_000)

  const requestKey = `receipt:${hashGeminiKey([
    categoryLabel,
    mimeType,
    imageFingerprint,
  ])}`

  const prompt = `${RECEIPT_VERIFY_PROMPT}\n\n유저가 선택한 환급 카테고리: ${categoryLabel}`

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

  return parseReceiptVerifyResult(text)
}
