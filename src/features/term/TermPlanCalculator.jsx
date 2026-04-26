import { useState } from 'react'
import { NumericField } from '../../components/NumericField'
import { TrendChart } from '../../components/charts/TrendChart'
import { calculateTermPlan } from '../../lib/calculators'
import { formatCurrency, formatNumber } from '../../lib/formatters'
import { updateNumericField } from '../../lib/formNumbers'

const initialState = {
  name: 'Family Security Term Plan',
  age: '31',
  annualPremium: '22000',
  sumAssured: '15000000',
  policyTerm: '25',
  premiumDueDay: '12',
}

export function TermPlanCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const result = calculateTermPlan(form)
  const updateAge = updateNumericField(setForm, 'age')
  const updateAnnualPremium = updateNumericField(setForm, 'annualPremium')
  const updateSumAssured = updateNumericField(setForm, 'sumAssured')
  const updatePolicyTerm = updateNumericField(setForm, 'policyTerm')
  const updatePremiumDueDay = updateNumericField(setForm, 'premiumDueDay')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'term-plan',
        name: form.name,
        description: `Term coverage of ${formatCurrency(result.sumAssured)} with annual premium ${formatCurrency(result.annualPremium)}`,
        inputs: form,
        summary: result,
      })

      setMessage(accessMode === 'user' ? 'Term plan saved to your account.' : 'Term plan saved locally.')
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this term plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Term Plan Calculator</h2>
          <p>Compare premium outlay against protection cover and benefit efficiency.</p>
        </div>
        <span className="badge">Life cover</span>
      </div>

      <div className="calculator-layout">
        <div className="field-group">
          <div className="form-grid">
            <label className="field">
              <span>Plan name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <NumericField label="Age" type="number" min="18" value={form.age} onChange={updateAge} />
            <NumericField label="Annual premium" type="number" min="0" value={form.annualPremium} onChange={updateAnnualPremium} />
            <NumericField label="Sum assured" type="number" min="100000" step="100000" value={form.sumAssured} onChange={updateSumAssured} />
            <NumericField label="Policy term (years)" type="number" min="5" value={form.policyTerm} onChange={updatePolicyTerm} />
            <NumericField label="Premium due day" type="number" min="1" max="28" value={form.premiumDueDay} onChange={updatePremiumDueDay} />
          </div>
        </div>

        <div className="result-card">
          <span className="muted">Coverage available</span>
          <strong className="result-number">{formatCurrency(result.sumAssured)}</strong>
          <p>Monthly equivalent premium of {formatCurrency(result.monthlyPremium)} for a {result.policyTerm}-year term.</p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Total premium outlay</span>
              <strong>{formatCurrency(result.totalPremiumOutlay)}</strong>
            </div>
            <div className="result-chip">
              <span>Benefit efficiency</span>
              <strong>{formatNumber(result.premiumToBenefitRatio)}x</strong>
            </div>
            <div className="result-chip">
              <span>Coverage horizon</span>
              <strong>{result.coverageYears} years</strong>
            </div>
            <div className="result-chip">
              <span>Income replacement lens</span>
              <strong>{formatNumber(result.replacementYears)}x</strong>
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
        <TrendChart items={result.comparisonChart} title="Premium vs benefit" description="A simple visual comparison of the cost and the protection delivered." />
      </div>
    </section>
  )
}
