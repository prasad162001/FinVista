import { useState } from 'react'
import { NumericField } from '../../components/NumericField'
import { TrendChart } from '../../components/charts/TrendChart'
import { calculatePfVpf } from '../../lib/calculators'
import { formatCurrency } from '../../lib/formatters'
import { updateNumericField } from '../../lib/formNumbers'

const initialState = {
  name: 'Retirement PF + VPF',
  monthlyContribution: '18000',
  employerContributionRate: '12',
  voluntaryContribution: '4000',
  interestRate: '8.15',
  years: '20',
  contributionDay: '5',
}

export function PfVpfCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const result = calculatePfVpf(form)
  const updateMonthlyContribution = updateNumericField(setForm, 'monthlyContribution')
  const updateEmployerContributionRate = updateNumericField(setForm, 'employerContributionRate')
  const updateVoluntaryContribution = updateNumericField(setForm, 'voluntaryContribution')
  const updateInterestRate = updateNumericField(setForm, 'interestRate')
  const updateYears = updateNumericField(setForm, 'years')
  const updateContributionDay = updateNumericField(setForm, 'contributionDay')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'pf-vpf',
        name: form.name,
        description: `PF and VPF plan with ${formatCurrency(result.totalMonthlyContribution)} monthly contribution`,
        inputs: form,
        summary: result,
      })

      setMessage(
        accessMode === 'user'
          ? 'PF and VPF plan saved to your account.'
          : 'PF and VPF plan saved locally in guest mode.',
      )
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this PF/VPF plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>PF &amp; VPF Calculator</h2>
          <p>Forecast retirement corpus from employee, employer, and voluntary contributions.</p>
        </div>
        <span className="badge">Retirement planning</span>
      </div>

      <div className="calculator-layout">
        <div className="field-group">
          <div className="form-grid">
            <label className="field">
              <span>Plan name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <NumericField label="Monthly employee contribution" type="number" min="0" value={form.monthlyContribution} onChange={updateMonthlyContribution} />
            <NumericField label="Employer contribution (%)" type="number" min="0" step="0.1" value={form.employerContributionRate} onChange={updateEmployerContributionRate} />
            <NumericField label="Voluntary PF per month" type="number" min="0" value={form.voluntaryContribution} onChange={updateVoluntaryContribution} />
            <NumericField label="Interest rate (%)" type="number" min="0" step="0.01" value={form.interestRate} onChange={updateInterestRate} />
            <NumericField label="Years" type="number" min="1" value={form.years} onChange={updateYears} />
          </div>

          <NumericField
            label="Monthly reminder day"
            type="number"
            min="1"
            max="28"
            value={form.contributionDay}
            onChange={updateContributionDay}
            help="Used for PF contribution reminders on the dashboard."
          />
        </div>

        <div className="result-card">
          <span className="muted">Projected maturity amount</span>
          <strong className="result-number">{formatCurrency(result.maturityAmount)}</strong>
          <p>Combined monthly contribution of {formatCurrency(result.totalMonthlyContribution)} across PF and VPF.</p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Employee contribution</span>
              <strong>{formatCurrency(result.employeeContribution)}</strong>
            </div>
            <div className="result-chip">
              <span>Employer contribution</span>
              <strong>{formatCurrency(result.employerContribution)}</strong>
            </div>
            <div className="result-chip">
              <span>Voluntary PF</span>
              <strong>{formatCurrency(result.voluntaryContribution)}</strong>
            </div>
            <div className="result-chip">
              <span>Growth earned</span>
              <strong>{formatCurrency(result.growthEarned)}</strong>
            </div>
          </div>

          <div className="cta-row">
            <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : accessMode === 'user' ? 'Save to my account' : 'Save locally'}
            </button>
          </div>

          {message ? <p className="muted">{message}</p> : null}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <TrendChart items={result.growthChart} title="Retirement growth track" description="Projected PF and VPF corpus at the end of each year." />
      </div>
    </section>
  )
}
