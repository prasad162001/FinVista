import { MetricCard } from '../../components/MetricCard'
import { AllocationChart } from '../../components/charts/AllocationChart'
import { TrendChart } from '../../components/charts/TrendChart'
import { formatCompactCurrency, formatCurrency, formatCurrencyWithWords, formatPercent } from '../../lib/formatters'
import {
  buildAlerts,
  buildAllocation,
  buildFinancialSnapshot,
  buildTrendSeries,
} from '../../lib/planSummary'

export function Dashboard({ dashboard, loading, plans, onJump, accessMode, user }) {
  const recentPlans = plans.slice(0, 3)
  const allocation = buildAllocation(plans)
  const trendSeries = buildTrendSeries(plans)
  const snapshot = buildFinancialSnapshot(dashboard)
  const alerts = buildAlerts(plans)
  const quickCalculators = [
    ['Loan', 'loan'],
    ['Savings', 'sip'],
    ['Budget', 'expenses'],
    ['Retirement', 'pf'],
    ['Insurance', 'insurance'],
    ['Tax', 'tax'],
  ]

  return (
    <>
      <section className="hero-dashboard">
        <div className="hero-dashboard-copy">
          <p className="sidebar-kicker">Portfolio command center</p>
          <h2>{accessMode === 'user' ? `Welcome back, ${user?.name}.` : 'Build your financial roadmap.'}</h2>
          <p>
            Track obligations, expected wealth, coverage, taxes, spending, and reminders
            from one elegant finance dashboard.
          </p>
          <div className="mobile-snapshot-strip">
            <div className="hero-mini-card accent">
              <span>Net worth</span>
              <strong title={formatCurrencyWithWords(dashboard.netWorthEstimate)}>
                {formatCompactCurrency(dashboard.netWorthEstimate)}
              </strong>
            </div>
            <div className="hero-mini-card">
              <span>Monthly surplus / deficit</span>
              <strong title={formatCurrencyWithWords(dashboard.surplus)}>
                {formatCompactCurrency(dashboard.surplus)}
              </strong>
            </div>
            <div className="hero-mini-card">
              <span>Insurance coverage</span>
              <strong title={formatCurrencyWithWords(dashboard.protectionCover)}>
                {formatCompactCurrency(dashboard.protectionCover)}
              </strong>
            </div>
            <div className="hero-mini-card">
              <span>Tax liability</span>
              <strong title={formatCurrencyWithWords(dashboard.taxLiability)}>
                {formatCompactCurrency(dashboard.taxLiability)}
              </strong>
            </div>
          </div>
          <div className="cta-row">
            <button className="primary-button" type="button" onClick={() => onJump('loan')}>
              Create a new plan
            </button>
            <button className="dark-button" type="button" onClick={() => onJump('saved')}>
              Review saved plans
            </button>
          </div>
        </div>

        <div className="hero-dashboard-grid">
          <div className="hero-mini-card">
            <span>Projected investment wealth</span>
            <strong title={formatCurrencyWithWords(dashboard.projectedWealth)}>
              {formatCompactCurrency(dashboard.projectedWealth)}
            </strong>
          </div>
          <div className="hero-mini-card">
            <span>Total protection cover</span>
            <strong title={formatCurrencyWithWords(dashboard.protectionCover)}>
              {formatCompactCurrency(dashboard.protectionCover)}
            </strong>
          </div>
          <div className="hero-mini-card">
            <span>Tax liability</span>
            <strong title={formatCurrencyWithWords(dashboard.taxLiability)}>
              {formatCompactCurrency(dashboard.taxLiability)}
            </strong>
          </div>
          <div className="hero-mini-card accent">
            <span>{loading ? 'Refreshing...' : 'Workspace status'}</span>
            <strong>{accessMode === 'user' ? 'Synced' : 'Local only'}</strong>
          </div>
        </div>
      </section>

      <section className="app-panel">
        <div className="panel-heading">
          <div>
            <h2>Quick calculators</h2>
            <p>Mobile-first shortcuts to your most-used financial tools.</p>
          </div>
        </div>

        <div className="quick-actions-grid">
          {quickCalculators.map(([label, target]) => (
            <button
              key={target}
              className="nav-button"
              type="button"
              onClick={() => onJump(target)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-panel">
        <div className="dashboard-header">
          <div>
            <h2>Overview</h2>
            <p>Track your recurring obligations, active plans, and saved scenarios.</p>
          </div>
          <span className="badge">
            {loading ? 'Syncing workspace...' : `${dashboard.totalPlans} saved records`}
          </span>
        </div>

        <div className="dashboard-grid">
          <MetricCard
            label="Total plans"
            value={dashboard.totalPlans}
            detail="Every saved quote, plan, budget, and investment scenario."
          />
          <MetricCard
            label="Loan plans"
            value={dashboard.loanPlans}
            detail="EMI plans you can compare and revisit later."
          />
          <MetricCard
            label="Insurance plans"
            value={dashboard.insurancePlans + dashboard.termPlans + dashboard.healthPlans + dashboard.propertyPlans}
            detail="Life, health, and property protection plans."
          />
          <MetricCard
            label="Investment plans"
            value={dashboard.sipPlans + dashboard.pfPlans}
            detail="SIP and PF scenarios with projected maturity and growth."
          />
          <MetricCard
            label="Tax plans"
            value={dashboard.taxPlans}
            detail="Tax records with deduction and liability estimates."
          />
          <MetricCard
            label="Expense plans"
            value={dashboard.expensePlans}
            detail="Expense records with custom categories and budget alerts."
          />
        </div>
      </section>

      <section className="analytics-grid">
        <AllocationChart items={allocation} />
        <TrendChart items={trendSeries} />
      </section>

      <section className="stats-grid">
        <article className="tool-card emphasis-card">
          <h3>Combined monthly outflow</h3>
          <strong className="result-number">{formatCurrency(dashboard.monthlyCommitment)}</strong>
          <p>
            Approximate combined EMI, premiums, investments, taxes, and personal expenses
            across your current workspace.
          </p>
        </article>

        <article className="tool-card">
          <h3>Growth outlook</h3>
          <strong className="result-number">{formatCurrency(dashboard.projectedWealth)}</strong>
          <p>Projected SIP and PF corpus from all current investment plans.</p>
        </article>

        <article className="tool-card">
          <h3>Protection shield</h3>
          <strong className="result-number">{formatCurrency(dashboard.protectionCover)}</strong>
          <p>Total estimated insurance cover from the plans you are tracking.</p>
        </article>

        <article className="tool-card">
          <h3>Tax posture</h3>
          <strong className="result-number">{formatCurrency(dashboard.taxLiability)}</strong>
          <p>Annual liability with savings of {formatCurrency(dashboard.taxSavings)} from deductions.</p>
        </article>

        <article className="tool-card">
          <h3>Expense balance</h3>
          <strong className="result-number">{formatCurrency(dashboard.surplus)}</strong>
          <p>Monthly surplus after debt, premiums, investing, tax, and expenses.</p>
        </article>

        <article className="tool-card">
          <h3>Health score</h3>
          <strong className="result-number">{dashboard.healthScore}/100</strong>
          <p>
            Built from debt ratio, savings rate ({formatPercent(dashboard.savingsRate * 100)}),
            insurance cover, and expense balance.
          </p>
        </article>
      </section>

      <section className="app-panel">
        <div className="dashboard-header">
          <div>
            <h2>Consolidated snapshot</h2>
            <p>See how loans, investments, insurance, taxes, and spending stack up together.</p>
          </div>
        </div>

        <div className="dashboard-grid snapshot-grid">
          {snapshot.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={formatCompactCurrency(item.value)}
              valueTitle={formatCurrencyWithWords(item.value)}
              title={`${item.label}: ${formatCurrencyWithWords(item.value)}`}
              detail={item.detail}
            />
          ))}
        </div>
      </section>

      <section className="app-panel">
        <div className="panel-heading">
          <div>
            <h2>Quick tools</h2>
            <p>Jump into the financial calculator or workspace you need right now.</p>
          </div>
        </div>

        <div className="tool-grid">
          {[
            ['Loan affordability', 'Estimate EMI, interest, and payoff with extra monthly payments.', 'loan', 'Open loan calculator'],
            ['Insurance premium', 'Explore term coverage, age impact, smoking status, and add-ons.', 'insurance', 'Open insurance tool'],
            ['SIP planning', 'Forecast wealth, gains, and corpus growth from monthly investing.', 'sip', 'Open SIP planner'],
            ['PF / VPF planning', 'Model provident fund and voluntary contribution growth.', 'pf', 'Open PF calculator'],
            ['Tax planning', 'Estimate annual liability, monthly provision, and deduction savings.', 'tax', 'Open tax planner'],
            ['Expense manager', 'Track custom categories, budgets, annual totals, and budget pressure.', 'expenses', 'Open expense manager'],
            ['Scenario compare', 'Run what-if simulations across calculators and spending.', 'compare', 'Open comparison'],
            ['Reports and alerts', 'Export reports, print summaries, share by email, and review reminders.', 'reports', 'Open reports'],
            ['Saved scenarios', 'Review all your saved plans, compare outcomes, and clean up old drafts.', 'saved', 'View saved plans'],
          ].map(([title, description, target, button]) => (
            <article className="tool-card" key={target}>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="cta-row">
                <button className="primary-button" type="button" onClick={() => onJump(target)}>
                  {button}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-panel">
        <div className="panel-heading">
          <div>
            <h2>Reminders &amp; alerts</h2>
            <p>Due-date nudges and budget alerts gathered from your saved plans.</p>
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
          <div className="empty-state">
            No reminders yet. Save plans with due dates and budgets to activate alerts.
          </div>
        )}
      </section>

      <section className="app-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent saved plans</h2>
            <p>
              {accessMode === 'user'
                ? 'Your latest synced financial scenarios.'
                : 'Recent plans stored locally on this device.'}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="loading-note">Loading saved plans...</p>
        ) : recentPlans.length ? (
          <div className="saved-grid">
            {recentPlans.map((plan) => (
              <article className="saved-card" key={plan._id}>
                <span className="saved-tag">{plan.type}</span>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            No scenarios saved yet. Build any plan to start your financial workspace.
          </div>
        )}
      </section>
    </>
  )
}
