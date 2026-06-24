import { useState } from 'react'
import useOverlayLock from './hooks/useOverlayLock'
import {
  ModalBody,
  ModalField,
  ModalFooter,
  ModalForm,
  ModalHeader,
  ModalShell,
} from './modals/modalPrimitives'
import { getLocalDateOnlyString } from './utils/invoiceMapper'

export default function MarkInvoicePaidModal({
  isOpen,
  invoice,
  onClose,
  onConfirm,
  isSubmitting = false,
  serverError = null,
}) {
  useOverlayLock(isOpen)

  if (!isOpen || !invoice) return null

  return (
    <MarkInvoicePaidModalContent
      key={invoice.id}
      invoice={invoice}
      onClose={onClose}
      onConfirm={onConfirm}
      isSubmitting={isSubmitting}
      serverError={serverError}
    />
  )
}

function MarkInvoicePaidModalContent({
  invoice,
  onClose,
  onConfirm,
  isSubmitting,
  serverError,
}) {
  const [paidDate, setPaidDate] = useState(getLocalDateOnlyString)

  async function handleSubmit(event) {
    event.preventDefault()
    await onConfirm(paidDate)
  }

  return (
    <ModalShell onClose={onClose} titleId="mark-invoice-paid-title">
      <ModalHeader
        titleId="mark-invoice-paid-title"
        title="Mark invoice as paid"
        description={`Record payment for ${invoice.invoiceNumber}.`}
      />

      <ModalForm onSubmit={handleSubmit}>
        <ModalBody>
          <ModalField label="Paid date" htmlFor="invoice-paid-date">
            <input
              id="invoice-paid-date"
              type="date"
              className="field-input"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
              disabled={isSubmitting}
            />
          </ModalField>

          {serverError ? <p className="field-error">{serverError}</p> : null}
        </ModalBody>

        <ModalFooter
          onClose={onClose}
          isSubmitting={isSubmitting}
          submitLabel="Mark as paid"
          submittingLabel="Marking…"
        />
      </ModalForm>
    </ModalShell>
  )
}
