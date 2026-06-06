import { useEffect } from 'react'

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!isOpen) return

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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
        </header>

        <footer className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--destructive" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
