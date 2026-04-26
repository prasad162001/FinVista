import { useState } from 'react'
import { NumericField } from '../../components/NumericField'
import { TrendChart } from '../../components/charts/TrendChart'
import { calculatePropertyInsurance } from '../../lib/calculators'
import { formatCurrency } from '../../lib/formatters'
import { updateNumericField } from '../../lib/formNumbers'

const initialState = {
  name: 'Home Asset Cover',
  propertyValue: '8500000',
  premiumRate: '0.35',
  coverageType: 'standard',
  premiumDueDay: '20',
}

export function PropertyInsuranceCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const result = calculatePropertyInsurance(form)
  const updatePropertyValue = updateNumericField(setForm, 'propertyValue')
  const updatePremiumRate = updateNumericField(setForm, 'premiumRate')
  const updatePremiumDueDay = updateNumericField(setForm, 'premiumDueDay')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'property-insurance',
        name: form.name,
        description: `Property insurance with ${form.coverageType} cover for ${formatCurrency(result.insuredValue)}`,
        inputs: form,
        summary: result,
      })

      setMessage(accessMode === 'user' ? 'Property insurance plan saved to your account.' : 'Property insurance plan saved locally.')
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this property insurance plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Property Insurance Calculator</h2>
          <p>Estimate insured value, premium, and the remaining uncovered risk.</p>
        </div>
        <span className="badge">Asset protection</span>
      </div>

      <div className="calculator-layout">
        <div className="field-group">
          <div className="form-grid">
            <label className="field">
              <span>Plan name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <NumericField label="Property value" type="number" min="100000" step="100000" value={form.propertyValue} onChange={updatePropertyValue} />
            <NumericField label="Premium rate (%)" type="number" min="0" step="0.01" value={form.premiumRate} onChange={updatePremiumRate} />
            <label className="field">
              <span>Coverage type</span>
              <select value={form.coverageType} onChange={(event) => updateField('coverageType', event.target.value)}>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </label>
            <NumericField label="Premium due day" type="number" min="1" max="28" value={form.premiumDueDay} onChange={updatePremiumDueDay} />
          </div>
        </div>

        <div className="result-card">
          <span className="muted">Insured property value</span>
          <strong className="result-number">{formatCurrency(result.insuredValue)}</strong>
          <p>Annual premium of {formatCurrency(result.annualPremium)} with {form.coverageType} cover.</p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Monthly premium</span>
              <strong>{formatCurrency(result.monthlyPremium)}</strong>
            </div>
            <div className="result-chip">
              <span>Uncovered risk gap</span>
              <strong>{formatCurrency(result.riskGap)}</strong>
            </div>
            <div className="result-chip">
              <span>Property value</span>
              <strong>{formatCurrency(result.propertyValue)}</strong>
            </div>
            <div className="result-chip">
              <span>Cover tier</span>
              <strong>{form.coverageType}</strong>
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
        <TrendChart items={result.riskCoverageChart} title="Risk coverage chart" description="A direct comparison of the asset value, protected value, and uncovered portion." />
      </div>
    </section>
  )
}
