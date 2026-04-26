import { formatCurrency } from '../../lib/formatters'

function summaryLine(plan) {
  if (plan.type === 'loan') {
    return `Monthly EMI ${formatCurrency(plan.summary?.monthlyPayment)}`
  }

  if (plan.type === 'insurance') {
    return `Monthly premium ${formatCurrency(plan.summary?.monthlyPremium)}`
  }

  if (plan.type === 'sip') {
    return `Maturity value ${formatCurrency(plan.summary?.futureValue)}`
  }

  return 'Saved financial scenario'
}

export function SavedPlans({ plans, loading, onDelete, accessMode }) {
  return (
    <section className="app-panel">
      <div className="saved-header">
        <div>
          <h2>Saved Plans</h2>
          <p>
            {accessMode === 'user'
              ? 'All scenarios stored in your FinVista account.'
              : 'Plans stored locally in guest mode on this device.'}
          </p>
        </div>
        <span className="badge">{plans.length} total records</span>
      </div>

      {loading ? (
        <p className="loading-note">Loading saved plans...</p>
      ) : plans.length ? (
        <div className="saved-grid">
          {plans.map((plan) => (
            <article className="saved-card" key={plan._id}>
              <span className="saved-tag">{plan.type}</span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="saved-meta">
                <span className="saved-tag">{summaryLine(plan)}</span>
                <span className="saved-tag">
                  {new Date(plan.createdAt || plan.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="cta-row">
                <button className="nav-button" type="button" onClick={() => onDelete(plan._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          No scenarios saved yet. Use any calculator to create your first record.
        </div>
      )}
    </section>
  )
}
