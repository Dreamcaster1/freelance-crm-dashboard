import useOverlayLock from './hooks/useOverlayLock'

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting…',
  confirmClassName = 'btn--destructive',
  error = null,
  isConfirming = false,
  onClose,
  onConfirm,
}) {
  useOverlayLock(isOpen)

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="confirm-modal-title" className="modal__title">
            {title}
          </h2>
          <p id="confirm-modal-description" className="modal__description">
            {description}
          </p>
          {error ? <p className="field-error">{error}</p> : null}
        </header>

        <footer className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${confirmClassName}`}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? confirmingLabel : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
