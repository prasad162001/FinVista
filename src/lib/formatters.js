import { formatNumberWords } from './numberWords.js'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const indianCompactScales = [
  { value: 10000000, label: 'crore' },
  { value: 100000, label: 'lakh' },
]

function trimTrailingZeros(value) {
  return value.replace(/\.0+$|(\.\d*[1-9])0+$/, '$1')
}

export function formatCurrency(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPercent(value, digits = 1) {
  return `${formatNumber(value, digits)}%`
}

export function formatCompactCurrency(value) {
  const safeValue = Number.isFinite(value) ? value : 0

  const absoluteValue = Math.abs(safeValue)
  const sign = safeValue < 0 ? '-' : ''

  for (const scale of indianCompactScales) {
    if (absoluteValue >= scale.value) {
      const digits = absoluteValue >= scale.value * 10 ? 1 : 2
      const compactValue = trimTrailingZeros((absoluteValue / scale.value).toFixed(digits))
      return `${sign}₹${compactValue} ${scale.label}`
    }
  }

  return `${sign}${formatCurrency(absoluteValue)}`
}

export function formatCurrencyWithWords(value) {
  const safeValue = Number.isFinite(value) ? value : 0
  const words = formatNumberWords(safeValue)

  return words ? `${formatCurrency(safeValue)} (${words})` : formatCurrency(safeValue)
}
