export default function Badge({ label, variant }) {
  return <span className={`badge badge--${variant}`}>{label}</span>
}
