export default function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <div className="brand__icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {!compact && (
        <div>
          <strong>Placeholder</strong>
          <small>Migração inteligente</small>
        </div>
      )}
    </div>
  )
}
