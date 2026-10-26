export default function StatusBadge({ status }) {
  return <span className={`badge badge--status badge--${status.toLowerCase()}`}>{status}</span>;
}
