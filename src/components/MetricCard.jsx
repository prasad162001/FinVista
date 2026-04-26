export function MetricCard({ label, value, detail, title, valueTitle }) {
  return (
    <article className="metric-card" title={title}>
      <span className="truncate-2" title={label}>{label}</span>
      <strong title={valueTitle || value}>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}
