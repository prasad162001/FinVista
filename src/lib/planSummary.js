export function summarizePlans(plans) {
  const summary = {
    totalPlans: plans.length,
    loanPlans: 0,
    insurancePlans: 0,
    sipPlans: 0,
    monthlyCommitment: 0,
    projectedWealth: 0,
    protectionCover: 0,
    payoffSavings: 0,
  }

  plans.forEach((plan) => {
    if (plan.type === 'loan') {
      summary.loanPlans += 1
      summary.monthlyCommitment += Number(plan.summary?.monthlyPayment) || 0
      summary.payoffSavings += Number(plan.summary?.interestSaved) || 0
    }

    if (plan.type === 'insurance') {
      summary.insurancePlans += 1
      summary.monthlyCommitment += Number(plan.summary?.monthlyPremium) || 0
      summary.protectionCover += Number(plan.inputs?.coverage) || 0
    }

    if (plan.type === 'sip') {
      summary.sipPlans += 1
      summary.monthlyCommitment += Number(plan.inputs?.monthlyContribution) || 0
      summary.projectedWealth += Number(plan.summary?.futureValue) || 0
    }
  })

  return summary
}

export function buildAllocation(plans) {
  const allocation = [
    { label: 'Loans', value: 0, color: '#f28a54' },
    { label: 'Insurance', value: 0, color: '#2c6e91' },
    { label: 'SIP', value: 0, color: '#1c8b6f' },
  ]

  plans.forEach((plan) => {
    if (plan.type === 'loan') allocation[0].value += Number(plan.summary?.monthlyPayment) || 0
    if (plan.type === 'insurance') allocation[1].value += Number(plan.summary?.monthlyPremium) || 0
    if (plan.type === 'sip') allocation[2].value += Number(plan.inputs?.monthlyContribution) || 0
  })

  return allocation
}

export function buildTrendSeries(plans) {
  const monthlyTotal = plans.reduce((sum, plan) => {
    if (plan.type === 'loan') return sum + (Number(plan.summary?.monthlyPayment) || 0)
    if (plan.type === 'insurance') return sum + (Number(plan.summary?.monthlyPremium) || 0)
    if (plan.type === 'sip') return sum + (Number(plan.inputs?.monthlyContribution) || 0)
    return sum
  }, 0)

  return [
    { label: 'Q1', value: monthlyTotal * 0.82 },
    { label: 'Q2', value: monthlyTotal * 0.9 },
    { label: 'Q3', value: monthlyTotal * 1.03 },
    { label: 'Q4', value: monthlyTotal * 1.14 },
  ]
}
