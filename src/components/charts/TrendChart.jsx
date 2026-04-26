import { formatCurrency } from '../../lib/formatters'

export function TrendChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  const average = items.reduce((sum, item) => sum + item.value, 0) / items.length
  const peak = items.reduce((top, item) => (item.value > top.value ? item : top), items[0])

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>Commitment trend</h3>
          <p>A visual estimate of how your financial load could evolve this year.</p>
        </div>
      </div>

      <div className="trend-chart" aria-label="Commitment trend">
        {items.map((item) => (
          <div key={item.label} className="trend-bar-group">
            <div
              className="trend-bar"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            >
              <span>{formatCurrency(item.value)}</span>
            </div>
            <strong>{item.label}</strong>
          </div>
        ))}
      </div>

      <div className="chart-insights">
        <div className="insight-pill">
          <span>Average quarter</span>
          <strong>{formatCurrency(average)}</strong>
        </div>
        <div className="insight-pill">
          <span>Highest pressure point</span>
          <strong>
            {peak.label} • {formatCurrency(peak.value)}
          </strong>
        </div>
      </div>
    </div>
  )
}
