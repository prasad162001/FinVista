import { useEffect, useState } from 'react'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { AuthGate } from './components/AuthGate'
import { Dashboard } from './features/dashboard/Dashboard'
import { InsuranceCalculator } from './features/insurance/InsuranceCalculator'
import { LoanCalculator } from './features/loan/LoanCalculator'
import { SavedPlans } from './features/saved/SavedPlans'
import { SipCalculator } from './features/sip/SipCalculator'
import {
  deletePlan,
  fetchDashboard,
  fetchMe,
  fetchPlans,
  loginUser,
  registerUser,
  savePlan,
} from './lib/api'
import { summarizePlans } from './lib/planSummary'
import {
  clearAccessMode,
  clearStoredSession,
  getAccessMode,
  getGuestPlans,
  getStoredToken,
  saveGuestPlans,
  setGuestMode,
  setStoredSession,
} from './lib/storage'

const sections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'loan', label: 'Loan' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'sip', label: 'SIP Returns' },
  { id: 'saved', label: 'Saved Plans' },
]

const emptyDashboard = {
  totalPlans: 0,
  loanPlans: 0,
  insurancePlans: 0,
  sipPlans: 0,
  monthlyCommitment: 0,
  projectedWealth: 0,
  protectionCover: 0,
  payoffSavings: 0,
}

function createGuestPlan(payload) {
  return {
    _id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [plans, setPlans] = useState([])
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessMode, setAccessMode] = useState(null)
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)

  async function loadUserWorkspace(sessionToken) {
    const [currentUser, dashboardData, plansData] = await Promise.all([
      fetchMe(sessionToken),
      fetchDashboard(sessionToken),
      fetchPlans(sessionToken),
    ])

    setToken(sessionToken)
    setUser(currentUser)
    setDashboard(dashboardData)
    setPlans(plansData)
    setAccessMode('user')
  }

  function loadGuestWorkspace() {
    const guestPlans = getGuestPlans()
    setToken('')
    setUser(null)
    setPlans(guestPlans)
    setDashboard(summarizePlans(guestPlans))
    setAccessMode('guest')
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true)
        setError('')

        const storedMode = getAccessMode()
        const storedToken = getStoredToken()

        if (storedMode === 'user' && storedToken) {
          await loadUserWorkspace(storedToken)
          return
        }

        if (storedMode === 'guest') {
          loadGuestWorkspace()
          return
        }

        setAccessMode(null)
      } catch (bootstrapError) {
        clearStoredSession()
        clearAccessMode()
        setError(bootstrapError.message || 'Unable to restore your session.')
        setAccessMode(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [])

  async function handleAuthSuccess(authResponse) {
    setStoredSession(authResponse.token, authResponse.user)
    await loadUserWorkspace(authResponse.token)
  }

  async function handleLogin(credentials) {
    const authResponse = await loginUser(credentials)
    await handleAuthSuccess(authResponse)
  }

  async function handleRegister(payload) {
    const authResponse = await registerUser(payload)
    await handleAuthSuccess(authResponse)
  }

  function handleContinueGuest() {
    setGuestMode()
    loadGuestWorkspace()
  }

  function handleLogout() {
    clearStoredSession()
    clearAccessMode()
    setToken('')
    setUser(null)
    setPlans([])
    setDashboard(emptyDashboard)
    setAccessMode(null)
    setActiveSection('dashboard')
  }

  async function handlePlanSaved(payload) {
    let savedPlan
    let nextPlans

    if (accessMode === 'user') {
      savedPlan = await savePlan(payload, token)
      nextPlans = [savedPlan, ...plans]
    } else {
      savedPlan = createGuestPlan(payload)
      nextPlans = [savedPlan, ...plans]
      saveGuestPlans(nextPlans)
    }

    setPlans(nextPlans)
    setDashboard(summarizePlans(nextPlans))
    setActiveSection('saved')
    return savedPlan
  }

  async function handleDeletePlan(planId) {
    try {
      if (accessMode === 'user') {
        await deletePlan(planId, token)
      }

      const nextPlans = plans.filter((plan) => plan._id !== planId)

      if (accessMode === 'guest') {
        saveGuestPlans(nextPlans)
      }

      setPlans(nextPlans)
      setDashboard(summarizePlans(nextPlans))
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this saved plan.')
    }
  }

  function renderSection() {
    switch (activeSection) {
      case 'loan':
        return <LoanCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'insurance':
        return <InsuranceCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'sip':
        return <SipCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'saved':
        return (
          <SavedPlans
            plans={plans}
            loading={loading}
            onDelete={handleDeletePlan}
            accessMode={accessMode}
          />
        )
      case 'dashboard':
      default:
        return (
          <Dashboard
            dashboard={dashboard}
            loading={loading}
            plans={plans}
            onJump={setActiveSection}
            accessMode={accessMode}
            user={user}
          />
        )
    }
  }

  if (!accessMode && !loading) {
    return (
      <AuthGate
        onLogin={handleLogin}
        onRegister={handleRegister}
        onContinueGuest={handleContinueGuest}
      />
    )
  }

  return (
    <div className="app-shell">
      <AppHeader
        dashboard={dashboard}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        accessMode={accessMode}
        user={user}
        onLogout={handleLogout}
      />

      {error ? <div className="app-alert">{error}</div> : null}

      <main className="app-main">
        <aside className="app-sidebar">
          <div className="sidebar-card sidebar-gradient">
            <p className="sidebar-kicker">Financial workspace</p>
            <h2>Move from calculators to a real decision dashboard.</h2>
            <p className="sidebar-copy">
              FinVista keeps loans, protection, and investing together with cleaner
              analytics, user accounts, and guest access that never blocks exploration.
            </p>
          </div>

          <div className="sidebar-card small">
            <h3>{accessMode === 'user' ? 'Account benefits' : 'Guest mode benefits'}</h3>
            <ul className="feature-list">
              <li>{accessMode === 'user' ? 'Plans are saved to your personal account' : 'Start instantly without creating an account'}</li>
              <li>{accessMode === 'user' ? 'Return later and access your scenarios' : 'Plans stay on this device for quick exploration'}</li>
              <li>Loan, insurance, and SIP planning in one place</li>
              <li>Visual analytics for commitment, growth, and protection</li>
            </ul>
          </div>
        </aside>

        <section className="app-content">{renderSection()}</section>
      </main>
    </div>
  )
}

export default App
