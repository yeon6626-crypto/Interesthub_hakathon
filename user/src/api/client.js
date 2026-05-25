import { getStoredToken } from '@/utils/auth'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
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
}

export default api
