import { useState } from 'react'
import { NumericField } from '../../components/NumericField'
import { calculateInsurance } from '../../lib/calculators'
import { formatCurrency, formatNumber } from '../../lib/formatters'
import { updateNumericField } from '../../lib/formNumbers'

const initialState = {
  name: 'Family Term Cover',
  age: '32',
  coverage: '10000000',
  term: '25',
  smoker: 'no',
  riders: 'critical',
}

export function InsuranceCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const result = calculateInsurance(form)
  const updateAge = updateNumericField(setForm, 'age')
  const updateCoverage = updateNumericField(setForm, 'coverage')
  const updateTerm = updateNumericField(setForm, 'term')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'insurance',
        name: form.name,
        description: `Insurance estimate for ${formatCurrency(Number(form.coverage) || 0)} coverage`,
        inputs: form,
        summary: result,
      })

      setMessage(
        accessMode === 'user'
          ? 'Insurance plan saved to your FinVista account.'
          : 'Insurance plan saved locally in guest mode.',
      )
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this insurance estimate.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Insurance Premium Estimator</h2>
          <p>Estimate annual and monthly premium cost for term insurance scenarios.</p>
        </div>
        <span className="badge">Protection planning</span>
      </div>

      <div className="calculator-layout">
        <div className="field-group">
          <div className="form-grid">
            <label className="field">
              <span>Plan name</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>
            <NumericField label="Age" type="number" min="18" max="70" inputMode="numeric" value={form.age} onChange={updateAge} />
            <NumericField label="Coverage amount" type="number" min="100000" step="100000" inputMode="numeric" value={form.coverage} onChange={updateCoverage} />
            <NumericField label="Policy term (years)" type="number" min="0" max="40" inputMode="numeric" value={form.term} onChange={updateTerm} />
            <label className="field">
              <span>Smoking status</span>
              <select
                value={form.smoker}
                onChange={(event) => updateField('smoker', event.target.value)}
              >
                <option value="no">Non-smoker</option>
                <option value="yes">Smoker</option>
              </select>
            </label>
            <label className="field">
              <span>Add-on rider</span>
              <select
                value={form.riders}
                onChange={(event) => updateField('riders', event.target.value)}
              >
                <option value="none">No rider</option>
                <option value="critical">Critical illness</option>
                <option value="waiver">Premium waiver</option>
                <option value="combo">Critical illness + waiver</option>
              </select>
            </label>
          </div>
        </div>

        <div className="result-card">
          <span className="muted">Estimated monthly premium</span>
          <strong className="result-number">{formatCurrency(result.monthlyPremium)}</strong>
          <p>
            Annual premium {formatCurrency(result.annualPremium)} for{' '}
            {formatCurrency(Number(form.coverage) || 0)} coverage.
          </p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Risk score</span>
              <strong>{formatNumber(result.riskScore)} / 10</strong>
            </div>
            <div className="result-chip">
              <span>Term cost</span>
              <strong>{formatCurrency(result.totalPolicyCost)}</strong>
            </div>
            <div className="result-chip">
              <span>Coverage ratio</span>
              <strong>{formatNumber(result.coverageRatio)}x</strong>
            </div>
            <div className="result-chip">
              <span>Rider uplift</span>
              <strong>{formatNumber(result.riderImpact)}%</strong>
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
    </section>
  )
}
