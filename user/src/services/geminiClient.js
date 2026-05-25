import { GEMINI_MODEL, GEMINI_API_VERSION } from './geminiConfig'

/** 연속 호출 최소 간격 (무료 티어 RPM 완화) */
const MIN_GAP_MS = 6000
/** 429 수신 후 추가 대기 */
const COOLDOWN_AFTER_429_MS = 90_000
const COOLDOWN_KEY = 'interesthub-gemini-cooldown'
const RESPONSE_CACHE_PREFIX = 'interesthub-gemini-res'
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** 컴포넌트 재마운트(Strict Mode)에도 유지되는 진행 중 요청 */
const inFlight = new Map()
let lastCallAt = 0

export function getGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || ''
}

export function hashGeminiKey(parts) {
  const s = parts.filter((p) => p != null && p !== '').join('|')
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

function getCooldownUntil() {
  return Number(sessionStorage.getItem(COOLDOWN_KEY) || 0)
}

export function getGeminiCooldownRemainingMs() {
  return Math.max(0, getCooldownUntil() - Date.now())
}

export function isGeminiInCooldown() {
  return getGeminiCooldownRemainingMs() > 0
}

function applyCooldown(ms = COOLDOWN_AFTER_429_MS) {
  const until = Date.now() + ms
  if (until > getCooldownUntil()) {
    sessionStorage.setItem(COOLDOWN_KEY, String(until))
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function throttleBeforeRequest() {
  const cooldownRemaining = getGeminiCooldownRemainingMs()
  if (cooldownRemaining > 0) {
    const sec = Math.ceil(cooldownRemaining / 1000)
    throw new Error(
      `Gemini API 사용 한도에 도달했습니다. 약 ${sec}초 후에 다시 시도해 주세요.`
    )
  }

  const gapWait = Math.max(0, lastCallAt + MIN_GAP_MS - Date.now())
  if (gapWait > 0) {
    await sleep(gapWait)
  }
  lastCallAt = Date.now()
}

function loadResponseCache(requestKey) {
  try {
    const raw = localStorage.getItem(`${RESPONSE_CACHE_PREFIX}-${requestKey}`)
    if (!raw) return null
    const { at, text } = JSON.parse(raw)
    if (Date.now() - at > CACHE_MAX_AGE_MS) return null
    return typeof text === 'string' ? text : null
  } catch {
    return null
  }
}

function saveResponseCache(requestKey, text) {
  try {
    localStorage.setItem(
      `${RESPONSE_CACHE_PREFIX}-${requestKey}`,
      JSON.stringify({ at: Date.now(), text })
    )
  } catch {
    /* storage full */
  }
}

/**
 * @param {{
 *   requestKey: string,
 *   contents: Array<Record<string, unknown>>,
 *   forceRefresh?: boolean,
 *   useResponseCache?: boolean,
 * }} options
 * @returns {Promise<string>}
 */
export async function geminiGenerateContent({
  requestKey,
  contents,
  forceRefresh = false,
  useResponseCache = false,
}) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error(
      'Gemini API 키가 없습니다. user/.env에 VITE_GEMINI_API_KEY를 설정하세요.'
    )
  }

  if (!forceRefresh && useResponseCache) {
    const cachedText = loadResponseCache(requestKey)
    if (cachedText != null) return cachedText
  }

  if (!forceRefresh) {
    const pending = inFlight.get(requestKey)
    if (pending) return pending
  }

  const promise = (async () => {
    if (!forceRefresh && useResponseCache) {
      const cachedText = loadResponseCache(requestKey)
      if (cachedText != null) return cachedText
    }

    await throttleBeforeRequest()

    const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const msg =
        data?.error?.message || `Gemini API 오류 (${response.status})`
      if (
        response.status === 429 ||
        /quota|rate limit|too many/i.test(msg)
      ) {
        applyCooldown()
      }
      throw new Error(msg)
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .join('') || ''

    if (useResponseCache && text) {
      saveResponseCache(requestKey, text)
    }

    return text
  })().finally(() => {
    if (inFlight.get(requestKey) === promise) {
      inFlight.delete(requestKey)
    }
  })

  if (!forceRefresh) {
    inFlight.set(requestKey, promise)
  }

  return promise
}
