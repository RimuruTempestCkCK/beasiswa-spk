export default function SuspenseFallback({ message = 'Memuat...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div
        className="spinner-border text-primary mb-3"
        role="status"
        style={{ width: '2.5rem', height: '2.5rem' }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fw-semibold mb-0">{message}</p>
    </div>
  );
}
