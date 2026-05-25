export const YEAR_TABS = [
  { year: 1, title: '1차 (1학년)' },
  { year: 2, title: '2차 (2학년)' },
  { year: 3, title: '3차 (3학년)' },
  { year: 4, title: '4차 (4학년)' },
]

const COURSE_YEAR_BY_CODE = {
  gen_chem: 1,
  basic_ecology: 1,
  circuit_1: 2,
  electro_1: 2,
  linear_algebra: 2,
  renewable_energy: 3,
  env_policy: 3,
  ecotoxicology: 4,
  green_tech: 4,
}

const TYPE_TO_YEAR = {
  FOUNDATION: 1,
  CORE: 2,
  SPECIALIZATION: 4,
}

function getItemYear(item, group) {
  if (typeof item.academicYear === 'number') {
    return item.academicYear
  }

  if (item.courseCode && COURSE_YEAR_BY_CODE[item.courseCode]) {
    return COURSE_YEAR_BY_CODE[item.courseCode]
  }

  if (group?.courseType && TYPE_TO_YEAR[group.courseType]) {
    return TYPE_TO_YEAR[group.courseType]
  }

  return 1
}

function buildYearResult(buckets) {
  return YEAR_TABS.map((tab) => {
    const items = buckets[tab.year] || []
    const completed = items.filter(
      (item) => item.isCompleted || item.status === 'COMPLETED'
    ).length
    const total = items.length

    return {
      year: tab.year,
      title: tab.title,
      items,
      mastered: total > 0 && completed === total,
      progress: { completed, total },
    }
  })
}

/** API 응답(학년별 또는 예전 courseType 그룹)을 1~4차 탭 구조로 통일 */
export function normalizeRoadmapByYear(roadmap) {
  const buckets = { 1: [], 2: [], 3: [], 4: [] }

  if (!Array.isArray(roadmap) || roadmap.length === 0) {
    return buildYearResult(buckets)
  }

  const isYearFormat = roadmap.some(
    (entry) => typeof entry.year === 'number' && entry.year >= 1 && entry.year <= 4
  )

  if (isYearFormat) {
    roadmap.forEach((entry) => {
      if (entry.year >= 1 && entry.year <= 4) {
        buckets[entry.year] = entry.items || []
      }
    })
    return buildYearResult(buckets)
  }

  roadmap.forEach((group) => {
    ;(group.items || []).forEach((item) => {
      const year = getItemYear(item, group)
      buckets[year].push(item)
    })
  })

  return buildYearResult(buckets)
}
