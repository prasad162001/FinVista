export function LogoMark({ compact = false, inverse = false }) {
  return (
    <div className={`brand-lockup ${compact ? 'compact' : ''} ${inverse ? 'inverse' : ''}`}>
      <div className="brand-mark futuristic" aria-hidden="true">
        <span className="brand-mark-glow"></span>
        <span className="brand-mark-grid"></span>
        <span className="brand-mark-core">FV</span>
        <span className="brand-mark-orbit orbit-one"></span>
        <span className="brand-mark-orbit orbit-two"></span>
      </div>
      <div className="brand-copy">
        <strong>FinVista</strong>
        <span>Your financial planner</span>
      </div>
    </div>
  )
}
