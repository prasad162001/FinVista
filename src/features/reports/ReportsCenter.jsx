import {
  exportExpensesToCsv,
  exportPlansToCsv,
  openPrintableReport,
  shareSummary,
  shareSummaryByEmail,
} from '../../lib/exporters'
import { formatCurrency } from '../../lib/formatters'
import { buildAlerts } from '../../lib/planSummary'

export function ReportsCenter({ plans, dashboard }) {
  const latestExpensePlan = plans.find((plan) => plan.type === 'expenses')
  const alerts = buildAlerts(plans)

  function handlePrintReport() {
    openPrintableReport({
      title: 'FinVista financial report',
      sections: [
        {
          title: 'Financial snapshot',
          body: `
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Monthly commitment</td><td>${formatCurrency(dashboard.monthlyCommitment)}</td></tr>
              <tr><td>Projected wealth</td><td>${formatCurrency(dashboard.projectedWealth)}</td></tr>
              <tr><td>Protection cover</td><td>${formatCurrency(dashboard.protectionCover)}</td></tr>
              <tr><td>Tax liability</td><td>${formatCurrency(dashboard.taxLiability)}</td></tr>
              <tr><td>Monthly surplus</td><td>${formatCurrency(dashboard.surplus)}</td></tr>
            </table>
          `,
        },
        {
          title: 'Saved plans',
          body: `
            <table>
              <tr><th>Name</th><th>Type</th><th>Description</th></tr>
              ${plans
                .map(
                  (plan) =>
                    `<tr><td>${plan.name}</td><td>${plan.type}</td><td>${plan.description}</td></tr>`,
                )
                .join('')}
            </table>
          `,
        },
      ],
    })
  }

  function handleShareEmail() {
    shareSummaryByEmail({
      subject: 'FinVista financial snapshot',
      body: `Monthly commitment: ${formatCurrency(dashboard.monthlyCommitment)}\nProjected wealth: ${formatCurrency(dashboard.projectedWealth)}\nProtection cover: ${formatCurrency(dashboard.protectionCover)}\nTax liability: ${formatCurrency(dashboard.taxLiability)}\nHealth score: ${dashboard.healthScore}/100`,
    })
  }

  async function handleMobileShare() {
    const didShare = await shareSummary({
      title: 'FinVista financial snapshot',
      text: `Net worth: ${formatCurrency(dashboard.netWorthEstimate)} | Monthly surplus: ${formatCurrency(dashboard.surplus)} | Insurance cover: ${formatCurrency(dashboard.protectionCover)} | Tax liability: ${formatCurrency(dashboard.taxLiability)}`,
    })

    if (!didShare) {
      handleShareEmail()
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Reports &amp; Alerts</h2>
          <p>Export records, print a report, share by email, and review your financial reminders.</p>
        </div>
        <span className="badge">Deployment-ready ops</span>
      </div>

      <div className="tool-grid">
        <article className="tool-card">
          <h3>Export all plans</h3>
          <p>Download all saved plans as CSV for backup or analysis.</p>
          <div className="cta-row">
            <button className="primary-button" type="button" onClick={() => exportPlansToCsv(plans)}>
              Download plans CSV
            </button>
          </div>
        </article>

        <article className="tool-card">
          <h3>Export expense report</h3>
          <p>Download the latest expense breakdown with budgets and category totals.</p>
          <div className="cta-row">
            <button
              className="primary-button"
              type="button"
              onClick={() => latestExpensePlan && exportExpensesToCsv(latestExpensePlan)}
              disabled={!latestExpensePlan}
            >
              Download expense CSV
            </button>
          </div>
        </article>

        <article className="tool-card">
          <h3>Printable PDF-style report</h3>
          <p>Open a clean print view that can be saved as PDF from the browser.</p>
          <div className="cta-row">
            <button className="primary-button" type="button" onClick={handlePrintReport}>
              Open print view
            </button>
          </div>
        </article>

        <article className="tool-card">
          <h3>Email summary</h3>
          <p>Create a draft email with your latest dashboard numbers and planning posture.</p>
          <div className="cta-row">
            <button className="primary-button" type="button" onClick={handleShareEmail}>
              Share by email
            </button>
            <button className="ghost-button" type="button" onClick={handleMobileShare}>
              Mobile share
            </button>
          </div>
        </article>
      </div>

      <div className="panel-heading" style={{ marginTop: '28px' }}>
        <div>
          <h2>Active reminders</h2>
          <p>EMI, PF, premium, tax, and over-budget alerts collected from your saved plans.</p>
        </div>
      </div>

      {alerts.length ? (
        <div className="alert-grid">
          {alerts.map((alert) => (
            <article key={`${alert.title}-${alert.detail}`} className={`alert-card ${alert.severity}`}>
              <strong>{alert.title}</strong>
              <p>{alert.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">No active reminders yet. Save plans with due days or budgets to see alerts here.</div>
      )}
    </section>
  )
}
