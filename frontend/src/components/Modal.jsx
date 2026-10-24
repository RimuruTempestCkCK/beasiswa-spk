import { useEffect } from 'react';

/**
 * Reusable modal popup component matching Registrar theme styling.
 * Supports esc key, backdrop click, size customization, and scrollable body.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg', // 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass =
    size === 'sm'
      ? 'modal-sm'
      : size === 'xl'
        ? 'modal-xl'
        : size === 'md'
          ? ''
          : 'modal-lg';

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1055, backgroundColor: 'rgba(11, 26, 30, 0.55)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${sizeClass}`}>
          <div className="modal-content shadow-lg border-0" style={{ maxHeight: '90vh' }}>
            <div className="modal-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="modal-title fw-bold">{title}</h5>
                {subtitle && <p className="modal-sub text-muted small mb-0 mt-1">{subtitle}</p>}
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Tutup"
                onClick={onClose}
              />
            </div>
            <div className="modal-body overflow-auto">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
