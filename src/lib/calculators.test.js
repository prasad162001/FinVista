import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateInsurance, calculateLoan, calculateSip } from './calculators.js'
import { buildAllocation, buildTrendSeries, summarizePlans } from './planSummary.js'

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

test('calculateLoan handles zero interest loans', () => {
  const result = calculateLoan({
    amount: 120000,
    rate: 0,
    years: 1,
    extraPayment: 0,
  })

  assert.equal(Math.round(result.basePayment), 10000)
  assert.equal(Math.round(result.totalInterest), 0)
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

test('calculateSip projects future value above invested amount', () => {
  const result = calculateSip({
    monthlyContribution: 5000,
    annualReturn: 12,
    years: 10,
    stepUp: 5,
  })

  assert.ok(result.futureValue > result.investedAmount)
  assert.ok(result.wealthGain > 0)
  assert.ok(result.finalMonthlyContribution > 5000)
})

test('plan summaries aggregate financial totals correctly', () => {
  const plans = [
    {
      type: 'loan',
      summary: { monthlyPayment: 15000, interestSaved: 250000 },
      inputs: {},
    },
    {
      type: 'insurance',
      summary: { monthlyPremium: 1200 },
      inputs: { coverage: 10000000 },
    },
    {
      type: 'sip',
      summary: { futureValue: 2200000 },
      inputs: { monthlyContribution: 8000 },
    },
  ]

  const summary = summarizePlans(plans)
  const allocation = buildAllocation(plans)
  const trend = buildTrendSeries(plans)

  assert.equal(summary.monthlyCommitment, 24200)
  assert.equal(summary.projectedWealth, 2200000)
  assert.equal(summary.protectionCover, 10000000)
  assert.equal(summary.payoffSavings, 250000)
  assert.equal(allocation[0].value, 15000)
  assert.equal(allocation[1].value, 1200)
  assert.equal(allocation[2].value, 8000)
  assert.equal(trend.length, 4)
})
