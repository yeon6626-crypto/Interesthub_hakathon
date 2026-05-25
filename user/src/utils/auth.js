import { scheduleEconomySync } from '@/utils/economySync'

export const TOKEN_KEY = 'token'
export const USER_KEY = 'user'

export function getStoredUser() {
  const savedUser = localStorage.getItem(USER_KEY)
  if (!savedUser) return null

  try {
    return JSON.parse(savedUser)
  } catch {
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * @param {object} user
 * @param {{ skipSync?: boolean }} [options]
 */
export function saveUser(user, options = {}) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (!options.skipSync) {
    scheduleEconomySync(user)
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  return Boolean(getStoredToken() && getStoredUser())
}
