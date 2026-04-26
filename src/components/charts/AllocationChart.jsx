import { formatCompactCurrency, formatCurrencyWithWords, formatNumber } from '../../lib/formatters'

export function AllocationChart({
  items,
  title = 'Monthly allocation mix',
  description = 'How your current plans split cash flow across priorities.',
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const radius = 74
  const circumference = 2 * Math.PI * radius
  const segments = items.map((item, index) => {
    const previousValue = items.slice(0, index).reduce((sum, entry) => sum + entry.value, 0)

    return {
      ...item,
      stroke: total > 0 ? (item.value / total) * circumference : 0,
      offset: total > 0 ? (previousValue / total) * circumference : 0,
    }
  })

  const topBucket = segments.reduce(
    (top, item) => (item.value > top.value ? item : top),
    segments[0] || { label: 'No plans', value: 0 },
  )

  function getBucketClass(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div className="donut-wrap">
        <svg className="donut-chart" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r={radius} className="donut-track" />
          {segments.map((item) => (
            <circle
              key={item.label}
              cx="100"
              cy="100"
              r={radius}
              className="donut-segment"
              style={{
                stroke: item.color,
                strokeDasharray: `${item.stroke} ${circumference - item.stroke}`,
                strokeDashoffset: -item.offset,
              }}
            />
          ))}
        </svg>
        <div className="donut-center">
          <span>Active buckets</span>
          <strong>{items.filter((item) => item.value > 0).length}</strong>
        </div>
      </div>

      <div className="chart-legend detailed">
        {items.map((item) => (
          <div
            key={item.label}
            className={`legend-item detailed ${getBucketClass(item.label)}`}
            title={`${item.label}: ${formatCurrencyWithWords(item.value)}`}
          >
            <span className="legend-label truncate-2" title={item.label}>{item.label}</span>
            <strong title={formatCurrencyWithWords(item.value)}>{formatCompactCurrency(item.value)}</strong>
          </div>
        ))}
      </div>

      <div className="chart-insights">
        <div className="insight-pill" title={formatCurrencyWithWords(total)}>
          <span>Total monthly outflow</span>
          <strong>{formatCompactCurrency(total)}</strong>
        </div>
        <div
          className="insight-pill"
          title={
            total > 0
              ? `${topBucket.label}: ${formatCurrencyWithWords(topBucket.value)}`
              : 'No active plans'
          }
        >
          <span>Largest share</span>
          <strong>
            {total > 0
              ? `${topBucket.label} ${formatNumber((topBucket.value / total) * 100, 0)}%`
              : 'No active plans'}
          </strong>
        </div>
      </div>
    </div>
  )
}
