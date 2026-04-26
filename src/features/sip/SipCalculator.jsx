import { useState } from 'react'
import { calculateSip } from '../../lib/calculators'
import { formatCurrency, formatNumber } from '../../lib/formatters'

const initialState = {
  name: 'Long Term Wealth Plan',
  monthlyContribution: 15000,
  annualReturn: 12,
  years: 15,
  stepUp: 5,
}

export function SipCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const result = calculateSip(form)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'sip',
        name: form.name,
        description: `SIP plan with ${formatCurrency(form.monthlyContribution)} monthly investment`,
        inputs: form,
        summary: result,
      })

      setMessage(
        accessMode === 'user'
          ? 'SIP plan saved to your FinVista account.'
          : 'SIP plan saved locally in guest mode.',
      )
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this SIP plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>SIP Return Planner</h2>
          <p>Project wealth creation from monthly investing and annual step-up growth.</p>
        </div>
        <span className="badge">Investing growth</span>
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
              <span>Monthly contribution</span>
              <input
                type="number"
                min="500"
                step="500"
                value={form.monthlyContribution}
                onChange={(event) =>
                  updateField('monthlyContribution', Number(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>Expected annual return (%)</span>
              <input
                type="number"
                min="1"
                step="0.1"
                value={form.annualReturn}
                onChange={(event) => updateField('annualReturn', Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Investment term (years)</span>
              <input
                type="number"
                min="1"
                max="40"
                value={form.years}
                onChange={(event) => updateField('years', Number(event.target.value))}
              />
            </label>
          </div>

          <label className="field">
            <span>Annual step-up (%)</span>
            <input
              type="range"
              min="0"
              max="20"
              value={form.stepUp}
              onChange={(event) => updateField('stepUp', Number(event.target.value))}
            />
            <input
              type="number"
              min="0"
              max="20"
              value={form.stepUp}
              onChange={(event) => updateField('stepUp', Number(event.target.value))}
            />
            <small>Increase your SIP contribution a little every year.</small>
          </label>
        </div>

        <div className="result-card">
          <span className="muted">Projected maturity value</span>
          <strong className="result-number">{formatCurrency(result.futureValue)}</strong>
          <p>
            Invested amount {formatCurrency(result.investedAmount)} with expected gains of{' '}
            {formatCurrency(result.wealthGain)}.
          </p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Total invested</span>
              <strong>{formatCurrency(result.investedAmount)}</strong>
            </div>
            <div className="result-chip">
              <span>Estimated gain</span>
              <strong>{formatCurrency(result.wealthGain)}</strong>
            </div>
            <div className="result-chip">
              <span>Return multiple</span>
              <strong>{formatNumber(result.returnMultiple)}x</strong>
            </div>
            <div className="result-chip">
              <span>Final year SIP</span>
              <strong>{formatCurrency(result.finalMonthlyContribution)}</strong>
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
