const API_BASE = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Request failed.')
  }

  return response.json()
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
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
  const data = await request('/plans', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })

  return data.plan
}

export async function deletePlan(planId, token) {
  return request(`/plans/${planId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}
