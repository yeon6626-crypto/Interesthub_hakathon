import { geminiGenerateContent, hashGeminiKey } from './geminiClient'

function buildUserPrompt(major, targetClass) {
  const majorText = major || '미정'
  const targetText = targetClass || '미정'

  return `너는 대학 교과과정 추천 가이드야. 반드시 다른 설명 없이 오직 아래 양식의 순수한 JSON 객체 문자열로만 응답해야 해. 마크다운, 코드 블록, 추가 설명 금지.

필수 JSON 형식 (각 학년 4개 과목):
{
  "grade1": [{"id": "g1_1", "name": "과목명", "icon": "emoji"}, ...],
  "grade2": [{"id": "g2_1", "name": "과목명", "icon": "emoji"}, ...],
  "grade3": [{"id": "g3_1", "name": "과목명", "icon": "emoji"}, ...],
  "grade4": [{"id": "g4_1", "name": "과목명", "icon": "emoji"}, ...]
}

규칙:
- id는 전체 학년에서 고유해야 함 (예: g1_1, g2_3)
- name: 학과·진로에 맞는 한국어 과목명
- icon: 과목과 관련된 이모지 1개
- 1학년부터 4학년까지 진로에 맞게 단계적으로 구성

유저 학과: ${majorText}
유저 관심 직무: ${targetText}

위 학과와 진로에 맞는 1~4학년 전공 추천 교과목을 각 학년 4개씩 JSON으로만 출력하세요.`
}

const ROADMAP_CACHE_PREFIX = 'interesthub-gemini-roadmap'

function roadmapCacheKey(major, targetClass) {
  return `${major || '미정'}|${targetClass || '미정'}`
}

function loadRoadmapFromCache(major, targetClass) {
  try {
    const raw = localStorage.getItem(
      `${ROADMAP_CACHE_PREFIX}-${roadmapCacheKey(major, targetClass)}`
    )
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const grades = ['grade1', 'grade2', 'grade3', 'grade4']
    if (grades.every((g) => Array.isArray(parsed?.[g]))) {
      return parsed
    }
  } catch {
    /* ignore corrupt cache */
  }
  return null
}

function saveRoadmapToCache(major, targetClass, data) {
  try {
    localStorage.setItem(
      `${ROADMAP_CACHE_PREFIX}-${roadmapCacheKey(major, targetClass)}`,
      JSON.stringify(data)
    )
  } catch {
    /* quota exceeded etc. */
  }
}

export function parseRoadmapResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('응답이 비어 있습니다.')
  }

  let cleaned = text.trim()
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }

  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('JSON 형식을 찾을 수 없습니다.')
  }

  cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(cleaned)

  const grades = ['grade1', 'grade2', 'grade3', 'grade4']
  const result = {}

  for (const grade of grades) {
    const list = parsed[grade]
    if (!Array.isArray(list)) {
      throw new Error(`${grade} 데이터가 없습니다.`)
    }

    result[grade] = list.map((item, index) => ({
      id: String(item.id || `${grade}_${index + 1}`),
      name: String(item.name || '과목명'),
      icon: String(item.icon || '📘'),
    }))
  }

  return result
}

export function getCachedGeminiRoadmap(major, targetClass) {
  return loadRoadmapFromCache(major, targetClass)
}

export async function fetchGeminiRoadmap(major, targetClass, options = {}) {
  const { forceRefresh = false } = options
  const profileKey = roadmapCacheKey(major, targetClass)

  if (!forceRefresh) {
    const cached = loadRoadmapFromCache(major, targetClass)
    if (cached) return cached
  }

  const requestKey = `roadmap:${hashGeminiKey([profileKey])}`

  const text = await geminiGenerateContent({
    requestKey,
    forceRefresh,
    useResponseCache: true,
    contents: [
      {
        role: 'user',
        parts: [{ text: buildUserPrompt(major, targetClass) }],
      },
    ],
  })

  const result = parseRoadmapResponse(text)
  saveRoadmapToCache(major, targetClass, result)
  return result
}

export const EMPTY_ROADMAP = {
  grade1: [],
  grade2: [],
  grade3: [],
  grade4: [],
}
