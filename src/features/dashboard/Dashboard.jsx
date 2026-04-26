import { MetricCard } from '../../components/MetricCard'
import { AllocationChart } from '../../components/charts/AllocationChart'
import { TrendChart } from '../../components/charts/TrendChart'
import { formatCurrency } from '../../lib/formatters'
import { buildAllocation, buildTrendSeries } from '../../lib/planSummary'

export function Dashboard({ dashboard, loading, plans, onJump, accessMode, user }) {
  const recentPlans = plans.slice(0, 3)
  const allocation = buildAllocation(plans)
  const trendSeries = buildTrendSeries(plans)

  return (
    <>
      <section className="hero-dashboard">
        <div className="hero-dashboard-copy">
          <p className="sidebar-kicker">Portfolio command center</p>
          <h2>{accessMode === 'user' ? `Welcome back, ${user?.name}.` : 'Build your financial roadmap.'}</h2>
          <p>
            Track obligations, expected wealth, coverage, and payoff savings from one
            elegant finance dashboard.
          </p>
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
            <span>Projected SIP wealth</span>
            <strong>{formatCurrency(dashboard.projectedWealth)}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Total protection cover</span>
            <strong>{formatCurrency(dashboard.protectionCover)}</strong>
          </div>
          <div className="hero-mini-card">
            <span>Loan savings unlocked</span>
            <strong>{formatCurrency(dashboard.payoffSavings)}</strong>
          </div>
          <div className="hero-mini-card accent">
            <span>{loading ? 'Refreshing...' : 'Workspace status'}</span>
            <strong>{accessMode === 'user' ? 'Synced' : 'Local only'}</strong>
          </div>
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
            detail="Every saved quote, plan, and investment scenario."
          />
          <MetricCard
            label="Loan plans"
            value={dashboard.loanPlans}
            detail="EMI plans you can compare and revisit later."
          />
          <MetricCard
            label="Insurance plans"
            value={dashboard.insurancePlans}
            detail="Protection scenarios with coverage and premium estimates."
          />
          <MetricCard
            label="SIP plans"
            value={dashboard.sipPlans}
            detail="Investment plans with projected maturity and growth."
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
            Approximate combined EMI, premium, and SIP contribution across your
            current workspace.
          </p>
        </article>

        <article className="tool-card">
          <h3>Growth outlook</h3>
          <strong className="result-number">{formatCurrency(dashboard.projectedWealth)}</strong>
          <p>Projected long-term SIP corpus from all current investment plans.</p>
        </article>

        <article className="tool-card">
          <h3>Protection shield</h3>
          <strong className="result-number">{formatCurrency(dashboard.protectionCover)}</strong>
          <p>Total estimated insurance cover from the plans you are tracking.</p>
        </article>
      </section>

      <section className="app-panel">
        <div className="panel-heading">
          <div>
            <h2>Quick tools</h2>
            <p>Jump into the financial calculator you need right now.</p>
          </div>
        </div>

        <div className="tool-grid">
          <article className="tool-card">
            <h3>Loan affordability</h3>
            <p>Estimate EMI, interest, and payoff with extra monthly payments.</p>
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => onJump('loan')}>
                Open loan calculator
              </button>
            </div>
          </article>
          <article className="tool-card">
            <h3>Insurance premium</h3>
            <p>Explore term coverage, age impact, smoking status, and add-ons.</p>
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => onJump('insurance')}>
                Open insurance tool
              </button>
            </div>
          </article>
          <article className="tool-card">
            <h3>SIP planning</h3>
            <p>Forecast wealth, gains, and corpus growth from monthly investing.</p>
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => onJump('sip')}>
                Open SIP planner
              </button>
            </div>
          </article>
          <article className="tool-card">
            <h3>Saved scenarios</h3>
            <p>Review all your saved plans, compare outcomes, and clean up old drafts.</p>
            <div className="cta-row">
              <button className="primary-button" type="button" onClick={() => onJump('saved')}>
                View saved plans
              </button>
            </div>
          </article>
        </div>
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
            No scenarios saved yet. Build a loan, insurance, or SIP plan to start your
            financial workspace.
          </div>
        )}
      </section>
    </>
  )
}
