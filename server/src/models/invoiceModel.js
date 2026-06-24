import pool from '../config/db.js'

const INVOICE_COLUMNS = `
  i.id,
  i.workspace_id,
  i.client_id,
  c.company AS client_name,
  i.invoice_number,
  i.title,
  i.amount_cents,
  i.issue_date,
  i.due_date,
  i.status,
  i.notes,
  i.paid_date,
  i.created_at,
  i.updated_at
`

export async function findInvoicesByWorkspace(workspaceId) {
  const [rows] = await pool.query(
    `SELECT ${INVOICE_COLUMNS}
     FROM invoices i
     INNER JOIN clients c
       ON c.id = i.client_id
      AND c.workspace_id = i.workspace_id
     WHERE i.workspace_id = ?
     ORDER BY i.updated_at DESC, i.id DESC`,
    [workspaceId],
  )
  return rows
}

export async function findInvoiceById(workspaceId, invoiceId) {
  const [rows] = await pool.query(
    `SELECT ${INVOICE_COLUMNS}
     FROM invoices i
     INNER JOIN clients c
       ON c.id = i.client_id
      AND c.workspace_id = i.workspace_id
     WHERE i.id = ? AND i.workspace_id = ?
     LIMIT 1`,
    [invoiceId, workspaceId],
  )
  return rows[0] ?? null
}

export async function createInvoice(workspaceId, {
  clientId,
  invoiceNumber,
  title,
  amountCents,
  issueDate,
  dueDate,
  status,
  notes,
  paidDate,
}) {
  const [result] = await pool.query(
    `INSERT INTO invoices (
      workspace_id,
      client_id,
      invoice_number,
      title,
      amount_cents,
      issue_date,
      due_date,
      status,
      notes,
      paid_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      workspaceId,
      clientId,
      invoiceNumber,
      title,
      amountCents,
      issueDate,
      dueDate,
      status,
      notes,
      paidDate,
    ],
  )

  return findInvoiceById(workspaceId, result.insertId)
}

export async function updateInvoice(workspaceId, invoiceId, fields) {
  const assignments = []
  const params = []

  if (fields.clientId !== undefined) {
    assignments.push('client_id = ?')
    params.push(fields.clientId)
  }

  if (fields.invoiceNumber !== undefined) {
    assignments.push('invoice_number = ?')
    params.push(fields.invoiceNumber)
  }

  if (fields.title !== undefined) {
    assignments.push('title = ?')
    params.push(fields.title)
  }

  if (fields.amountCents !== undefined) {
    assignments.push('amount_cents = ?')
    params.push(fields.amountCents)
  }

  if (fields.issueDate !== undefined) {
    assignments.push('issue_date = ?')
    params.push(fields.issueDate)
  }

  if (fields.dueDate !== undefined) {
    assignments.push('due_date = ?')
    params.push(fields.dueDate)
  }

  if (fields.status !== undefined) {
    assignments.push('status = ?')
    params.push(fields.status)
  }

  if (fields.notes !== undefined) {
    assignments.push('notes = ?')
    params.push(fields.notes)
  }

  if (fields.paidDate !== undefined) {
    assignments.push('paid_date = ?')
    params.push(fields.paidDate)
  }

  if (assignments.length === 0) {
    return findInvoiceById(workspaceId, invoiceId)
  }

  params.push(invoiceId, workspaceId)

  const [result] = await pool.query(
    `UPDATE invoices
     SET ${assignments.join(', ')}
     WHERE id = ? AND workspace_id = ?`,
    params,
  )

  if (result.affectedRows === 0) {
    return null
  }

  return findInvoiceById(workspaceId, invoiceId)
}

export async function markInvoiceAsSent(workspaceId, invoiceId) {
  const [result] = await pool.query(
    `UPDATE invoices
     SET status = 'sent', paid_date = NULL
     WHERE id = ?
       AND workspace_id = ?
       AND status = 'draft'`,
    [invoiceId, workspaceId],
  )

  return result.affectedRows > 0
}

export async function markInvoiceAsPaid(workspaceId, invoiceId, paidDate) {
  const [result] = await pool.query(
    `UPDATE invoices
     SET status = 'paid', paid_date = ?
     WHERE id = ?
       AND workspace_id = ?
       AND status IN ('draft', 'sent')`,
    [paidDate, invoiceId, workspaceId],
  )

  return result.affectedRows > 0
}

export async function deleteInvoice(workspaceId, invoiceId) {
  const [result] = await pool.query(
    'DELETE FROM invoices WHERE id = ? AND workspace_id = ?',
    [invoiceId, workspaceId],
  )

  return result.affectedRows > 0
}
