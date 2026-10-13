export default function MetricCard({ icon, value, label, helper, tone = 'blue' }) {
  return (
    <div className="metric-card">
      <div className={`metric-card__icon metric-card__icon--${tone}`}>{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {helper && <small>{helper}</small>}
      </div>
    </div>
  )
}
