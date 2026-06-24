function formatDateOnly(value) {
  if (value == null) {
    return null
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dateOnlyToInt(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  return year * 10000 + month * 100 + day
}

function todayDateInt() {
  const today = new Date()
  return (
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  )
}

function deriveIsOverdue(invoice) {
  if (invoice.status !== 'sent') {
    return false
  }

  const dueDate = formatDateOnly(invoice.due_date)
  const dueDateInt = dateOnlyToInt(dueDate)
  if (dueDateInt == null) {
    return false
  }

  return dueDateInt < todayDateInt()
}

export function mapInvoiceResponse(invoice) {
  return {
    id: invoice.id,
    workspaceId: invoice.workspace_id,
    clientId: invoice.client_id,
    clientName: invoice.client_name,
    invoiceNumber: invoice.invoice_number,
    title: invoice.title,
    amountCents: invoice.amount_cents,
    issueDate: formatDateOnly(invoice.issue_date),
    dueDate: formatDateOnly(invoice.due_date),
    status: invoice.status,
    notes: invoice.notes,
    paidDate: formatDateOnly(invoice.paid_date),
    isOverdue: deriveIsOverdue(invoice),
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  }
}

export function mapInvoiceResponses(invoices) {
  return invoices.map(mapInvoiceResponse)
}
