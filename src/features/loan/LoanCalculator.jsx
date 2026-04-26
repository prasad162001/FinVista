import { useState } from 'react'
import { calculateLoan } from '../../lib/calculators'
import { formatCurrency, formatNumber } from '../../lib/formatters'

const initialState = {
  name: 'Home Loan Plan',
  amount: 4500000,
  rate: 8.6,
  years: 20,
  extraPayment: 2500,
}

export function LoanCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const result = calculateLoan(form)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'loan',
        name: form.name,
        description: `Loan plan for ${formatCurrency(form.amount)} over ${form.years} years`,
        inputs: form,
        summary: result,
      })

      setMessage(
        accessMode === 'user'
          ? 'Loan plan saved to your FinVista account.'
          : 'Loan plan saved locally in guest mode.',
      )
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this loan plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Loan Calculator</h2>
          <p>Estimate EMI, payoff term, total interest, and repayment savings.</p>
        </div>
        <span className="badge">EMI planning</span>
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
              <span>Loan amount</span>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(event) => updateField('amount', Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Interest rate (%)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.rate}
                onChange={(event) => updateField('rate', Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Loan term (years)</span>
              <input
                type="number"
                min="1"
                value={form.years}
                onChange={(event) => updateField('years', Number(event.target.value))}
              />
            </label>
          </div>

          <label className="field">
            <span>Extra monthly payment</span>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={form.extraPayment}
              onChange={(event) => updateField('extraPayment', Number(event.target.value))}
            />
            <input
              type="number"
              min="0"
              step="500"
              value={form.extraPayment}
              onChange={(event) => updateField('extraPayment', Number(event.target.value))}
            />
            <small>Speed up payoff and reduce total interest.</small>
          </label>
        </div>

        <div className="result-card">
          <span className="muted">Estimated monthly payment</span>
          <strong className="result-number">{formatCurrency(result.monthlyPayment)}</strong>
          <p>
            Base EMI {formatCurrency(result.basePayment)} with extra payment of{' '}
            {formatCurrency(form.extraPayment)}.
          </p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Total interest</span>
              <strong>{formatCurrency(result.totalInterest)}</strong>
            </div>
            <div className="result-chip">
              <span>Total repayment</span>
              <strong>{formatCurrency(result.totalPayment)}</strong>
            </div>
            <div className="result-chip">
              <span>Payoff time</span>
              <strong>{result.payoffMonths} months</strong>
            </div>
            <div className="result-chip">
              <span>Interest saved</span>
              <strong>{formatCurrency(result.interestSaved)}</strong>
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

      <div className="table-wrap" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Payment</th>
              <th>Principal</th>
              <th>Interest</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {result.schedule.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatCurrency(row.payment)}</td>
                <td>{formatCurrency(row.principalPaid)}</td>
                <td>{formatCurrency(row.interest)}</td>
                <td>{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: '16px' }}>
        Total timeline: {formatNumber(result.payoffMonths / 12)} years with your selected
        repayment pace.
      </p>
    </section>
  )
}
