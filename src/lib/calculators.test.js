import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateExpenses,
  calculateHealthInsurance,
  calculateInsurance,
  calculateLoan,
  calculatePfVpf,
  calculatePropertyInsurance,
  calculateSip,
  calculateTax,
  calculateTermPlan,
} from './calculators.js'
import {
  buildAllocation,
  buildAlerts,
  buildFinancialSnapshot,
  buildTrendSeries,
  summarizePlans,
} from './planSummary.js'
import { formatNumberWords } from './numberWords.js'

test('calculateLoan returns expected amortization summary', () => {
  const result = calculateLoan({
    amount: 1000000,
    rate: 10,
    years: 10,
    extraPayment: 2000,
  })

  assert.ok(result.monthlyPayment > result.basePayment)
  assert.ok(result.totalInterest > 0)
  assert.ok(result.payoffMonths < 120)
  assert.equal(result.schedule.length, 12)
})

test('calculateInsurance increases price for smoker and riders', () => {
  const standard = calculateInsurance({
    age: 30,
    coverage: 5000000,
    term: 20,
    smoker: 'no',
    riders: 'none',
  })

  const premium = calculateInsurance({
    age: 30,
    coverage: 5000000,
    term: 20,
    smoker: 'yes',
    riders: 'combo',
  })

  assert.ok(premium.monthlyPremium > standard.monthlyPremium)
  assert.ok(premium.riderImpact > 0)
})

test('calculateSip and PF/VPF project long-term growth', () => {
  const sip = calculateSip({
    monthlyContribution: 5000,
    annualReturn: 12,
    years: 10,
    stepUp: 5,
  })

  const pf = calculatePfVpf({
    monthlyContribution: 18000,
    employerContributionRate: 12,
    interestRate: 8.15,
    years: 15,
    voluntaryContribution: 3000,
  })

  assert.ok(sip.futureValue > sip.investedAmount)
  assert.ok(sip.growthChart.length === 10)
  assert.ok(pf.maturityAmount > pf.totalContribution)
  assert.ok(pf.growthChart.length === 15)
})

test('term, health, property, and tax calculators return usable summaries', () => {
  const term = calculateTermPlan({
    age: 32,
    annualPremium: 20000,
    sumAssured: 10000000,
    policyTerm: 25,
  })
  const health = calculateHealthInsurance({
    age: 35,
    premium: 24000,
    coverageAmount: 1000000,
    familyMembers: 4,
  })
  const property = calculatePropertyInsurance({
    propertyValue: 8000000,
    premiumRate: 0.4,
    coverageType: 'comprehensive',
  })
  const tax = calculateTax({
    income: 1800000,
    deductions: 150000,
    exemptions: 50000,
    investments: 120000,
    regime: 'old',
  })

  assert.ok(term.totalPremiumOutlay > term.annualPremium)
  assert.ok(health.totalCoverage > 0)
  assert.ok(property.insuredValue <= property.propertyValue)
  assert.ok(tax.taxableIncome < 1800000)
  assert.ok(tax.taxLiability > 0)
})

test('expense calculator returns surplus, charts, and budget alerts', () => {
  const result = calculateExpenses({
    monthlyIncome: 100000,
    categories: [
      { label: 'Food', amount: 12000, budget: 10000 },
      { label: 'Travel', amount: 5000, budget: 6000 },
    ],
  })

  assert.equal(result.totalMonthlyExpenses, 17000)
  assert.equal(result.monthlySurplus, 83000)
  assert.equal(result.overBudgetCategories.length, 1)
  assert.equal(result.pieChart.length, 2)
})

test('plan summaries aggregate new financial totals correctly', () => {
  const plans = [
    {
      type: 'loan',
      summary: { monthlyPayment: 15000, interestSaved: 250000 },
      inputs: { dueDay: 25 },
      name: 'Home loan',
    },
    {
      type: 'term-plan',
      summary: { monthlyPremium: 1800, sumAssured: 10000000 },
      inputs: { premiumDueDay: 24 },
      name: 'Life cover',
    },
    {
      type: 'sip',
      summary: { futureValue: 2200000 },
      inputs: { monthlyContribution: 8000 },
      name: 'SIP',
    },
    {
      type: 'pf-vpf',
      summary: { maturityAmount: 9000000, totalMonthlyContribution: 25200 },
      inputs: { contributionDay: 24 },
      name: 'PF',
    },
    {
      type: 'tax',
      summary: { taxLiability: 180000, savingsFromDeductions: 40000, monthlyTaxProvision: 15000 },
      inputs: {},
      name: 'Tax',
    },
    {
      type: 'expenses',
      summary: {
        totalMonthlyExpenses: 30000,
        totalAnnualExpenses: 360000,
        monthlySurplus: 12000,
        overBudgetCategories: [{ label: 'Food', amount: 15000, budget: 10000 }],
      },
      inputs: { monthlyIncome: 90000 },
      name: 'Budget',
    },
  ]

  const summary = summarizePlans(plans)
  const allocation = buildAllocation(plans)
  const snapshot = buildFinancialSnapshot(summary)
  const trend = buildTrendSeries(plans)
  const alerts = buildAlerts(plans, new Date('2026-04-24T10:00:00+05:30'))

  assert.equal(summary.monthlyCommitment, 95000)
  assert.equal(summary.projectedWealth, 11200000)
  assert.equal(summary.protectionCover, 10000000)
  assert.equal(summary.taxLiability, 180000)
  assert.equal(summary.expenseTotal, 30000)
  assert.ok(summary.netWorthEstimate > 0)
  assert.ok(summary.healthScore >= 0)
  assert.equal(allocation.length, 5)
  assert.equal(snapshot[0].label, 'Net worth')
  assert.equal(trend.length, 4)
  assert.ok(alerts.length >= 3)
})

test('number word formatting stays in indian financial language', () => {
  assert.equal(formatNumberWords(100000), 'one lakh')
  assert.equal(formatNumberWords(1000000), 'ten lakh')
  assert.equal(formatNumberWords(4500000), 'forty-five lakh')
  assert.equal(formatNumberWords(12500), 'twelve thousand five hundred')
})
