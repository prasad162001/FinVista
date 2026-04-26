import { useState } from 'react'
import { AllocationChart } from '../../components/charts/AllocationChart'
import { NumericField } from '../../components/NumericField'
import { TrendChart } from '../../components/charts/TrendChart'
import { calculateExpenses } from '../../lib/calculators'
import { formatCurrency, formatPercent } from '../../lib/formatters'

const defaultCategories = [
  { id: 'school', label: 'School fees', amount: '0', budget: '0' },
  { id: 'petrol', label: 'Petrol / Diesel', amount: '7000', budget: '8000' },
  { id: 'gym', label: 'Gym', amount: '1800', budget: '2000' },
  { id: 'movies', label: 'Movies / Entertainment', amount: '3500', budget: '3000' },
  { id: 'food', label: 'Food / Groceries', amount: '14000', budget: '15000' },
  { id: 'utilities', label: 'Utilities', amount: '6500', budget: '7000' },
  { id: 'travel', label: 'Travel', amount: '4000', budget: '5000' },
  { id: 'misc', label: 'Miscellaneous', amount: '2500', budget: '3000' },
]

const initialState = {
  name: 'Monthly Family Budget',
  monthlyIncome: '95000',
}

export function ExpenseManager({ onSave, accessMode }) {
  const [form, setForm] = useState(initialState)
  const [categories, setCategories] = useState(defaultCategories)
  const [customName, setCustomName] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const result = calculateExpenses({
    monthlyIncome: form.monthlyIncome,
    categories,
  })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateCategory(id, field, value) {
    setCategories((current) =>
      current.map((category) => (category.id === id ? { ...category, [field]: value } : category)),
    )
  }

  function addCategory() {
    const label = customName.trim()
    if (!label) return

    setCategories((current) => [
      ...current,
      {
        id: `custom-${crypto.randomUUID()}`,
        label,
        amount: '0',
        budget: '0',
      },
    ])
    setCustomName('')
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await onSave({
        type: 'expenses',
        name: form.name,
        description: `Expense plan with monthly spend ${formatCurrency(result.totalMonthlyExpenses)} and income ${formatCurrency(Number(form.monthlyIncome) || 0)}`,
        inputs: {
          ...form,
          categories,
        },
        summary: result,
      })

      setMessage(accessMode === 'user' ? 'Expense plan saved to your account.' : 'Expense plan saved locally.')
    } catch (saveError) {
      setMessage(saveError.message || 'Unable to save this expense plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="calculator-header">
        <div>
          <h2>Personal Expense Manager</h2>
          <p>Track monthly expenses, custom categories, annual totals, and budget overages.</p>
        </div>
        <span className="badge">Budget control</span>
      </div>

      <div className="calculator-layout expense-layout">
        <div className="field-group">
          <div className="form-grid">
            <label className="field">
              <span>Plan name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <NumericField
              label="Monthly income"
              type="number"
              min="0"
              value={form.monthlyIncome}
              onChange={(event) => updateField('monthlyIncome', event.target.value)}
            />
          </div>

          <div className="category-editor">
            {categories.map((category) => (
              <div className="category-row" key={category.id}>
                <input
                  aria-label={`${category.label} category`}
                  value={category.label}
                  onChange={(event) => updateCategory(category.id, 'label', event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  aria-label={`${category.label} amount`}
                  value={category.amount === '' ? '' : String(category.amount)}
                  onChange={(event) => updateCategory(category.id, 'amount', event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  aria-label={`${category.label} budget`}
                  value={category.budget === '' ? '' : String(category.budget)}
                  onChange={(event) => updateCategory(category.id, 'budget', event.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="cta-row category-actions">
            <input
              className="category-add-input"
              placeholder="Add custom category"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
            />
            <button className="guest-button" type="button" onClick={addCategory}>
              Add category
            </button>
          </div>
        </div>

        <div className="result-card">
          <span className="muted">Monthly expense total</span>
          <strong className="result-number">{formatCurrency(result.totalMonthlyExpenses)}</strong>
          <p>
            Monthly surplus {formatCurrency(result.monthlySurplus)} with expense ratio {formatPercent(result.expenseRatio * 100)}.
          </p>

          <div className="result-grid">
            <div className="result-chip">
              <span>Annual expenses</span>
              <strong>{formatCurrency(result.totalAnnualExpenses)}</strong>
            </div>
            <div className="result-chip">
              <span>Annual surplus</span>
              <strong>{formatCurrency(result.annualSurplus)}</strong>
            </div>
            <div className="result-chip">
              <span>Over-budget buckets</span>
              <strong>{result.overBudgetCategories.length}</strong>
            </div>
            <div className="result-chip">
              <span>Income tracked</span>
              <strong>{formatCurrency(Number(form.monthlyIncome) || 0)}</strong>
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

      <div className="analytics-grid" style={{ marginTop: '24px' }}>
        <AllocationChart items={result.pieChart} title="Expense allocation" description="Where your monthly cash outflow is going by category." />
        <TrendChart items={result.barChart} title="Income vs expenses" description="Monthly comparison between income, expenses, and the remaining buffer." />
      </div>
    </section>
  )
}
