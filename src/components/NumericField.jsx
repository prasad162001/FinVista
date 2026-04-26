import { asInputNumber } from '../lib/formNumbers'
import { formatNumberWords } from '../lib/numberWords'

export function NumericField({
  label,
  value,
  onChange,
  help,
  id,
  ...inputProps
}) {
  const words = formatNumberWords(value)

  return (
    <label className="field">
      <span>
        {label}
        {words ? <small className="number-words">({words})</small> : null}
      </span>
      <input {...inputProps} id={id} value={asInputNumber(value)} onChange={onChange} />
      {help ? <small>{help}</small> : null}
    </label>
  )
}
