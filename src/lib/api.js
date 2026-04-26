import { getStoredToken } from './storage'

const API_BASE = '/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const { headers: optionHeaders = {}, ...restOptions } = options

  const response = await fetch(`${API_BASE}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...optionHeaders,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(errorData.message || 'Request failed.', response.status)
  }

  return response.json()
}

function authHeaders(token) {
  const sessionToken = token || getStoredToken()
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
}

function normalizePlanPayload(payload) {
  const name = String(payload?.name || '').trim()

  if (!payload?.type) {
    throw new ApiError('Plan type is required.', 400)
  }

  if (name.length < 2) {
    throw new ApiError('Plan name must be at least 2 characters long.', 400)
  }

  if (!payload?.inputs || typeof payload.inputs !== 'object' || Array.isArray(payload.inputs)) {
    throw new ApiError('Plan details are incomplete. Please review your inputs and try again.', 400)
  }

  if (!payload?.summary || typeof payload.summary !== 'object' || Array.isArray(payload.summary)) {
    throw new ApiError('Plan results are incomplete. Please recalculate and try again.', 400)
  }

  return {
    ...payload,
    name,
    description: String(payload?.description || 'Saved financial scenario').trim() || 'Saved financial scenario',
  }
}

export async function registerUser(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loginUser(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchMe(token) {
  const data = await request('/auth/me', { headers: authHeaders(token) })
  return data.user
}

export async function fetchDashboard(token) {
  const data = await request('/dashboard', { headers: authHeaders(token) })
  return data.summary
}

export async function fetchPlans(token) {
  const data = await request('/plans', { headers: authHeaders(token) })
  return data.plans
}

export async function savePlan(payload, token) {
  const normalizedPayload = normalizePlanPayload(payload)
  const headers = authHeaders(token)

  if (!headers.Authorization) {
    throw new ApiError('Your session has expired. Please sign in again to save your plan.', 401)
  }

  const data = await request('/plans', {
    method: 'POST',
    headers,
    body: JSON.stringify(normalizedPayload),
  })

  return data.plan
}

export async function deletePlan(planId, token) {
  return request(`/plans/${planId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}
