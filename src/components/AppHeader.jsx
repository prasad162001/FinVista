import { formatCurrency } from '../lib/formatters'
import { LogoMark } from './LogoMark'

export function AppHeader({
  dashboard,
  sections,
  activeSection,
  onSectionChange,
  accessMode,
  user,
  onLogout,
}) {
  return (
    <header className="header-shell">
      <div className="header-panel">
        <div className="header-copy">
          <LogoMark compact />
          <p className="header-tagline">Wealth OS for personal finance decisions</p>
          <h1>Plan cash flow, protection, and long-term growth.</h1>
          <p>
            A production-style financial workspace for loans, insurance, and SIP investing
            with secure accounts and guest access.
          </p>
        </div>

        <div className="header-summary">
          <div className="hero-tile">
            <span>Monthly financial load</span>
            <strong>{formatCurrency(dashboard.monthlyCommitment)}</strong>
          </div>
          <div className="hero-tile secondary">
            <span>{accessMode === 'user' ? 'Signed in as' : 'Using app as'}</span>
            <strong>{accessMode === 'user' ? user?.name : 'Guest mode'}</strong>
          </div>
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
            {accessMode === 'user' ? 'Cloud-ready account mode' : 'Guest mode on this device'}
          </span>
          <button className="ghost-button" type="button" onClick={onLogout}>
            {accessMode === 'user' ? 'Logout' : 'Exit guest mode'}
          </button>
        </div>
      </div>
    </header>
  )
}
