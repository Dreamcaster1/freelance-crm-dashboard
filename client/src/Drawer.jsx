import { useEffect } from 'react'
import useOverlayLock from './hooks/useOverlayLock'
import { IconX } from './icons'

export default function Drawer({
  onClose,
  onEdit,
  onDelete,
  item,
  variant,
  titleId,
  closeLabel,
  header,
  children,
}) {
  useOverlayLock(true)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className={`drawer drawer--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer__header">
          <div className="drawer__header-main">{header}</div>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <IconX />
          </button>
        </header>

        <div className="drawer__body">{children}</div>

        <footer className="drawer__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onEdit(item)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => onDelete(item)}
          >
            Delete
          </button>
        </footer>
      </aside>
    </div>
  )
}
