function toPositiveNumber(value, fallback = 0) {
  return Math.max(Number(value) || fallback, 0)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function buildYearlyGrowth({
  years,
  initialValue = 0,
  monthlyAddition = 0,
  monthlyRate = 0,
  annualRate = 0,
  stepUpRate = 0,
}) {
  const totalYears = Math.max(Math.round(years), 1)
  const points = []
  let value = initialValue
  let runningMonthlyAddition = monthlyAddition

  for (let year = 1; year <= totalYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      value = (value + runningMonthlyAddition) * (1 + monthlyRate)
    }

    if (annualRate > 0) {
      value *= 1 + annualRate
    }

    points.push({
      label: `Y${year}`,
      value,
    })

    runningMonthlyAddition *= 1 + stepUpRate
  }

  return points
}

export function calculateLoan({ amount, rate, years, extraPayment }) {
  const principal = toPositiveNumber(amount)
  const annualRate = toPositiveNumber(rate)
  const totalMonths = Math.max(Math.round(toPositiveNumber(years, 1) * 12), 1)
  const extra = toPositiveNumber(extraPayment)
  const monthlyRate = annualRate / 12 / 100

  const basePayment =
    monthlyRate === 0
      ? principal / totalMonths
      : (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -totalMonths)

  const monthlyPayment = basePayment + extra
  let balance = principal
  let totalInterest = 0
  let totalPayment = 0
  let payoffMonths = 0
  const schedule = []

  while (balance > 0.01 && payoffMonths < 1200) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate
    const payment = Math.min(monthlyPayment, balance + interest)
    const principalPaid = payment - interest

    balance -= principalPaid
    totalInterest += interest
    totalPayment += payment
    payoffMonths += 1

    if (schedule.length < 12) {
      schedule.push({
        month: payoffMonths,
        payment,
        principalPaid,
        interest,
        balance: Math.max(balance, 0),
      })
    }
  }

  const baselineTotal = basePayment * totalMonths
  const baselineInterest = baselineTotal - principal

  return {
    basePayment,
    monthlyPayment,
    totalInterest,
    totalPayment,
    payoffMonths,
    interestSaved: Math.max(baselineInterest - totalInterest, 0),
    schedule,
  }
}

export function calculateInsurance({ age, coverage, term, smoker, riders }) {
  const safeAge = Math.max(Number(age) || 18, 18)
  const safeCoverage = Math.max(Number(coverage) || 0, 100000)
  const safeTerm = Math.max(Number(term) || 5, 5)

  const coverageUnits = safeCoverage / 100000
  const ageFactor = 1 + Math.max(safeAge - 25, 0) * 0.028
  const termFactor = 1 + Math.max(safeTerm - 10, 0) * 0.018
  const smokerFactor = smoker === 'yes' ? 1.65 : 1

  const riderFactorMap = {
    none: 1,
    critical: 1.22,
    waiver: 1.12,
    combo: 1.3,
  }

  const riderFactor = riderFactorMap[riders] || 1
  const annualPremium = coverageUnits * 120 * ageFactor * termFactor * smokerFactor * riderFactor
  const monthlyPremium = annualPremium / 12
  const totalPolicyCost = annualPremium * safeTerm

  return {
    annualPremium,
    monthlyPremium,
    totalPolicyCost,
    riskScore: Math.min(9.8, 3.2 + (safeAge - 18) * 0.09 + (smoker === 'yes' ? 2 : 0.4)),
    coverageRatio: safeCoverage / 1000000,
    riderImpact: Math.max((riderFactor - 1) * 100, 0),
  }
}

export function calculateSip({ monthlyContribution, annualReturn, years, stepUp }) {
  const monthlyStart = toPositiveNumber(monthlyContribution)
  const expectedReturn = toPositiveNumber(annualReturn)
  const totalYears = Math.max(Number(years) || 1, 1)
  const yearlyStepUp = toPositiveNumber(stepUp) / 100
  const monthlyRate = expectedReturn / 12 / 100

  let futureValue = 0
  let investedAmount = 0
  let runningContribution = monthlyStart

  for (let year = 0; year < totalYears; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      futureValue = (futureValue + runningContribution) * (1 + monthlyRate)
      investedAmount += runningContribution
    }

    runningContribution *= 1 + yearlyStepUp
  }

  const finalMonthlyContribution = monthlyStart * (1 + yearlyStepUp) ** Math.max(totalYears - 1, 0)

  return {
    futureValue,
    investedAmount,
    wealthGain: futureValue - investedAmount,
    returnMultiple: investedAmount > 0 ? futureValue / investedAmount : 0,
    finalMonthlyContribution,
    growthChart: buildYearlyGrowth({
      years: totalYears,
      monthlyAddition: monthlyStart,
      monthlyRate,
      stepUpRate: yearlyStepUp,
    }),
  }
}

export function calculatePfVpf({
  monthlyContribution,
  employerContributionRate,
  interestRate,
  years,
  voluntaryContribution,
}) {
  const employeeMonthly = toPositiveNumber(monthlyContribution)
  const employerRate = toPositiveNumber(employerContributionRate) / 100
  const annualInterest = toPositiveNumber(interestRate) / 100
  const totalYears = Math.max(Math.round(toPositiveNumber(years, 1)), 1)
  const vpfMonthly = toPositiveNumber(voluntaryContribution)
  const employerMonthly = employeeMonthly * employerRate
  const totalMonthlyContribution = employeeMonthly + employerMonthly + vpfMonthly
  const monthlyRate = annualInterest / 12

  let maturityAmount = 0
  let employeeContribution = 0
  let employerContribution = 0
  let voluntaryContributionTotal = 0

  for (let month = 0; month < totalYears * 12; month += 1) {
    maturityAmount = (maturityAmount + totalMonthlyContribution) * (1 + monthlyRate)
    employeeContribution += employeeMonthly
    employerContribution += employerMonthly
    voluntaryContributionTotal += vpfMonthly
  }

  const totalContribution =
    employeeContribution + employerContribution + voluntaryContributionTotal

  return {
    maturityAmount,
    totalContribution,
    growthEarned: maturityAmount - totalContribution,
    employeeContribution,
    employerContribution,
    voluntaryContribution: voluntaryContributionTotal,
    totalMonthlyContribution,
    growthChart: buildYearlyGrowth({
      years: totalYears,
      monthlyAddition: totalMonthlyContribution,
      monthlyRate,
    }),
  }
}

export function calculateTermPlan({ age, annualPremium, sumAssured, policyTerm }) {
  const safeAge = Math.max(Number(age) || 18, 18)
  const premium = toPositiveNumber(annualPremium)
  const coverage = Math.max(Number(sumAssured) || 0, 100000)
  const term = Math.max(Number(policyTerm) || 5, 5)
  const coverageYears = Math.max(80 - safeAge, 5)
  const totalPremiumOutlay = premium * term
  const premiumToBenefitRatio = totalPremiumOutlay > 0 ? coverage / totalPremiumOutlay : 0
  const replacementYears = coverage / Math.max(premium, 1)

  return {
    monthlyPremium: premium / 12,
    annualPremium: premium,
    sumAssured: coverage,
    policyTerm: term,
    totalPremiumOutlay,
    coverageYears,
    premiumToBenefitRatio,
    replacementYears,
    comparisonChart: [
      { label: 'Annual premium', value: premium },
      { label: 'Monthly premium', value: premium / 12 },
      { label: 'Term benefit', value: coverage },
      { label: 'Total outlay', value: totalPremiumOutlay },
    ],
  }
}

export function calculateHealthInsurance({ age, premium, coverageAmount, familyMembers }) {
  const safeAge = Math.max(Number(age) || 18, 18)
  const annualPremium = toPositiveNumber(premium)
  const coverage = Math.max(Number(coverageAmount) || 0, 100000)
  const members = Math.max(Math.round(Number(familyMembers) || 1), 1)
  const ageLoad = 1 + Math.max(safeAge - 30, 0) * 0.015
  const adjustedCoverage = coverage * (1 + Math.max(members - 1, 0) * 0.28)
  const perMemberCover = adjustedCoverage / members
  const premiumEfficiency = adjustedCoverage / Math.max(annualPremium, 1)
  const hospitalizationBuffer = adjustedCoverage * ageLoad * 0.18

  return {
    annualPremium,
    monthlyPremium: annualPremium / 12,
    totalCoverage: adjustedCoverage,
    perMemberCover,
    premiumEfficiency,
    hospitalizationBuffer,
    comparisonChart: [
      { label: 'Premium', value: annualPremium },
      { label: 'Monthly equivalent', value: annualPremium / 12 },
      { label: 'Total coverage', value: adjustedCoverage },
      { label: 'Per member', value: perMemberCover },
    ],
  }
}

export function calculatePropertyInsurance({ propertyValue, premiumRate, coverageType }) {
  const value = Math.max(Number(propertyValue) || 0, 100000)
  const rate = toPositiveNumber(premiumRate) / 100
  const typeFactorMap = {
    basic: 0.75,
    standard: 0.9,
    comprehensive: 1,
  }
  const factor = typeFactorMap[coverageType] || 0.9
  const insuredValue = value * factor
  const annualPremium = insuredValue * rate
  const riskGap = Math.max(value - insuredValue, 0)

  return {
    propertyValue: value,
    insuredValue,
    annualPremium,
    monthlyPremium: annualPremium / 12,
    riskGap,
    coverageType,
    riskCoverageChart: [
      { label: 'Property value', value },
      { label: 'Insured value', value: insuredValue },
      { label: 'Risk gap', value: riskGap },
      { label: 'Annual premium', value: annualPremium },
    ],
  }
}

export function calculateTax({ income, deductions, exemptions, investments, regime }) {
  const annualIncome = toPositiveNumber(income)
  const deductionValue = toPositiveNumber(deductions)
  const exemptionValue = toPositiveNumber(exemptions)
  const investmentValue = toPositiveNumber(investments)
  const totalDeductions = deductionValue + exemptionValue + investmentValue
  const taxableIncome = Math.max(annualIncome - totalDeductions, 0)

  const slabs =
    regime === 'old'
      ? [
          { limit: 250000, rate: 0 },
          { limit: 500000, rate: 0.05 },
          { limit: 1000000, rate: 0.2 },
          { limit: Infinity, rate: 0.3 },
        ]
      : [
          { limit: 300000, rate: 0 },
          { limit: 700000, rate: 0.05 },
          { limit: 1000000, rate: 0.1 },
          { limit: 1200000, rate: 0.15 },
          { limit: 1500000, rate: 0.2 },
          { limit: Infinity, rate: 0.3 },
        ]

  let taxLiability = 0
  let previousLimit = 0

  for (const slab of slabs) {
    if (taxableIncome <= previousLimit) break
    const taxableSlice = Math.min(taxableIncome, slab.limit) - previousLimit
    taxLiability += taxableSlice * slab.rate
    previousLimit = slab.limit
  }

  const cess = taxLiability * 0.04
  const totalTax = taxLiability + cess
  const savingsFromDeductions = Math.min(totalDeductions * 0.2, totalTax)

  return {
    taxableIncome,
    taxLiability: totalTax,
    preCessTax: taxLiability,
    cess,
    totalDeductions,
    savingsFromDeductions,
    monthlyTaxProvision: totalTax / 12,
    chart: [
      { label: 'Income', value: annualIncome },
      { label: 'Deductions', value: totalDeductions },
      { label: 'Taxable', value: taxableIncome },
      { label: 'Tax', value: totalTax },
    ],
  }
}

export function calculateExpenses({ monthlyIncome, categories }) {
  const income = toPositiveNumber(monthlyIncome)
  const cleanCategories = (categories || []).map((category) => {
    const amount = toPositiveNumber(category.amount)
    const budget = toPositiveNumber(category.budget)
    return {
      ...category,
      amount,
      budget,
      annualAmount: amount * 12,
      overBudget: budget > 0 ? amount > budget : false,
    }
  })

  const totalMonthlyExpenses = cleanCategories.reduce((sum, category) => sum + category.amount, 0)
  const totalAnnualExpenses = totalMonthlyExpenses * 12
  const monthlySurplus = income - totalMonthlyExpenses
  const annualSurplus = monthlySurplus * 12
  const expenseRatio = income > 0 ? totalMonthlyExpenses / income : 0

  return {
    totalMonthlyExpenses,
    totalAnnualExpenses,
    monthlySurplus,
    annualSurplus,
    expenseRatio,
    categories: cleanCategories,
    overBudgetCategories: cleanCategories.filter((category) => category.overBudget),
    pieChart: cleanCategories.map((category, index) => ({
      label: category.label,
      value: category.amount,
      color: ['#f28a54', '#2c6e91', '#1c8b6f', '#7c5cff', '#d6a13f', '#c05876', '#4f86f7', '#75995d'][index % 8],
    })),
    barChart: [
      { label: 'Income', value: income },
      { label: 'Expenses', value: totalMonthlyExpenses },
      { label: 'Surplus', value: Math.max(monthlySurplus, 0) },
      { label: 'Deficit', value: Math.max(-monthlySurplus, 0) },
    ],
  }
}

export function calculateScenarioComparison(baseSummary, scenario) {
  const debtAdjustment = 1 + toPositiveNumber(scenario.loanChangePercent) / 100
  const investmentLift = 1 + toPositiveNumber(scenario.pfIncreasePercent) / 100
  const insuranceLift = 1 + toPositiveNumber(scenario.insurancePremiumPercent) / 100
  const expenseReduction = 1 - clamp(toPositiveNumber(scenario.expenseReductionPercent) / 100, 0, 0.95)

  const projected = {
    ...baseSummary,
    monthlyDebt: baseSummary.monthlyDebt * debtAdjustment,
    monthlyInvestments: baseSummary.monthlyInvestments * investmentLift,
    projectedWealth: baseSummary.projectedWealth * investmentLift,
    monthlyInsurance: baseSummary.monthlyInsurance * insuranceLift,
    monthlyExpenses: baseSummary.monthlyExpenses * expenseReduction,
    expenseTotal: baseSummary.expenseTotal * expenseReduction,
  }

  projected.monthlyCommitment =
    projected.monthlyDebt +
    projected.monthlyInvestments +
    projected.monthlyInsurance +
    projected.monthlyTaxes +
    projected.monthlyExpenses

  projected.surplus =
    baseSummary.monthlyIncome > 0
      ? baseSummary.monthlyIncome - projected.monthlyCommitment
      : baseSummary.surplus

  return projected
}
