export function asInputNumber(value) {
  return value === '' ? '' : String(value)
}

export function updateNumericField(setter, field) {
  return (event) => {
    setter((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }
}
