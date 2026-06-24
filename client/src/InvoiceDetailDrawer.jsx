import Badge from './Badge'
import Drawer from './Drawer'
import { getInvoiceStatusBadge } from './utils/badges'
import { formatDueDate, formatGBP, formatNoteTimestamp } from './utils/format'

export default function InvoiceDetailDrawer({
  invoice,
  isLoading = false,
  actionError = null,
  isMarkingSent = false,
  isMarkingPaid = false,
  onClose,
  onEdit,
  onDelete,
  onMarkSent,
  onMarkPaid,
}) {
  if (!invoice && !isLoading) return null

  const footer = invoice ? (
    <footer className="drawer__footer drawer__footer--actions">
      <button
        type="button"
        className="btn btn--secondary"
        onClick={() => onEdit(invoice)}
        disabled={isMarkingSent || isMarkingPaid}
      >
        Edit
      </button>
      {invoice.status === 'draft' ? (
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => onMarkSent(invoice)}
          disabled={isMarkingSent || isMarkingPaid}
        >
          {isMarkingSent ? 'Marking…' : 'Mark sent'}
        </button>
      ) : null}
      {invoice.status === 'draft' || invoice.status === 'sent' ? (
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onMarkPaid(invoice)}
          disabled={isMarkingSent || isMarkingPaid}
        >
          {isMarkingPaid ? 'Marking…' : 'Mark paid'}
        </button>
      ) : null}
      <button
        type="button"
        className="btn btn--danger"
        onClick={() => onDelete(invoice)}
        disabled={isMarkingSent || isMarkingPaid}
      >
        Delete
      </button>
    </footer>
  ) : null

  const notes = invoice?.notes?.trim() || 'No notes added for this invoice yet.'

  return (
    <Drawer
      onClose={onClose}
      onEdit={() => onEdit(invoice)}
      onDelete={() => onDelete(invoice)}
      item={invoice}
      variant="invoice"
      titleId="invoice-drawer-title"
      closeLabel="Close invoice details"
      footer={footer}
      header={
        isLoading ? (
          <div className="drawer__header-copy">
            <h2 id="invoice-drawer-title" className="drawer__title">
              Loading invoice…
            </h2>
          </div>
        ) : (
          <>
            <div className="drawer__header-copy">
              <h2 id="invoice-drawer-title" className="drawer__title">
                {invoice.invoiceNumber}
              </h2>
              <p className="drawer__subtitle">{invoice.title}</p>
              <div className="drawer__badges">
                <Badge {...getInvoiceStatusBadge(invoice)} />
              </div>
            </div>
          </>
        )
      }
    >
      {isLoading ? (
        <p className="drawer-details__value drawer-details__value--muted">
          Loading invoice details…
        </p>
      ) : (
        <>
          {actionError ? (
            <p className="field-error invoice-drawer__error" role="alert">
              {actionError}
            </p>
          ) : null}

          <dl className="drawer-details">
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Client</dt>
              <dd className="drawer-details__value">{invoice.clientName}</dd>
            </div>
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Amount</dt>
              <dd className="drawer-details__value drawer-details__value--emphasis">
                {formatGBP(invoice.amountCents)}
              </dd>
            </div>
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Status</dt>
              <dd className="drawer-details__value">
                <Badge {...getInvoiceStatusBadge(invoice)} />
              </dd>
            </div>
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Issue date</dt>
              <dd className="drawer-details__value">
                {formatDueDate(invoice.issueDate)}
              </dd>
            </div>
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Due date</dt>
              <dd className="drawer-details__value">
                {formatDueDate(invoice.dueDate)}
              </dd>
            </div>
            {invoice.paidDate ? (
              <div className="drawer-details__row">
                <dt className="drawer-details__label">Paid date</dt>
                <dd className="drawer-details__value">
                  {formatDueDate(invoice.paidDate)}
                </dd>
              </div>
            ) : null}
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Created</dt>
              <dd className="drawer-details__value drawer-details__value--muted">
                {formatNoteTimestamp(invoice.createdAt)}
              </dd>
            </div>
            <div className="drawer-details__row">
              <dt className="drawer-details__label">Updated</dt>
              <dd className="drawer-details__value drawer-details__value--muted">
                {formatNoteTimestamp(invoice.updatedAt)}
              </dd>
            </div>
          </dl>

          <section className="drawer-notes" aria-label="Invoice notes">
            <h3 className="drawer-notes__title">Notes</h3>
            <p className="drawer-notes__body">{notes}</p>
          </section>
        </>
      )}
    </Drawer>
  )
}
