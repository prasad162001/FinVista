import { formatCompactCurrency, formatCurrencyWithWords } from '../lib/formatters'
import { LogoMark } from './LogoMark'

export function AppHeader({
  dashboard,
  sections,
  activeSection,
  onSectionChange,
  accessMode,
  user,
  onLogout,
  theme,
  onThemeToggle,
}) {
  const summaryCards = [
    ['Income', dashboard.monthlyIncome],
    ['Expenses', dashboard.monthlyExpenses],
    ['Savings', dashboard.monthlyInvestments],
    ['Loans', dashboard.monthlyDebt],
    ['Insurance', dashboard.monthlyInsurance],
    ['Tax', dashboard.monthlyTaxes],
  ]

  return (
    <header className="header-shell">
      <div className="header-panel">
        <div className="header-copy">
          <LogoMark compact />
          <p className="header-tagline">Wealth OS for personal finance decisions</p>
          <h1>Plan cash flow, protection, taxes, and long-term growth.</h1>
          <p>
            A production-ready financial workspace for loans, insurance, PF, SIP,
            taxes, and personal expenses with secure accounts and guest access.
          </p>
        </div>

        <div className="header-summary">
          {summaryCards.map(([label, value], index) => (
            <div
              key={label}
              className={`hero-tile ${index === 1 ? 'secondary' : index === 2 ? 'tertiary' : index === 3 ? 'quaternary' : ''}`}
              title={`${label}: ${formatCurrencyWithWords(value)}`}
            >
              <span className="truncate-1" title={label}>{label}</span>
              <strong title={formatCurrencyWithWords(value)}>{formatCompactCurrency(value)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="header-toolbar">
        <nav className="cta-row" aria-label="Primary sections">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => onSectionChange(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="cta-row toolbar-actions">
          <span className="status-pill">
            {accessMode === 'user' ? `Signed in as ${user?.name}` : 'Continue in guest mode'}
          </span>
          <span className="status-pill">
            {accessMode === 'user' ? 'Cloud-ready account mode' : 'Guest mode on this device'}
          </span>
          <button className="ghost-button" type="button" onClick={onThemeToggle}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="ghost-button" type="button" onClick={onLogout}>
            {accessMode === 'user' ? 'Logout' : 'Exit guest mode'}
          </button>
        </div>
      </div>
    </header>
  )
}
