import { parseDateOnlyInt } from './format.js'

export const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9/_\-\s]+$/
export const MAX_INVOICE_AMOUNT_CENTS = 4294967295
export const MAX_INVOICE_NOTES_LENGTH = 5000
export const INVOICE_CREATE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
]

const GBP_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function getLocalDateOnlyString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDaysToDateOnlyString(dateOnly, days) {
  const [year, month, day] = dateOnly.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return getLocalDateOnlyString(date)
}

export function getDefaultInvoiceForm() {
  const issueDate = getLocalDateOnlyString()

  return {
    clientId: '',
    invoiceNumber: '',
    title: '',
    amount: '',
    issueDate,
    dueDate: addDaysToDateOnlyString(issueDate, 14),
    status: 'draft',
    notes: '',
  }
}

export function formatCentsToGbpInput(cents) {
  const safeCents = Number.isFinite(cents) ? cents : 0
  const pounds = Math.trunc(safeCents / 100)
  const remainder = Math.abs(safeCents % 100)

  if (remainder === 0) {
    return String(pounds)
  }

  return `${pounds}.${String(remainder).padStart(2, '0')}`
}

export function mapInvoiceToForm(invoice) {
  const editableStatus =
    invoice.status === 'draft' || invoice.status === 'sent'
      ? invoice.status
      : 'draft'

  return {
    clientId: String(invoice.clientId),
    invoiceNumber: invoice.invoiceNumber,
    title: invoice.title,
    amount: formatCentsToGbpInput(invoice.amountCents),
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: editableStatus,
    notes: invoice.notes ?? '',
  }
}

export function isInvoiceNotesOnlyEdit(invoice) {
  return invoice.status !== 'draft'
}

export function parseGbpAmountToCents(value) {
  if (!value?.trim()) {
    return { error: 'Amount is required.' }
  }

  const trimmed = value.trim()
  if (!GBP_AMOUNT_PATTERN.test(trimmed)) {
    return { error: 'Enter a valid amount with up to two decimal places.' }
  }

  const [wholePart, fractionPart = ''] = trimmed.split('.')
  const normalizedFraction = fractionPart.padEnd(2, '0').slice(0, 2)
  const centsBigInt = BigInt(wholePart) * 100n + BigInt(normalizedFraction)

  if (centsBigInt <= 0n) {
    return { error: 'Amount must be greater than zero.' }
  }

  if (centsBigInt > BigInt(MAX_INVOICE_AMOUNT_CENTS)) {
    return { error: 'Amount is too large.' }
  }

  return { value: Number(centsBigInt) }
}

function validateDateOnlyField(value, fieldLabel) {
  if (!value?.trim()) {
    return `${fieldLabel} is required.`
  }

  if (!DATE_ONLY_PATTERN.test(value)) {
    return `Enter a valid ${fieldLabel.toLowerCase()}.`
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return `Enter a valid ${fieldLabel.toLowerCase()}.`
  }

  return null
}

export function validateInvoiceForm(form, { notesOnly = false } = {}) {
  const errors = {}

  const notes = form.notes?.trim() ?? ''
  if (notes.length > MAX_INVOICE_NOTES_LENGTH) {
    errors.notes = 'Notes must be 5000 characters or fewer.'
  }

  if (notesOnly) {
    return errors
  }

  if (!form.clientId) {
    errors.clientId = 'Client is required.'
  }

  const invoiceNumber = form.invoiceNumber?.trim() ?? ''
  if (!invoiceNumber) {
    errors.invoiceNumber = 'Invoice number is required.'
  } else if (invoiceNumber.length > 40) {
    errors.invoiceNumber = 'Invoice number must be 40 characters or fewer.'
  } else if (!INVOICE_NUMBER_PATTERN.test(invoiceNumber)) {
    errors.invoiceNumber =
      'Invoice number may include letters, numbers, spaces, "/", "-", and "_".'
  }

  const title = form.title?.trim() ?? ''
  if (!title) {
    errors.title = 'Title is required.'
  } else if (title.length > 180) {
    errors.title = 'Title must be 180 characters or fewer.'
  }

  const amountError = parseGbpAmountToCents(form.amount).error
  if (amountError) {
    errors.amount = amountError
  }

  const issueDateError = validateDateOnlyField(form.issueDate, 'Issue date')
  if (issueDateError) {
    errors.issueDate = issueDateError
  }

  const dueDateError = validateDateOnlyField(form.dueDate, 'Due date')
  if (dueDateError) {
    errors.dueDate = dueDateError
  }

  if (!issueDateError && !dueDateError) {
    const issueInt = parseDateOnlyInt(form.issueDate)
    const dueInt = parseDateOnlyInt(form.dueDate)
    if (issueInt != null && dueInt != null && dueInt < issueInt) {
      errors.dueDate = 'Due date must be on or after issue date.'
    }
  }

  if (
    form.status &&
    !INVOICE_CREATE_STATUS_OPTIONS.some((option) => option.value === form.status)
  ) {
    errors.status = 'Status must be Draft or Sent.'
  }

  return errors
}

export function mapInvoiceFormToApiPayload(form, { notesOnly = false } = {}) {
  const notes = form.notes?.trim()

  if (notesOnly) {
    return { notes: notes || null }
  }

  const amountCents = parseGbpAmountToCents(form.amount).value

  return {
    client_id: Number(form.clientId),
    invoice_number: form.invoiceNumber.trim(),
    title: form.title.trim(),
    amount_cents: amountCents,
    issue_date: form.issueDate,
    due_date: form.dueDate,
    status: form.status,
    notes: notes || null,
  }
}

export function mapInvoiceFromApi(apiInvoice) {
  return {
    id: apiInvoice.id,
    workspaceId: apiInvoice.workspaceId,
    clientId: apiInvoice.clientId,
    clientName: apiInvoice.clientName,
    invoiceNumber: apiInvoice.invoiceNumber,
    title: apiInvoice.title,
    amountCents: apiInvoice.amountCents,
    issueDate: apiInvoice.issueDate,
    dueDate: apiInvoice.dueDate,
    status: apiInvoice.status,
    notes: apiInvoice.notes,
    paidDate: apiInvoice.paidDate,
    isOverdue: Boolean(apiInvoice.isOverdue),
    createdAt: apiInvoice.createdAt,
    updatedAt: apiInvoice.updatedAt,
  }
}

export function mapInvoicesFromApi(apiInvoices) {
  return apiInvoices.map(mapInvoiceFromApi)
}
