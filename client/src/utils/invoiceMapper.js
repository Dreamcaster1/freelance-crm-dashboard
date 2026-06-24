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
