import { useState } from 'react'
import { NumericField } from '../../components/NumericField'
import { TrendChart } from '../../components/charts/TrendChart'
import { calculateHealthInsurance } from '../../lib/calculators'
import { formatCurrency, formatNumber } from '../../lib/formatters'
import { updateNumericField } from '../../lib/formNumbers'

const initialState = {
  name: 'Family Health Shield',
  age: '36',
  premium: '28000',
  coverageAmount: '1000000',
  familyMembers: '4',
  premiumDueDay: '18',
}

export function HealthInsuranceCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const result = calculateHealthInsurance(form)
  const updateAge = updateNumericField(setForm, 'age')
  const updatePremium = updateNumericField(setForm, 'premium')
  const updateCoverageAmount = updateNumericField(setForm, 'coverageAmount')
  const updateFamilyMembers = updateNumericField(setForm, 'familyMembers')
  const updatePremiumDueDay = updateNumericField(setForm, 'premiumDueDay')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'health-insurance',
        name: form.name,
        description: `Health cover of ${formatCurrency(result.totalCoverage)} for ${form.familyMembers} family members`,
        inputs: form,
        summary: result,
      })

      setMessage(accessMode === 'user' ? 'Health insurance plan saved to your account.' : 'Health insurance plan saved locally.')
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this health insurance plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Health Insurance Calculator</h2>
          <p>Estimate family health cover strength, efficiency, and premium impact.</p>
        </div>
        <span className="badge">Medical cover</span>
      </div>

      <div className="calculator-layout">
        <div className="field-group">
          <div className="form-grid">
            <label className="field">
              <span>Plan name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <NumericField label="Primary age" type="number" min="18" value={form.age} onChange={updateAge} />
            <NumericField label="Annual premium" type="number" min="0" value={form.premium} onChange={updatePremium} />
            <NumericField label="Base coverage amount" type="number" min="100000" step="100000" value={form.coverageAmount} onChange={updateCoverageAmount} />
            <NumericField label="Family members" type="number" min="1" value={form.familyMembers} onChange={updateFamilyMembers} />
            <NumericField label="Premium due day" type="number" min="1" max="28" value={form.premiumDueDay} onChange={updatePremiumDueDay} />
          </div>
        </div>

        <div className="result-card">
          <span className="muted">Total effective coverage</span>
          <strong className="result-number">{formatCurrency(result.totalCoverage)}</strong>
          <p>Per member protection of {formatCurrency(result.perMemberCover)} with annual premium {formatCurrency(result.annualPremium)}.</p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Monthly premium</span>
              <strong>{formatCurrency(result.monthlyPremium)}</strong>
            </div>
            <div className="result-chip">
              <span>Premium efficiency</span>
              <strong>{formatNumber(result.premiumEfficiency)}x</strong>
            </div>
            <div className="result-chip">
              <span>Hospitalization buffer</span>
              <strong>{formatCurrency(result.hospitalizationBuffer)}</strong>
            </div>
            <div className="result-chip">
              <span>Covered members</span>
              <strong>{form.familyMembers}</strong>
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
        <TrendChart items={result.comparisonChart} title="Coverage comparison" description="How premium, cover, and per-member protection compare." />
      </div>
    </section>
  )
}
