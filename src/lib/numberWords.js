const SMALL_NUMBERS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function formatBelowThousand(value) {
  const whole = Math.trunc(Math.abs(value))

  if (whole < 20) return SMALL_NUMBERS[whole]

  if (whole < 100) {
    const tens = Math.trunc(whole / 10)
    const remainder = whole % 10
    return remainder ? `${TENS[tens]}-${SMALL_NUMBERS[remainder]}` : TENS[tens]
  }

  const hundreds = Math.trunc(whole / 100)
  const remainder = whole % 100
  return remainder
    ? `${SMALL_NUMBERS[hundreds]} hundred ${formatBelowThousand(remainder)}`
    : `${SMALL_NUMBERS[hundreds]} hundred`
}

function formatIndianInteger(value) {
  const whole = Math.trunc(Math.abs(value))

  if (whole < 1000) return formatBelowThousand(whole)

  if (whole < 100000) {
    const thousands = Math.trunc(whole / 1000)
    const remainder = whole % 1000
    return remainder
      ? `${formatBelowThousand(thousands)} thousand ${formatBelowThousand(remainder)}`
      : `${formatBelowThousand(thousands)} thousand`
  }

  if (whole < 10000000) {
    const lakhs = Math.trunc(whole / 100000)
    const remainder = whole % 100000
    return remainder
      ? `${formatIndianInteger(lakhs)} lakh ${formatIndianInteger(remainder)}`
      : `${formatIndianInteger(lakhs)} lakh`
  }

  const crores = Math.trunc(whole / 10000000)
  const remainder = whole % 10000000
  return remainder
    ? `${formatIndianInteger(crores)} crore ${formatIndianInteger(remainder)}`
    : `${formatIndianInteger(crores)} crore`
}

function formatDecimalPortion(value) {
  const decimalText = String(value).split('.')[1]
  if (!decimalText) return ''

  const trimmed = decimalText.replace(/0+$/, '')
  if (!trimmed) return ''

  return `point ${trimmed
    .split('')
    .map((digit) => SMALL_NUMBERS[Number(digit)])
    .join(' ')}`
}

export function numberToWords(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return ''
  if (numericValue === 0) return 'zero'

  const absoluteValue = Math.abs(numericValue)
  const wholePart = Math.trunc(absoluteValue)
  const decimalPart = formatDecimalPortion(absoluteValue)
  const integerWords = formatIndianInteger(wholePart)

  const prefix = numericValue < 0 ? 'minus ' : ''
  return `${prefix}${integerWords}${decimalPart ? ` ${decimalPart}` : ''}`.trim()
}

export function formatNumberWords(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || String(value).trim() === '') {
    return ''
  }

  return numberToWords(numericValue)
}
