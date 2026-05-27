import { getStoredToken } from '@/utils/auth'

function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim()
  const withoutTrailingSlash = raw.replace(/\/+$/, '')
  if (withoutTrailingSlash.endsWith('/api/api')) {
    return withoutTrailingSlash.replace(/\/api\/api$/, '/api')
  }
  if (!/\/api$/i.test(withoutTrailingSlash)) {
    return `${withoutTrailingSlash}/api`
  }
  return withoutTrailingSlash
}

const API_BASE_URL = resolveApiBaseUrl()

async function request(path, options = {}) {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const apiPath = path.startsWith('/') ? path : `/${path}`

  const response = await fetch(`${API_BASE_URL}${apiPath}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`)
  }

  return data
}

export const api = {
  getHealth: () => request('/health'),
  createUser: (userData) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getDashboardMe: () => request('/dashboard/me'),
  updateProfile: (profileData) =>
    request('/dashboard/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  syncEconomy: (economy) =>
    request('/dashboard/economy', {
      method: 'PUT',
      body: JSON.stringify(economy),
    }),
  getRoadmap: () => request('/dashboard/roadmap'),
  completeCourse: (courseId) =>
    request(`/dashboard/courses/${courseId}/complete`, { method: 'POST' }),
  uncompleteCourse: (courseId) =>
    request(`/dashboard/courses/${courseId}/uncomplete`, { method: 'POST' }),
  getQuests: () => request('/dashboard/quests'),
  completeQuest: (questId) =>
    request(`/dashboard/quests/${questId}/complete`, { method: 'POST' }),
  spendCoins: (amount = 500) =>
    request('/dashboard/spend-coins', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  requestPayback: (payload) =>
    request('/exchanges/payback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyExchanges: () => request('/exchanges/me'),
  getExchangeMeta: () => request('/exchanges/meta'),
  getAdminAccess: () => request('/exchanges/admin/access'),
  getPendingExchanges: (params = {}) => {
    const query = new URLSearchParams()
    if (params.limit != null) query.set('limit', String(params.limit))
    if (params.skip != null) query.set('skip', String(params.skip))
    const qs = query.toString()
    return request(`/exchanges/admin/pending${qs ? `?${qs}` : ''}`)
  },
  approveExchange: (id, adminNote = '') =>
    request(`/exchanges/admin/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNote }),
    }),
  rejectExchange: (id, reason = '') =>
    request(`/exchanges/admin/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
}

/** @param {{ serviceName: string, amount: number, naverPayId?: string }} payload */
export function requestPayback(payload) {
  return api.requestPayback(payload)
}

export function getMyExchanges() {
  return api.getMyExchanges()
}

export function getExchangeMeta() {
  return api.getExchangeMeta()
}

export function getAdminAccess() {
  return api.getAdminAccess()
}

export function getPendingExchanges(params) {
  return api.getPendingExchanges(params)
}

export function approveExchange(id, adminNote) {
  return api.approveExchange(id, adminNote)
}

export function rejectExchange(id, reason) {
  return api.rejectExchange(id, reason)
}

export default api
