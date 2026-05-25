const STORAGE_PREFIX = 'interesthub-verified-specs-'

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`
}

/**
 * @param {string | undefined} userId
 * @returns {string[]}
 */
export function loadVerifiedSpecs(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

/**
 * @param {string | undefined} userId
 * @param {string[]} items
 */
export function saveVerifiedSpecs(userId, items) {
  localStorage.setItem(storageKey(userId), JSON.stringify(items))
}

/**
 * @param {string | undefined} userId
 * @param {string} verifiedItem
 * @returns {string[]}
 */
export function addVerifiedSpec(userId, verifiedItem) {
  const trimmed = String(verifiedItem || '').trim()
  if (!trimmed) return loadVerifiedSpecs(userId)

  const existing = loadVerifiedSpecs(userId)
  if (existing.includes(trimmed)) return existing

  const next = [...existing, trimmed]
  saveVerifiedSpecs(userId, next)
  return next
}
