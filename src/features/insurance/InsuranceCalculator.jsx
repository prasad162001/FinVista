import { useState } from 'react'
import { calculateInsurance } from '../../lib/calculators'
import { formatCurrency, formatNumber } from '../../lib/formatters'

const initialState = {
  name: 'Family Term Cover',
  age: 32,
  coverage: 10000000,
  term: 25,
  smoker: 'no',
  riders: 'critical',
}

export function InsuranceCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const result = calculateInsurance(form)

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
        description: `Insurance estimate for ${formatCurrency(form.coverage)} coverage`,
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
            <label className="field">
              <span>Age</span>
              <input
                type="number"
                min="18"
                max="70"
                value={form.age}
                onChange={(event) => updateField('age', Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Coverage amount</span>
              <input
                type="number"
                min="100000"
                step="100000"
                value={form.coverage}
                onChange={(event) => updateField('coverage', Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Policy term (years)</span>
              <input
                type="number"
                min="5"
                max="40"
                value={form.term}
                onChange={(event) => updateField('term', Number(event.target.value))}
              />
            </label>
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
            {formatCurrency(form.coverage)} coverage.
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
