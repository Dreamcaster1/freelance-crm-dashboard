export function ModalShell({ onClose, titleId, children, modalClassName = 'modal' }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={modalClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ titleId, title, description }) {
  return (
    <header className="modal__header">
      <h2 id={titleId} className="modal__title">
        {title}
      </h2>
      <p className="modal__description">{description}</p>
    </header>
  )
}

export function ModalForm({ onSubmit, children }) {
  return (
    <form className="modal__form" onSubmit={onSubmit} noValidate>
      {children}
    </form>
  )
}

export function ModalBody({ children }) {
  return <div className="modal__body">{children}</div>
}

export function ModalFooter({
  onClose,
  submitLabel = 'Save',
  isSubmitting = false,
}) {
  return (
    <footer className="modal__footer">
      <button
        type="button"
        className="btn btn--secondary"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="btn btn--primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </footer>
  )
}

export function ModalField({ label, htmlFor, error, children }) {
  return (
    <div className="modal-field">
      <label className="modal-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
