import { useMemo, useState } from 'react'
import { NumericField } from '../../components/NumericField'
import { TrendChart } from '../../components/charts/TrendChart'
import { calculateScenarioComparison } from '../../lib/calculators'
import { formatCurrency, formatPercent } from '../../lib/formatters'
import { summarizePlans } from '../../lib/planSummary'
import { updateNumericField } from '../../lib/formNumbers'

const initialScenario = {
  loanChangePercent: '0',
  pfIncreasePercent: '10',
  insurancePremiumPercent: '5',
  expenseReductionPercent: '8',
}

export function ScenarioComparison({ plans }) {
  const [scenario, setScenario] = useState(initialScenario)
  const baseline = useMemo(() => summarizePlans(plans), [plans])
  const projected = useMemo(() => calculateScenarioComparison(baseline, scenario), [baseline, scenario])

  const updateLoanChange = updateNumericField(setScenario, 'loanChangePercent')
  const updatePfIncrease = updateNumericField(setScenario, 'pfIncreasePercent')
  const updateInsurancePremium = updateNumericField(setScenario, 'insurancePremiumPercent')
  const updateExpenseReduction = updateNumericField(setScenario, 'expenseReductionPercent')

  const comparisonSeries = [
    { label: 'Current', value: baseline.monthlyCommitment },
    { label: 'Scenario', value: projected.monthlyCommitment },
    { label: 'Current surplus', value: Math.max(baseline.surplus, 0) },
    { label: 'Scenario surplus', value: Math.max(projected.surplus, 0) },
  ]

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Scenario Comparison</h2>
          <p>Run what-if simulations across debt, savings, premiums, and personal spending.</p>
        </div>
        <span className="badge">What-if mode</span>
      </div>

      <div className="calculator-layout">
        <div className="field-group">
          <div className="form-grid">
            <NumericField label="Loan commitment change (%)" type="number" value={scenario.loanChangePercent} onChange={updateLoanChange} />
            <NumericField label="PF / savings increase (%)" type="number" value={scenario.pfIncreasePercent} onChange={updatePfIncrease} />
            <NumericField label="Insurance premium change (%)" type="number" value={scenario.insurancePremiumPercent} onChange={updateInsurancePremium} />
            <NumericField label="Expense reduction (%)" type="number" value={scenario.expenseReductionPercent} onChange={updateExpenseReduction} />
          </div>
        </div>

        <div className="result-card">
          <span className="muted">Scenario monthly commitment</span>
          <strong className="result-number">{formatCurrency(projected.monthlyCommitment)}</strong>
          <p>Projected surplus {formatCurrency(projected.surplus)} after applying your scenario inputs.</p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Current commitment</span>
              <strong>{formatCurrency(baseline.monthlyCommitment)}</strong>
            </div>
            <div className="result-chip">
              <span>Scenario commitment</span>
              <strong>{formatCurrency(projected.monthlyCommitment)}</strong>
            </div>
            <div className="result-chip">
              <span>Current savings rate</span>
              <strong>{formatPercent(baseline.savingsRate * 100)}</strong>
            </div>
            <div className="result-chip">
              <span>Projected wealth</span>
              <strong>{formatCurrency(projected.projectedWealth)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <TrendChart items={comparisonSeries} title="Scenario side-by-side" description="Compare current commitments and surplus against the what-if scenario." />
      </div>
    </section>
  )
}
