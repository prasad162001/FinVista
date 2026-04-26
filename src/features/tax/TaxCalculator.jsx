import { useState } from 'react'
import { NumericField } from '../../components/NumericField'
import { TrendChart } from '../../components/charts/TrendChart'
import { calculateTax } from '../../lib/calculators'
import { formatCurrency } from '../../lib/formatters'
import { updateNumericField } from '../../lib/formNumbers'

const initialState = {
  name: 'Annual Tax Plan',
  income: '1800000',
  deductions: '150000',
  exemptions: '50000',
  investments: '120000',
  regime: 'old',
}

export function TaxCalculator({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const result = calculateTax(form)
  const updateIncome = updateNumericField(setForm, 'income')
  const updateDeductions = updateNumericField(setForm, 'deductions')
  const updateExemptions = updateNumericField(setForm, 'exemptions')
  const updateInvestments = updateNumericField(setForm, 'investments')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'tax',
        name: form.name,
        description: `Tax plan for annual income ${formatCurrency(Number(form.income) || 0)} under the ${form.regime} regime`,
        inputs: form,
        summary: result,
      })

      setMessage(accessMode === 'user' ? 'Tax plan saved to your account.' : 'Tax plan saved locally.')
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this tax plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Tax Calculator</h2>
          <p>Estimate taxable income, yearly liability, and savings unlocked through deductions.</p>
        </div>
        <span className="badge">Tax planning</span>
      </div>

      <div className="calculator-layout">
        <div className="field-group">
          <div className="form-grid">
            <label className="field">
              <span>Plan name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <NumericField label="Annual income" type="number" min="0" value={form.income} onChange={updateIncome} />
            <NumericField label="Deductions" type="number" min="0" value={form.deductions} onChange={updateDeductions} />
            <NumericField label="Exemptions" type="number" min="0" value={form.exemptions} onChange={updateExemptions} />
            <NumericField label="Investments (PF, insurance, etc.)" type="number" min="0" value={form.investments} onChange={updateInvestments} />
            <label className="field">
              <span>Tax regime</span>
              <select value={form.regime} onChange={(event) => updateField('regime', event.target.value)}>
                <option value="old">Old regime</option>
                <option value="new">New regime</option>
              </select>
            </label>
          </div>
        </div>

        <div className="result-card">
          <span className="muted">Estimated tax liability</span>
          <strong className="result-number">{formatCurrency(result.taxLiability)}</strong>
          <p>Monthly tax provision of {formatCurrency(result.monthlyTaxProvision)} after deductions and cess.</p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Taxable income</span>
              <strong>{formatCurrency(result.taxableIncome)}</strong>
            </div>
            <div className="result-chip">
              <span>Total deductions</span>
              <strong>{formatCurrency(result.totalDeductions)}</strong>
            </div>
            <div className="result-chip">
              <span>Savings from deductions</span>
              <strong>{formatCurrency(result.savingsFromDeductions)}</strong>
            </div>
            <div className="result-chip">
              <span>Health and education cess</span>
              <strong>{formatCurrency(result.cess)}</strong>
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
        <TrendChart items={result.chart} title="Tax position chart" description="A quick view of annual income, deductions, taxable income, and final tax." />
      </div>
    </section>
  )
}
