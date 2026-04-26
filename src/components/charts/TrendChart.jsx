import { formatCompactCurrency, formatCurrencyWithWords } from '../../lib/formatters'

export function TrendChart({
  items,
  title = 'Commitment trend',
  description = 'A visual estimate of how your financial load could evolve this year.',
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  const average = items.reduce((sum, item) => sum + item.value, 0) / items.length
  const peak = items.reduce((top, item) => (item.value > top.value ? item : top), items[0])

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div className="trend-chart" aria-label={title}>
        {items.map((item) => (
          <div
            key={item.label}
            className="trend-bar-group"
            title={`${item.label}: ${formatCurrencyWithWords(item.value)}`}
          >
            <span className="trend-value-badge">{formatCompactCurrency(item.value)}</span>
            <div
              className="trend-bar"
              style={{ height: `${Math.max((item.value / maxValue) * 100, 28)}%` }}
            >
              <span title={formatCurrencyWithWords(item.value)}>{formatCompactCurrency(item.value)}</span>
            </div>
            <strong className="truncate-1" title={item.label}>{item.label}</strong>
          </div>
        ))}
      </div>

      <div className="chart-insights">
        <div className="insight-pill" title={formatCurrencyWithWords(average)}>
          <span>Average period</span>
          <strong>{formatCompactCurrency(average)}</strong>
        </div>
        <div
          className="insight-pill"
          title={`${peak.label}: ${formatCurrencyWithWords(peak.value)}`}
        >
          <span>Highest pressure point</span>
          <strong>{`at ${peak.label}: ${formatCompactCurrency(peak.value)}`}</strong>
        </div>
      </div>
    </div>
  )
}
