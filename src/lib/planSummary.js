import { formatCurrency } from './formatters.js'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

const allocationPalette = [
  ['Loans', '#f28a54'],
  ['Insurance', '#2c6e91'],
  ['Investments', '#1c8b6f'],
  ['Taxes', '#7c5cff'],
  ['Expenses', '#d46b3f'],
]

function createEmptySummary() {
  return {
    totalPlans: 0,
    loanPlans: 0,
    insurancePlans: 0,
    sipPlans: 0,
    pfPlans: 0,
    termPlans: 0,
    healthPlans: 0,
    propertyPlans: 0,
    taxPlans: 0,
    expensePlans: 0,
    monthlyCommitment: 0,
    monthlyDebt: 0,
    monthlyInsurance: 0,
    monthlyInvestments: 0,
    monthlyTaxes: 0,
    monthlyExpenses: 0,
    monthlyIncome: 0,
    annualExpenses: 0,
    projectedWealth: 0,
    protectionCover: 0,
    payoffSavings: 0,
    taxLiability: 0,
    taxSavings: 0,
    expenseTotal: 0,
    surplus: 0,
    savingsRate: 0,
    debtRatio: 0,
    healthScore: 0,
    netWorthEstimate: 0,
  }
}

export function summarizePlans(plans) {
  const summary = createEmptySummary()

  plans.forEach((plan) => {
    summary.totalPlans += 1

    switch (plan.type) {
      case 'loan':
        summary.loanPlans += 1
        summary.monthlyDebt += Number(plan.summary?.monthlyPayment) || 0
        summary.payoffSavings += Number(plan.summary?.interestSaved) || 0
        break
      case 'insurance':
        summary.insurancePlans += 1
        summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
        summary.protectionCover += Number(plan.inputs?.coverage) || 0
        break
      case 'sip':
        summary.sipPlans += 1
        summary.monthlyInvestments += Number(plan.inputs?.monthlyContribution) || 0
        summary.projectedWealth += Number(plan.summary?.futureValue) || 0
        break
      case 'pf-vpf':
        summary.pfPlans += 1
        summary.monthlyInvestments += Number(plan.summary?.totalMonthlyContribution) || 0
        summary.projectedWealth += Number(plan.summary?.maturityAmount) || 0
        break
      case 'term-plan':
        summary.termPlans += 1
        summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
        summary.protectionCover += Number(plan.summary?.sumAssured) || Number(plan.inputs?.sumAssured) || 0
        break
      case 'health-insurance':
        summary.healthPlans += 1
        summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
        summary.protectionCover += Number(plan.summary?.totalCoverage) || 0
        break
      case 'property-insurance':
        summary.propertyPlans += 1
        summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
        summary.protectionCover += Number(plan.summary?.insuredValue) || 0
        break
      case 'tax':
        summary.taxPlans += 1
        summary.monthlyTaxes += Number(plan.summary?.monthlyTaxProvision) || 0
        summary.taxLiability += Number(plan.summary?.taxLiability) || 0
        summary.taxSavings += Number(plan.summary?.savingsFromDeductions) || 0
        break
      case 'expenses':
        summary.expensePlans += 1
        summary.monthlyExpenses += Number(plan.summary?.totalMonthlyExpenses) || 0
        summary.expenseTotal += Number(plan.summary?.totalMonthlyExpenses) || 0
        summary.annualExpenses += Number(plan.summary?.totalAnnualExpenses) || 0
        summary.monthlyIncome = Math.max(summary.monthlyIncome, Number(plan.inputs?.monthlyIncome) || 0)
        summary.surplus = Number(plan.summary?.monthlySurplus) || summary.surplus
        break
      default:
        break
    }
  })

  summary.monthlyCommitment =
    summary.monthlyDebt +
    summary.monthlyInsurance +
    summary.monthlyInvestments +
    summary.monthlyTaxes +
    summary.monthlyExpenses

  if (summary.monthlyIncome > 0) {
    summary.surplus = summary.monthlyIncome - summary.monthlyCommitment
    summary.savingsRate = summary.monthlyInvestments / summary.monthlyIncome
    summary.debtRatio = summary.monthlyDebt / summary.monthlyIncome
  } else {
    summary.savingsRate = summary.monthlyCommitment > 0 ? summary.monthlyInvestments / summary.monthlyCommitment : 0
    summary.debtRatio = summary.monthlyCommitment > 0 ? summary.monthlyDebt / summary.monthlyCommitment : 0
  }

  const annualIncome = summary.monthlyIncome * 12
  const debtComponent = clamp((1 - summary.debtRatio / 0.4) * 25, 0, 25)
  const savingsComponent = clamp((summary.savingsRate / 0.2) * 25, 0, 25)
  const coverageBase = annualIncome > 0 ? annualIncome * 10 : Math.max(summary.monthlyCommitment * 120, 1)
  const coverageComponent = clamp((summary.protectionCover / coverageBase) * 25, 0, 25)
  const expenseComponent =
    summary.monthlyIncome > 0
      ? clamp(((summary.surplus / summary.monthlyIncome) + 0.1) * 100, 0, 25)
      : clamp(summary.surplus > 0 ? 20 : 5, 0, 25)

  summary.healthScore = Math.round(
    debtComponent + savingsComponent + coverageComponent + expenseComponent,
  )
  summary.netWorthEstimate =
    summary.projectedWealth +
    Math.max(summary.surplus, 0) * 12 +
    summary.monthlyInvestments * 12 -
    summary.monthlyDebt * 12

  return summary
}

export function buildAllocation(plans) {
  const buckets = allocationPalette.map(([label, color]) => ({
    label,
    value: 0,
    color,
  }))

  plans.forEach((plan) => {
    if (plan.type === 'loan') buckets[0].value += Number(plan.summary?.monthlyPayment) || 0

    if (['insurance', 'term-plan', 'health-insurance', 'property-insurance'].includes(plan.type)) {
      buckets[1].value += Number(plan.summary?.monthlyPremium) || 0
    }

    if (['sip', 'pf-vpf'].includes(plan.type)) {
      buckets[2].value +=
        Number(plan.inputs?.monthlyContribution) ||
        Number(plan.summary?.totalMonthlyContribution) ||
        0
    }

    if (plan.type === 'tax') buckets[3].value += Number(plan.summary?.monthlyTaxProvision) || 0
    if (plan.type === 'expenses') buckets[4].value += Number(plan.summary?.totalMonthlyExpenses) || 0
  })

  return buckets
}

export function buildTrendSeries(plans) {
  const summary = summarizePlans(plans)
  const monthlyTotal = summary.monthlyCommitment
  const wealthMomentum = summary.projectedWealth > 0 ? Math.min(summary.projectedWealth / 10000000, 0.24) : 0
  const taxPressure = summary.monthlyTaxes > 0 ? 0.03 : 0

  return [
    { label: 'Q1', value: monthlyTotal * (0.84 + taxPressure) },
    { label: 'Q2', value: monthlyTotal * (0.92 + wealthMomentum * 0.4) },
    { label: 'Q3', value: monthlyTotal * (1 + wealthMomentum * 0.7) },
    { label: 'Q4', value: monthlyTotal * (1.12 + wealthMomentum) },
  ]
}

export function buildFinancialSnapshot(summary) {
  return [
    { label: 'Net worth', value: summary.netWorthEstimate, detail: 'Estimated from investments, surplus runway, and debt load.' },
    { label: 'Monthly surplus / deficit', value: summary.surplus, detail: 'Remaining cash after debt, insurance, tax, and expenses.' },
    { label: 'Insurance cover', value: summary.protectionCover, detail: 'Combined protection across life, health, and property plans.' },
    { label: 'Tax liability', value: summary.taxLiability, detail: 'Estimated annual tax burden across saved tax plans.' },
    { label: 'Savings / Investments', value: summary.monthlyInvestments, detail: 'Recurring PF and SIP commitments building future wealth.' },
    { label: 'Personal expenses', value: summary.expenseTotal, detail: 'Current monthly spend from your tracked household budget.' },
  ]
}

export function buildAlerts(plans, now = new Date()) {
  const alerts = []
  const day = now.getDate()

  plans.forEach((plan) => {
    if (plan.type === 'loan' && Number(plan.inputs?.dueDay) > 0) {
      const dueDay = Number(plan.inputs.dueDay)
      if (Math.abs(dueDay - day) <= 3) {
        alerts.push({
          severity: 'warning',
          title: `${plan.name} EMI due soon`,
          detail: `Your EMI reminder is set for day ${dueDay} of each month.`,
        })
      }
    }

    if (plan.type === 'pf-vpf' && Number(plan.inputs?.contributionDay) > 0) {
      const contributionDay = Number(plan.inputs.contributionDay)
      if (Math.abs(contributionDay - day) <= 3) {
        alerts.push({
          severity: 'info',
          title: `${plan.name} contribution check-in`,
          detail: `PF/VPF contribution is due around day ${contributionDay}.`,
        })
      }
    }

    if (
      ['insurance', 'term-plan', 'health-insurance', 'property-insurance'].includes(plan.type) &&
      Number(plan.inputs?.premiumDueDay) > 0
    ) {
      const premiumDueDay = Number(plan.inputs.premiumDueDay)
      if (Math.abs(premiumDueDay - day) <= 5) {
        alerts.push({
          severity: 'warning',
          title: `${plan.name} premium reminder`,
          detail: `Premium payment is expected around day ${premiumDueDay}.`,
        })
      }
    }

    if (plan.type === 'tax') {
      alerts.push({
        severity: 'info',
        title: `${plan.name} tax filing watch`,
        detail: 'Keep an eye on quarterly advance tax and annual filing timelines.',
      })
    }

    if (plan.type === 'expenses' && Array.isArray(plan.summary?.overBudgetCategories)) {
      plan.summary.overBudgetCategories.forEach((category) => {
        alerts.push({
          severity: 'danger',
          title: `${category.label} budget exceeded`,
          detail: `Spending is above budget by ${formatCurrency(Math.max(category.amount - category.budget, 0))}.`,
        })
      })
    }
  })

  return alerts.slice(0, 6)
}
