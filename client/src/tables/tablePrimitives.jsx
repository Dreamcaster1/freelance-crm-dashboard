export function TableCard({ cardClassName, footerClassName, footerText, children }) {
  return (
    <div className={cardClassName}>
      <div className="table-scroll">{children}</div>
      <footer className={footerClassName}>{footerText}</footer>
    </div>
  )
}

export function TableEmptyState({ colSpan, className, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className={className}>
        {children}
      </td>
    </tr>
  )
}

export function TableActions({ onEdit, onDelete }) {
  return (
    <div className="table-actions">
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
      >
        Edit
      </button>
      <button
        type="button"
        className="btn btn--danger btn--sm"
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
      >
        Delete
      </button>
    </div>
  )
}

export function SelectableTableRow({
  isSelected,
  rowClassName,
  selectedClassName,
  ariaLabel,
  onOpen,
  children,
}) {
  return (
    <tr
      className={`${rowClassName}${isSelected ? ` ${selectedClassName}` : ''}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      tabIndex={0}
      aria-label={ariaLabel}
    >
      {children}
    </tr>
  )
}
