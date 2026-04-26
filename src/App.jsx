import { useEffect, useState } from 'react'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { AuthGate } from './components/AuthGate'
import { ScenarioComparison } from './features/compare/ScenarioComparison'
import { Dashboard } from './features/dashboard/Dashboard'
import { ExpenseManager } from './features/expenses/ExpenseManager'
import { HealthInsuranceCalculator } from './features/health/HealthInsuranceCalculator'
import { InsuranceCalculator } from './features/insurance/InsuranceCalculator'
import { LoanCalculator } from './features/loan/LoanCalculator'
import { PfVpfCalculator } from './features/pf/PfVpfCalculator'
import { PropertyInsuranceCalculator } from './features/property/PropertyInsuranceCalculator'
import { ReportsCenter } from './features/reports/ReportsCenter'
import { SavedPlans } from './features/saved/SavedPlans'
import { SipCalculator } from './features/sip/SipCalculator'
import { TaxCalculator } from './features/tax/TaxCalculator'
import { TermPlanCalculator } from './features/term/TermPlanCalculator'
import {
  deletePlan,
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
  getStoredTheme,
  getStoredToken,
  saveGuestPlans,
  setGuestMode,
  setStoredSession,
  setStoredTheme,
} from './lib/storage'

const sections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'loan', label: 'Loan' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'sip', label: 'SIP Returns' },
  { id: 'pf', label: 'PF & VPF' },
  { id: 'term', label: 'Term Plan' },
  { id: 'health', label: 'Health' },
  { id: 'property', label: 'Property' },
  { id: 'tax', label: 'Tax' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'compare', label: 'Compare' },
  { id: 'reports', label: 'Reports' },
  { id: 'saved', label: 'Saved Plans' },
]

const calculatorSections = [
  { id: 'loan', label: 'Loan' },
  { id: 'sip', label: 'Savings' },
  { id: 'expenses', label: 'Budget' },
  { id: 'pf', label: 'Retirement' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'tax', label: 'Tax' },
]

const mobileSections = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'loan', label: 'Calc' },
  { id: 'saved', label: 'Saved' },
  { id: 'reports', label: 'Share' },
]

const emptyDashboard = summarizePlans([])

function createGuestPlan(payload) {
  return {
    _id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function isAuthError(error) {
  return error?.status === 401
}

function getSectionLabel(sectionId) {
  return sections.find((section) => section.id === sectionId)?.label || 'Dashboard'
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
  const [theme, setTheme] = useState(getStoredTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    setStoredTheme(theme)
  }, [theme])

  async function loadUserWorkspace(sessionToken) {
    const [currentUser, plansData] = await Promise.all([
      fetchMe(sessionToken),
      fetchPlans(sessionToken),
    ])

    setToken(sessionToken)
    setUser(currentUser)
    setDashboard(summarizePlans(plansData))
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

  function handleExpiredSession(message = 'Your session expired. Please sign in again to save changes.') {
    clearStoredSession()
    clearAccessMode()
    setToken('')
    setUser(null)
    setPlans([])
    setDashboard(emptyDashboard)
    setAccessMode(null)
    setActiveSection('dashboard')
    setError(message)
  }

  async function handlePlanSaved(payload) {
    let savedPlan
    let nextPlans

    try {
      setError('')

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
    } catch (saveError) {
      if (isAuthError(saveError)) {
        handleExpiredSession(saveError.message)
      } else {
        setError(saveError.message || 'Unable to save this plan right now.')
      }

      throw saveError
    }
  }

  async function handleDeletePlan(planId) {
    try {
      setError('')

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
      if (isAuthError(deleteError)) {
        handleExpiredSession(deleteError.message || 'Your session expired. Please sign in again to manage saved plans.')
      } else {
        setError(deleteError.message || 'Unable to delete this saved plan.')
      }
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
      case 'pf':
        return <PfVpfCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'term':
        return <TermPlanCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'health':
        return <HealthInsuranceCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'property':
        return <PropertyInsuranceCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'tax':
        return <TaxCalculator onSave={handlePlanSaved} accessMode={accessMode} />
      case 'expenses':
        return <ExpenseManager onSave={handlePlanSaved} accessMode={accessMode} />
      case 'compare':
        return <ScenarioComparison plans={plans} />
      case 'reports':
        return <ReportsCenter plans={plans} dashboard={dashboard} />
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

  const showCalculatorTabs = calculatorSections.some((section) => section.id === activeSection)
  const activeLabel = getSectionLabel(activeSection)
  const breadcrumbTrail =
    activeSection === 'dashboard' ? ['Workspace', activeLabel] : ['Workspace', 'Dashboard', activeLabel]

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
        theme={theme}
        onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      />

      {error ? <div className="app-alert">{error}</div> : null}

      <div className="mobile-sticky-nav" aria-label="Mobile quick navigation">
        {mobileSections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
        <button
          className="ghost-button"
          type="button"
          onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>

      <main className="app-main">
        <aside className="app-sidebar">
          <div className="sidebar-card sidebar-gradient">
            <p className="sidebar-kicker">Financial workspace</p>
            <h2>Move from calculators to a real decision dashboard.</h2>
            <p className="sidebar-copy">
              FinVista now brings loans, tax, insurance, PF, investments, expenses,
              exports, and reminders into one production-ready personal finance workspace.
            </p>
          </div>

          <div className="sidebar-card small">
            <h3>{accessMode === 'user' ? 'Account benefits' : 'Guest mode benefits'}</h3>
            <ul className="feature-list">
              <li>{accessMode === 'user' ? 'Plans are saved to your personal account' : 'Start instantly without creating an account'}</li>
              <li>{accessMode === 'user' ? 'Return later and access your scenarios' : 'Plans stay on this device for quick exploration'}</li>
              <li>Loan, insurance, tax, SIP, PF, and expense planning in one place</li>
              <li>Visual analytics, reminders, exports, and scenario comparison</li>
            </ul>
          </div>
        </aside>

        <section className="app-content">
          <nav className="app-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbTrail.map((label, index) => (
              <span key={`${label}-${index}`} className={index === breadcrumbTrail.length - 1 ? 'current' : ''}>
                {label}
              </span>
            ))}
          </nav>

          <details className="app-panel quick-hub collapsible-panel" open>
            <summary className="collapsible-summary">
              <div>
                <h2>Quick access</h2>
                <p>Jump straight to dashboard insights or the calculator you need on the go.</p>
              </div>
            </summary>

            <div className="quick-actions-grid">
              <button className="primary-button" type="button" onClick={() => setActiveSection('dashboard')}>
                Dashboard snapshot
              </button>
              <button className="guest-button" type="button" onClick={() => setActiveSection(accessMode === 'user' ? 'saved' : 'reports')}>
                {accessMode === 'user' ? 'Saved plans' : 'Reports & share'}
              </button>
              {calculatorSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </details>

          {showCalculatorTabs ? (
            <details className="app-panel calculator-tab-panel collapsible-panel" open>
              <summary className="collapsible-summary">
                <div>
                  <h2>Quick calculators</h2>
                  <p>Swipe or tap between core calculators without losing your place.</p>
                </div>
              </summary>

              <nav className="calculator-tab-strip" aria-label="Calculator tabs">
                {calculatorSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </details>
          ) : null}

          {renderSection()}
        </section>
      </main>
    </div>
  )
}

export default App
