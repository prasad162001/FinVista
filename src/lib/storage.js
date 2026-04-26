const TOKEN_KEY = 'finvista.token'
const USER_KEY = 'finvista.user'
const GUEST_PLANS_KEY = 'finvista.guest-plans'
const ACCESS_KEY = 'finvista.access-mode'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(ACCESS_KEY, 'user')
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setGuestMode() {
  localStorage.setItem(ACCESS_KEY, 'guest')
}

export function clearAccessMode() {
  localStorage.removeItem(ACCESS_KEY)
}

export function getAccessMode() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getGuestPlans() {
  const raw = localStorage.getItem(GUEST_PLANS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveGuestPlans(plans) {
  localStorage.setItem(GUEST_PLANS_KEY, JSON.stringify(plans))
}
