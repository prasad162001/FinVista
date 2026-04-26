export function calculateLoan({ amount, rate, years, extraPayment }) {
  const principal = Math.max(Number(amount) || 0, 0)
  const annualRate = Math.max(Number(rate) || 0, 0)
  const totalMonths = Math.max(Math.round((Number(years) || 0) * 12), 1)
  const extra = Math.max(Number(extraPayment) || 0, 0)
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
  const monthlyStart = Math.max(Number(monthlyContribution) || 0, 0)
  const expectedReturn = Math.max(Number(annualReturn) || 0, 0)
  const totalYears = Math.max(Number(years) || 1, 1)
  const yearlyStepUp = Math.max(Number(stepUp) || 0, 0) / 100
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
  }
}
