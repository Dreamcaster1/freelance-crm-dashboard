import { findClientById } from '../models/clientModel.js'
import {
  createInvoice,
  deleteInvoice,
  findInvoiceById,
  findInvoicesByWorkspace,
  markInvoiceAsPaid,
  markInvoiceAsSent,
  updateInvoice,
} from '../models/invoiceModel.js'
import { mapInvoiceResponse, mapInvoiceResponses } from '../utils/invoiceMapper.js'
import { assertJsonObject, validateCalendarDate } from '../utils/validation.js'

const VALID_STATUSES = ['draft', 'sent', 'paid', 'cancelled']
const CREATE_ALLOWED_STATUSES = ['draft', 'sent']
const PATCH_ALLOWED_STATUSES_FROM_DRAFT = ['draft', 'sent']
const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9/_\-\s]+$/
const MAX_AMOUNT_CENTS = 4294967295
const MAX_AMOUNT_CENTS_BIGINT = BigInt(MAX_AMOUNT_CENTS)
const MAX_NOTES_LENGTH = 5000

function parsePositiveInteger(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

function parseInvoiceId(rawId) {
  return parsePositiveInteger(rawId)
}

function getCurrentDateOnly() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseClientId(rawClientId) {
  const clientId = parsePositiveInteger(rawClientId)
  if (!clientId) {
    return { error: 'client_id must be a positive integer.' }
  }
  return { value: clientId }
}

function parseInvoiceNumber(rawInvoiceNumber) {
  if (typeof rawInvoiceNumber !== 'string') {
    return { error: 'invoice_number is required.' }
  }

  const invoiceNumber = rawInvoiceNumber.trim()
  if (!invoiceNumber) {
    return { error: 'invoice_number is required.' }
  }

  if (invoiceNumber.length > 40) {
    return { error: 'invoice_number must be 40 characters or fewer.' }
  }

  if (!INVOICE_NUMBER_PATTERN.test(invoiceNumber)) {
    return {
      error:
        'invoice_number may include letters, numbers, spaces, "/", "-", and "_".',
    }
  }

  return { value: invoiceNumber }
}

function parseTitle(rawTitle) {
  if (typeof rawTitle !== 'string') {
    return { error: 'title is required.' }
  }

  const title = rawTitle.trim()
  if (!title) {
    return { error: 'title is required.' }
  }

  if (title.length > 180) {
    return { error: 'title must be 180 characters or fewer.' }
  }

  return { value: title }
}

function parseAmountCents(rawAmountCents) {
  if (rawAmountCents === null || rawAmountCents === undefined) {
    return { error: 'amount_cents must be a valid amount in cents.' }
  }

  let centsBigInt

  if (typeof rawAmountCents === 'number') {
    if (!Number.isFinite(rawAmountCents) || !Number.isInteger(rawAmountCents)) {
      return { error: 'amount_cents must be a valid amount in cents.' }
    }
    centsBigInt = BigInt(rawAmountCents)
  } else if (typeof rawAmountCents === 'string') {
    const trimmed = rawAmountCents.trim()
    if (!trimmed || /[eE.]/.test(trimmed) || !/^-?\d+$/.test(trimmed)) {
      return { error: 'amount_cents must be a valid amount in cents.' }
    }
    centsBigInt = BigInt(trimmed)
  } else {
    return { error: 'amount_cents must be a valid amount in cents.' }
  }

  if (centsBigInt <= 0n) {
    return { error: 'amount_cents must be greater than 0.' }
  }

  if (centsBigInt > MAX_AMOUNT_CENTS_BIGINT) {
    return { error: 'amount_cents is too large.' }
  }

  return { value: Number(centsBigInt) }
}

function parseNotes(rawNotes) {
  if (rawNotes === null) {
    return { value: null }
  }

  if (rawNotes === undefined) {
    return { omitted: true }
  }

  if (typeof rawNotes !== 'string') {
    return { error: 'notes must be a string or null.' }
  }

  const notes = rawNotes.trim()
  if (!notes) {
    return { value: null }
  }

  if (notes.length > MAX_NOTES_LENGTH) {
    return { error: 'notes must be 5000 characters or fewer.' }
  }

  return { value: notes }
}

function parseStatus(rawStatus, { required, fieldName = 'status' } = {}) {
  if (rawStatus === undefined) {
    return required
      ? { error: `${fieldName} is required.` }
      : { omitted: true }
  }

  if (typeof rawStatus !== 'string') {
    return { error: `${fieldName} must be one of: ${VALID_STATUSES.join(', ')}.` }
  }

  const status = rawStatus.trim()
  if (!VALID_STATUSES.includes(status)) {
    return { error: `${fieldName} must be one of: ${VALID_STATUSES.join(', ')}.` }
  }

  return { value: status }
}

function parsePaidDate(rawPaidDate) {
  if (rawPaidDate === undefined) {
    return { omitted: true }
  }

  if (rawPaidDate === null) {
    return { value: null }
  }

  const dateError = validateCalendarDate(rawPaidDate, 'paid_date')
  if (dateError) {
    return { error: dateError }
  }

  return { value: rawPaidDate }
}

function normalizeInternalDateOnly(value, { fieldName, allowNull = false } = {}) {
  if (value === null || value === undefined) {
    if (allowNull) {
      return { value: null }
    }
    return {
      error: `${fieldName} must be a valid date in YYYY-MM-DD format.`,
      isInternalDateError: true,
    }
  }

  if (typeof value === 'string') {
    const dateError = validateCalendarDate(value, fieldName)
    if (dateError) {
      return { error: dateError }
    }
    return { value }
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return {
        error: `Stored ${fieldName} value is invalid.`,
        isInternalDateError: true,
      }
    }

    // mysql2 can return DATE columns as Date objects. We use local components
    // to preserve the stored calendar day under default mysql2/local timezone handling.
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    const normalized = `${year}-${month}-${day}`

    const dateError = validateCalendarDate(normalized, fieldName)
    if (dateError) {
      return {
        error: `Stored ${fieldName} value is invalid.`,
        isInternalDateError: true,
      }
    }

    return { value: normalized }
  }

  return {
    error: `Stored ${fieldName} value is invalid.`,
    isInternalDateError: true,
  }
}

function dateOnlyToInt(value) {
  const [year, month, day] = value.split('-').map(Number)
  return year * 10000 + month * 100 + day
}

function validateIssueAndDueDateOrder(issueDate, dueDate) {
  const normalizedIssueDate = normalizeInternalDateOnly(issueDate, {
    fieldName: 'issue_date',
  })
  if (normalizedIssueDate.error) {
    return normalizedIssueDate
  }

  const normalizedDueDate = normalizeInternalDateOnly(dueDate, {
    fieldName: 'due_date',
  })
  if (normalizedDueDate.error) {
    return normalizedDueDate
  }

  if (
    dateOnlyToInt(normalizedDueDate.value) < dateOnlyToInt(normalizedIssueDate.value)
  ) {
    return { error: 'due_date must be on or after issue_date.' }
  }

  return { value: true }
}

function validateCreateBody(body) {
  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  const clientId = parseClientId(body.client_id)
  if (clientId.error) {
    return { error: clientId.error }
  }

  const invoiceNumber = parseInvoiceNumber(body.invoice_number)
  if (invoiceNumber.error) {
    return { error: invoiceNumber.error }
  }

  const title = parseTitle(body.title)
  if (title.error) {
    return { error: title.error }
  }

  const amountCents = parseAmountCents(body.amount_cents)
  if (amountCents.error) {
    return { error: amountCents.error }
  }

  const issueDateError = validateCalendarDate(body.issue_date, 'issue_date')
  if (issueDateError) {
    return { error: issueDateError }
  }

  const dueDateError = validateCalendarDate(body.due_date, 'due_date')
  if (dueDateError) {
    return { error: dueDateError }
  }

  const dateOrderResult = validateIssueAndDueDateOrder(
    body.issue_date,
    body.due_date,
  )
  if (dateOrderResult.error) {
    return { error: dateOrderResult.error }
  }

  const notes = parseNotes(body.notes)
  if (notes.error) {
    return { error: notes.error }
  }

  const paidDate = parsePaidDate(body.paid_date)
  if (paidDate.error) {
    return { error: paidDate.error }
  }

  if (paidDate.value !== undefined && paidDate.value !== null) {
    return { error: 'paid_date must be null when creating an invoice.' }
  }

  const statusInput = body.status ?? 'draft'
  const status = parseStatus(statusInput, { required: true })
  if (status.error) {
    return { error: status.error }
  }

  if (!CREATE_ALLOWED_STATUSES.includes(status.value)) {
    return { error: 'New invoices may only be created with status draft or sent.' }
  }

  return {
    data: {
      clientId: clientId.value,
      invoiceNumber: invoiceNumber.value,
      title: title.value,
      amountCents: amountCents.value,
      issueDate: body.issue_date,
      dueDate: body.due_date,
      status: status.value,
      notes: notes.value ?? null,
      paidDate: null,
    },
  }
}

function validatePatchBody(body) {
  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  const allowedFields = [
    'client_id',
    'invoice_number',
    'title',
    'amount_cents',
    'issue_date',
    'due_date',
    'status',
    'notes',
    'paid_date',
  ]

  const providedFields = allowedFields.filter((field) => body[field] !== undefined)
  if (providedFields.length === 0) {
    return { error: 'At least one updatable field is required.' }
  }

  const fields = {}

  if (body.client_id !== undefined) {
    const clientId = parseClientId(body.client_id)
    if (clientId.error) {
      return { error: clientId.error }
    }
    fields.clientId = clientId.value
  }

  if (body.invoice_number !== undefined) {
    const invoiceNumber = parseInvoiceNumber(body.invoice_number)
    if (invoiceNumber.error) {
      return { error: invoiceNumber.error }
    }
    fields.invoiceNumber = invoiceNumber.value
  }

  if (body.title !== undefined) {
    const title = parseTitle(body.title)
    if (title.error) {
      return { error: title.error }
    }
    fields.title = title.value
  }

  if (body.amount_cents !== undefined) {
    const amountCents = parseAmountCents(body.amount_cents)
    if (amountCents.error) {
      return { error: amountCents.error }
    }
    fields.amountCents = amountCents.value
  }

  if (body.issue_date !== undefined) {
    const issueDateError = validateCalendarDate(body.issue_date, 'issue_date')
    if (issueDateError) {
      return { error: issueDateError }
    }
    fields.issueDate = body.issue_date
  }

  if (body.due_date !== undefined) {
    const dueDateError = validateCalendarDate(body.due_date, 'due_date')
    if (dueDateError) {
      return { error: dueDateError }
    }
    fields.dueDate = body.due_date
  }

  if (body.status !== undefined) {
    const status = parseStatus(body.status, { required: true })
    if (status.error) {
      return { error: status.error }
    }
    fields.status = status.value
  }

  if (body.notes !== undefined) {
    const notes = parseNotes(body.notes)
    if (notes.error) {
      return { error: notes.error }
    }
    fields.notes = notes.value
  }

  if (body.paid_date !== undefined) {
    const paidDate = parsePaidDate(body.paid_date)
    if (paidDate.error) {
      return { error: paidDate.error }
    }
    fields.paidDate = paidDate.value
  }

  return { data: fields }
}

function isDuplicateEntryError(error) {
  return error?.code === 'ER_DUP_ENTRY'
}

function validateMarkPaidBody(body) {
  if (body === undefined) {
    return { data: { paidDate: getCurrentDateOnly() } }
  }

  const bodyError = assertJsonObject(body)
  if (bodyError) {
    return { error: bodyError }
  }

  const allowedFields = ['paid_date']
  const hasUnexpectedField = Object.keys(body).some(
    (field) => !allowedFields.includes(field),
  )

  if (hasUnexpectedField) {
    return { error: 'Only paid_date is allowed for this endpoint.' }
  }

  if (body.paid_date === undefined) {
    return { data: { paidDate: getCurrentDateOnly() } }
  }

  if (body.paid_date === null) {
    return { error: 'paid_date must be a valid date in YYYY-MM-DD format.' }
  }

  const paidDateError = validateCalendarDate(body.paid_date, 'paid_date')
  if (paidDateError) {
    return { error: paidDateError }
  }

  return { data: { paidDate: body.paid_date } }
}

export async function listInvoices(req, res) {
  const workspaceId = req.session.workspaceId
  const invoices = await findInvoicesByWorkspace(workspaceId)

  return res.json({
    ok: true,
    invoices: mapInvoiceResponses(invoices),
  })
}

export async function getInvoice(req, res) {
  const workspaceId = req.session.workspaceId
  const invoiceId = parseInvoiceId(req.params.id)

  if (!invoiceId) {
    return res.status(400).json({ ok: false, error: 'Invalid invoice id.' })
  }

  const invoice = await findInvoiceById(workspaceId, invoiceId)
  if (!invoice) {
    return res.status(404).json({ ok: false, error: 'Invoice not found.' })
  }

  return res.json({
    ok: true,
    invoice: mapInvoiceResponse(invoice),
  })
}

export async function createInvoiceHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const validation = validateCreateBody(req.body)

  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const client = await findClientById(workspaceId, validation.data.clientId)
  if (!client) {
    return res.status(404).json({ ok: false, error: 'Client not found.' })
  }

  try {
    const invoice = await createInvoice(workspaceId, validation.data)

    return res.status(201).json({
      ok: true,
      invoice: mapInvoiceResponse(invoice),
    })
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      return res.status(409).json({
        ok: false,
        error: 'An invoice with this number already exists in the workspace.',
      })
    }

    throw error
  }
}

export async function updateInvoiceHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const invoiceId = parseInvoiceId(req.params.id)

  if (!invoiceId) {
    return res.status(400).json({ ok: false, error: 'Invalid invoice id.' })
  }

  const validation = validatePatchBody(req.body)
  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const existingInvoice = await findInvoiceById(workspaceId, invoiceId)
  if (!existingInvoice) {
    return res.status(404).json({ ok: false, error: 'Invoice not found.' })
  }

  const updateFields = { ...validation.data }

  if (existingInvoice.status !== 'draft') {
    const disallowedFields = Object.keys(updateFields).filter(
      (field) => field !== 'notes',
    )

    if (disallowedFields.length > 0) {
      return res.status(400).json({
        ok: false,
        error:
          'Only notes can be edited after an invoice leaves draft status.',
      })
    }
  } else {
    if (updateFields.status && !PATCH_ALLOWED_STATUSES_FROM_DRAFT.includes(updateFields.status)) {
      return res.status(400).json({
        ok: false,
        error:
          'Draft invoices may only be updated with status draft or sent via this endpoint.',
      })
    }

    if (updateFields.paidDate !== undefined && updateFields.paidDate !== null) {
      return res.status(400).json({
        ok: false,
        error: 'paid_date must be null unless status is paid.',
      })
    }

    const nextIssueDate = updateFields.issueDate ?? existingInvoice.issue_date
    const nextDueDate = updateFields.dueDate ?? existingInvoice.due_date
    const dateOrderResult = validateIssueAndDueDateOrder(
      nextIssueDate,
      nextDueDate,
    )
    if (dateOrderResult.error) {
      const statusCode = dateOrderResult.isInternalDateError ? 500 : 400
      return res.status(statusCode).json({
        ok: false,
        error: dateOrderResult.error,
      })
    }

    if (updateFields.clientId !== undefined) {
      const client = await findClientById(workspaceId, updateFields.clientId)
      if (!client) {
        return res.status(404).json({ ok: false, error: 'Client not found.' })
      }
    }
  }

  try {
    const invoice = await updateInvoice(workspaceId, invoiceId, updateFields)

    if (!invoice) {
      return res.status(404).json({ ok: false, error: 'Invoice not found.' })
    }

    return res.json({
      ok: true,
      invoice: mapInvoiceResponse(invoice),
    })
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      return res.status(409).json({
        ok: false,
        error: 'An invoice with this number already exists in the workspace.',
      })
    }

    throw error
  }
}

export async function deleteInvoiceHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const invoiceId = parseInvoiceId(req.params.id)

  if (!invoiceId) {
    return res.status(400).json({ ok: false, error: 'Invalid invoice id.' })
  }

  const deleted = await deleteInvoice(workspaceId, invoiceId)
  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'Invoice not found.' })
  }

  return res.json({ ok: true })
}

export async function markInvoiceSentHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const invoiceId = parseInvoiceId(req.params.id)

  if (!invoiceId) {
    return res.status(400).json({ ok: false, error: 'Invalid invoice id.' })
  }

  const transitioned = await markInvoiceAsSent(workspaceId, invoiceId)

  if (!transitioned) {
    const existingInvoice = await findInvoiceById(workspaceId, invoiceId)

    if (!existingInvoice) {
      return res.status(404).json({ ok: false, error: 'Invoice not found.' })
    }

    return res.status(400).json({
      ok: false,
      error: 'Only draft invoices can be marked as sent.',
    })
  }

  const invoice = await findInvoiceById(workspaceId, invoiceId)
  if (!invoice) {
    return res.status(404).json({ ok: false, error: 'Invoice not found.' })
  }

  return res.json({
    ok: true,
    invoice: mapInvoiceResponse(invoice),
  })
}

export async function markInvoicePaidHandler(req, res) {
  const workspaceId = req.session.workspaceId
  const invoiceId = parseInvoiceId(req.params.id)

  if (!invoiceId) {
    return res.status(400).json({ ok: false, error: 'Invalid invoice id.' })
  }

  const validation = validateMarkPaidBody(req.body)
  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error })
  }

  const transitioned = await markInvoiceAsPaid(
    workspaceId,
    invoiceId,
    validation.data.paidDate,
  )

  if (!transitioned) {
    const existingInvoice = await findInvoiceById(workspaceId, invoiceId)

    if (!existingInvoice) {
      return res.status(404).json({ ok: false, error: 'Invoice not found.' })
    }

    return res.status(400).json({
      ok: false,
      error: 'Only draft or sent invoices can be marked as paid.',
    })
  }

  const invoice = await findInvoiceById(workspaceId, invoiceId)
  if (!invoice) {
    return res.status(404).json({ ok: false, error: 'Invoice not found.' })
  }

  return res.json({
    ok: true,
    invoice: mapInvoiceResponse(invoice),
  })
}
