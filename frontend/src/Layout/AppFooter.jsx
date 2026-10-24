export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner d-flex justify-content-end align-items-center gap-2">
        <div className="footer-right d-flex align-items-center gap-3 text-muted small">
          <span className="badge bg-light text-dark border">
            K-Means Clustering &amp; Backpropagation MLP
          </span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
