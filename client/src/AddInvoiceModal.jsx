import { useMemo, useState } from 'react'
import useOverlayLock from './hooks/useOverlayLock'
import {
  ModalBody,
  ModalField,
  ModalFooter,
  ModalForm,
  ModalHeader,
  ModalShell,
} from './modals/modalPrimitives'
import {
  INVOICE_CREATE_STATUS_OPTIONS,
  addDaysToDateOnlyString,
  getDefaultInvoiceForm,
  isInvoiceNotesOnlyEdit,
  mapInvoiceToForm,
  validateInvoiceForm,
} from './utils/invoiceMapper'
import { parseDateOnlyInt } from './utils/format'

function canMarkInvoicePaid(invoice) {
  return invoice?.status === 'draft' || invoice?.status === 'sent'
}

export default function AddInvoiceModal({
  isOpen,
  invoice = null,
  onClose,
  onSubmit,
  onRequestMarkPaid,
  clients,
  isSubmitting = false,
  isMarkingPaid = false,
  serverError = null,
}) {
  useOverlayLock(isOpen)

  if (!isOpen) return null

  return (
    <InvoiceModalContent
      key={
        invoice ? `invoice-${invoice.id}-${invoice.status}` : 'new-invoice'
      }
      invoice={invoice}
      onClose={onClose}
      onSubmit={onSubmit}
      onRequestMarkPaid={onRequestMarkPaid}
      clients={clients}
      isSubmitting={isSubmitting}
      isMarkingPaid={isMarkingPaid}
      serverError={serverError}
    />
  )
}

function InvoiceModalFooter({
  onClose,
  onMarkPaid,
  showMarkPaid,
  isSubmitting,
  isMarkingPaid,
  submitLabel,
  submittingLabel,
}) {
  const disabled = isSubmitting || isMarkingPaid

  return (
    <footer className="modal__footer invoice-modal__footer">
      <button
        type="button"
        className="btn btn--secondary"
        onClick={onClose}
        disabled={disabled}
      >
        Cancel
      </button>
      {showMarkPaid ? (
        <button
          type="button"
          className="btn btn--secondary invoice-modal__mark-paid-btn"
          onClick={onMarkPaid}
          disabled={disabled}
        >
          {isMarkingPaid ? 'Marking paid…' : 'Mark as paid'}
        </button>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={disabled}>
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </footer>
  )
}

function InvoiceModalContent({
  invoice,
  onClose,
  onSubmit,
  onRequestMarkPaid,
  clients,
  isSubmitting,
  isMarkingPaid,
  serverError,
}) {
  const isEditing = Boolean(invoice)
  const notesOnly = isEditing && isInvoiceNotesOnlyEdit(invoice)
  const showMarkPaid = isEditing && canMarkInvoicePaid(invoice)
  const [form, setForm] = useState(() =>
    invoice ? mapInvoiceToForm(invoice) : getDefaultInvoiceForm(),
  )
  const [errors, setErrors] = useState({})

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.company.localeCompare(b.company)),
    [clients],
  )

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  function updateIssueDate(value) {
    setForm((current) => {
      const next = { ...current, issueDate: value }
      const issueInt = parseDateOnlyInt(value)
      const dueInt = parseDateOnlyInt(current.dueDate)

      if (issueInt != null && (dueInt == null || dueInt < issueInt)) {
        next.dueDate = addDaysToDateOnlyString(value, 14)
      }

      return next
    })

    if (errors.issueDate || errors.dueDate) {
      setErrors((current) => {
        const next = { ...current }
        delete next.issueDate
        delete next.dueDate
        return next
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validateInvoiceForm(form, { notesOnly })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    await onSubmit(form, { notesOnly })
  }

  function handleMarkPaidClick() {
    if (!invoice || !onRequestMarkPaid) return
    onRequestMarkPaid(invoice)
  }

  const hasClients = sortedClients.length > 0
  const submitLabel = isEditing
    ? notesOnly
      ? 'Save notes'
      : 'Save changes'
    : 'Add invoice'
  const submittingLabel = isEditing ? 'Saving…' : 'Creating…'

  return (
    <ModalShell onClose={onClose} titleId="invoice-modal-title">
      <ModalHeader
        titleId="invoice-modal-title"
        title={isEditing ? 'Edit Invoice' : 'Add Invoice'}
        description={
          notesOnly
            ? invoice.status === 'sent'
              ? 'Update notes or mark this invoice as paid.'
              : 'Update notes for this invoice.'
            : isEditing
              ? 'Update this invoice’s billing details.'
              : 'Create a draft or sent invoice for a client.'
        }
      />

      <ModalForm onSubmit={handleSubmit}>
        <ModalBody>
          {notesOnly ? (
            <>
              <p className="invoice-modal__summary">
                {invoice.invoiceNumber} · {invoice.clientName}
              </p>
              <ModalField label="Notes" htmlFor="invoice-notes" error={errors.notes}>
                <textarea
                  id="invoice-notes"
                  className={`field-input${errors.notes ? ' field-input--error' : ''}`}
                  rows={5}
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                />
              </ModalField>
            </>
          ) : (
            <>
              <ModalField label="Client" htmlFor="invoice-client" error={errors.clientId}>
                <select
                  id="invoice-client"
                  className={`field-select${errors.clientId ? ' field-input--error' : ''}`}
                  value={form.clientId}
                  onChange={(event) => updateField('clientId', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid || !hasClients}
                  required
                >
                  <option value="">
                    {hasClients ? 'Select a client' : 'No clients available'}
                  </option>
                  {sortedClients.map((client) => (
                    <option key={client.id} value={String(client.id)}>
                      {client.company}
                    </option>
                  ))}
                </select>
              </ModalField>

              <ModalField
                label="Invoice number"
                htmlFor="invoice-number"
                error={errors.invoiceNumber}
              >
                <input
                  id="invoice-number"
                  type="text"
                  className={`field-input${errors.invoiceNumber ? ' field-input--error' : ''}`}
                  value={form.invoiceNumber}
                  onChange={(event) => updateField('invoiceNumber', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                  maxLength={40}
                  autoComplete="off"
                />
              </ModalField>

              <ModalField label="Title" htmlFor="invoice-title" error={errors.title}>
                <input
                  id="invoice-title"
                  type="text"
                  className={`field-input${errors.title ? ' field-input--error' : ''}`}
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                  maxLength={180}
                />
              </ModalField>

              <ModalField
                label="Amount (GBP)"
                htmlFor="invoice-amount"
                error={errors.amount}
              >
                <input
                  id="invoice-amount"
                  type="text"
                  className={`field-input${errors.amount ? ' field-input--error' : ''}`}
                  placeholder="0.00"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => updateField('amount', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                />
              </ModalField>

              <ModalField
                label="Issue date"
                htmlFor="invoice-issue-date"
                error={errors.issueDate}
              >
                <input
                  id="invoice-issue-date"
                  type="date"
                  className={`field-input${errors.issueDate ? ' field-input--error' : ''}`}
                  value={form.issueDate}
                  onChange={(event) => updateIssueDate(event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                />
              </ModalField>

              <ModalField
                label="Due date"
                htmlFor="invoice-due-date"
                error={errors.dueDate}
              >
                <input
                  id="invoice-due-date"
                  type="date"
                  className={`field-input${errors.dueDate ? ' field-input--error' : ''}`}
                  value={form.dueDate}
                  min={form.issueDate || undefined}
                  onChange={(event) => updateField('dueDate', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                />
              </ModalField>

              <ModalField label="Status" htmlFor="invoice-status" error={errors.status}>
                <select
                  id="invoice-status"
                  className={`field-select${errors.status ? ' field-input--error' : ''}`}
                  value={form.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                >
                  {INVOICE_CREATE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ModalField>

              <ModalField label="Notes" htmlFor="invoice-notes" error={errors.notes}>
                <textarea
                  id="invoice-notes"
                  className={`field-input${errors.notes ? ' field-input--error' : ''}`}
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  disabled={isSubmitting || isMarkingPaid}
                />
              </ModalField>
            </>
          )}

          {serverError ? <p className="field-error">{serverError}</p> : null}
        </ModalBody>

        {showMarkPaid ? (
          <InvoiceModalFooter
            onClose={onClose}
            onMarkPaid={handleMarkPaidClick}
            showMarkPaid
            isSubmitting={isSubmitting}
            isMarkingPaid={isMarkingPaid}
            submitLabel={submitLabel}
            submittingLabel={submittingLabel}
          />
        ) : (
          <ModalFooter
            onClose={onClose}
            isSubmitting={isSubmitting || isMarkingPaid}
            submitLabel={submitLabel}
            submittingLabel={submittingLabel}
          />
        )}
      </ModalForm>
    </ModalShell>
  )
}
