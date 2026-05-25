import { CAREER_CARDS } from '@/data/careerCards'
import { getStoredUser } from '@/utils/auth'

const COLLECTION_PREFIX = 'career_collection_'

function getCollectionKey() {
  const user = getStoredUser()
  return `${COLLECTION_PREFIX}${user?._id || 'guest'}`
}

export function getCollection() {
  try {
    const raw = localStorage.getItem(getCollectionKey())
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToCollection(cards) {
  const existing = getCollection()
  const existingIds = new Set(existing.map((c) => c.id))
  const newCards = cards.filter((c) => !existingIds.has(c.id))
  const merged = [...existing]

  cards.forEach((card) => {
    if (!existingIds.has(card.id)) {
      merged.push({ ...card, acquiredAt: new Date().toISOString() })
      existingIds.add(card.id)
    }
  })

  localStorage.setItem(getCollectionKey(), JSON.stringify(merged))
  return { merged, newCount: newCards.length }
}

export function hasCard(cardId) {
  return getCollection().some((c) => c.id === cardId)
}

export function isCollectionComplete() {
  const collection = getCollection()
  const uniqueIds = new Set(collection.map((card) => card.id))
  return uniqueIds.size >= CAREER_CARDS.length
}

export function resetCollection() {
  localStorage.setItem(getCollectionKey(), JSON.stringify([]))
}

export { CAREER_CARDS }
