import { useCallback, useEffect, useMemo, useState } from 'react'
import * as invoicesApi from './api/invoices.js'
import { ApiError } from './api/client.js'
import Badge from './Badge'
import { IconSearch } from './icons'
import { TableCard, TableEmptyState } from './tables/tablePrimitives'
import { INVOICE_STATUS_OPTIONS, getInvoiceStatusBadge } from './utils/badges'
import {
  formatDueDate,
  formatGBP,
  futureDateInt,
  parseDateOnlyInt,
  todayDateInt,
} from './utils/format'
import { mapInvoicesFromApi } from './utils/invoiceMapper'

const INVOICE_SORT_OPTIONS = [
  { value: 'recently-updated', label: 'Recently updated' },
  { value: 'due-date', label: 'Due date' },
  { value: 'amount-desc', label: 'Amount high to low' },
  { value: 'amount-asc', label: 'Amount low to high' },
  { value: 'invoice-number', label: 'Invoice number' },
]

const INVOICE_DUE_FILTER_OPTIONS = [
  { value: 'all', label: 'All due states' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due-soon', label: 'Due soon' },
  { value: 'future', label: 'Future' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

function parseTimestamp(value) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

function compareIdsDesc(a, b) {
  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB)) return idB - idA
  return 0
}

function getInvoicesLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load invoices. Try again.'
}

async function requestInvoicesList() {
  const data = await invoicesApi.listInvoices()
  return mapInvoicesFromApi(data.invoices ?? [])
}

function filterInvoicesBySearch(invoices, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return invoices

  return invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(normalized) ||
      invoice.clientName.toLowerCase().includes(normalized) ||
      invoice.title.toLowerCase().includes(normalized),
  )
}

function matchesInvoiceDueFilter(invoice, dueFilter) {
  if (dueFilter === 'all') return true

  if (dueFilter === 'overdue') {
    return invoice.isOverdue
  }

  if (dueFilter === 'paid') {
    return invoice.status === 'paid'
  }

  if (dueFilter === 'cancelled') {
    return invoice.status === 'cancelled'
  }

  if (invoice.status !== 'sent' || invoice.isOverdue) {
    return false
  }

  const dueInt = parseDateOnlyInt(invoice.dueDate)
  if (dueInt == null) return false

  const today = todayDateInt()
  const dueSoonEnd = futureDateInt(7)

  if (dueFilter === 'due-soon') {
    return dueInt >= today && dueInt <= dueSoonEnd
  }

  if (dueFilter === 'future') {
    return dueInt > dueSoonEnd
  }

  return true
}

function sortInvoices(invoices, sortKey) {
  const sorted = [...invoices]

  if (sortKey === 'invoice-number') {
    sorted.sort((a, b) => {
      const byNumber = a.invoiceNumber.localeCompare(b.invoiceNumber)
      if (byNumber !== 0) return byNumber
      return compareIdsDesc(a, b)
    })
    return sorted
  }

  if (sortKey === 'amount-desc' || sortKey === 'amount-asc') {
    const direction = sortKey === 'amount-desc' ? -1 : 1
    sorted.sort((a, b) => {
      const amountDiff = (a.amountCents - b.amountCents) * direction
      if (amountDiff !== 0) return amountDiff
      const byNumber = a.invoiceNumber.localeCompare(b.invoiceNumber)
      if (byNumber !== 0) return byNumber
      return compareIdsDesc(a, b)
    })
    return sorted
  }

  if (sortKey === 'recently-updated') {
    sorted.sort((a, b) => {
      const timeA = parseTimestamp(a.updatedAt)
      const timeB = parseTimestamp(b.updatedAt)
      if (timeA == null && timeB == null) return compareIdsDesc(a, b)
      if (timeA == null) return 1
      if (timeB == null) return -1
      if (timeB !== timeA) return timeB - timeA
      return compareIdsDesc(a, b)
    })
    return sorted
  }

  sorted.sort((a, b) => {
    const dueA = parseDateOnlyInt(a.dueDate)
    const dueB = parseDateOnlyInt(b.dueDate)
    if (dueA == null && dueB == null) return compareIdsDesc(a, b)
    if (dueA == null) return 1
    if (dueB == null) return -1
    if (dueA !== dueB) return dueA - dueB
    return compareIdsDesc(a, b)
  })

  return sorted
}

function applyInvoiceFilters(
  invoices,
  { query, statusFilter, clientFilter, dueFilter, sortKey },
) {
  let result = filterInvoicesBySearch(invoices, query)

  if (statusFilter !== 'all') {
    result = result.filter((invoice) => invoice.status === statusFilter)
  }

  if (clientFilter !== 'all') {
    result = result.filter(
      (invoice) => String(invoice.clientId) === clientFilter,
    )
  }

  if (dueFilter !== 'all') {
    result = result.filter((invoice) =>
      matchesInvoiceDueFilter(invoice, dueFilter),
    )
  }

  return sortInvoices(result, sortKey)
}

function computeInvoiceSummary(invoices) {
  let outstandingCents = 0
  let overdueCents = 0
  let paidCents = 0

  for (const invoice of invoices) {
    if (invoice.status === 'sent') {
      outstandingCents += invoice.amountCents
    }

    if (invoice.isOverdue) {
      overdueCents += invoice.amountCents
    }

    if (invoice.status === 'paid') {
      paidCents += invoice.amountCents
    }
  }

  return {
    totalCount: invoices.length,
    outstandingCents,
    overdueCents,
    paidCents,
  }
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [dueFilter, setDueFilter] = useState('all')
  const [sortKey, setSortKey] = useState('recently-updated')

  const fetchInvoices = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      setInvoices(await requestInvoicesList())
      setLoadStatus('ready')
    } catch (err) {
      setInvoices([])
      setLoadStatus('error')
      setLoadError(getInvoicesLoadError(err))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    requestInvoicesList()
      .then((nextInvoices) => {
        if (cancelled) return
        setInvoices(nextInvoices)
        setLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setInvoices([])
        setLoadStatus('error')
        setLoadError(getInvoicesLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const clientOptions = useMemo(() => {
    const byId = new Map()

    for (const invoice of invoices) {
      if (!byId.has(invoice.clientId)) {
        byId.set(invoice.clientId, invoice.clientName)
      }
    }

    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [invoices])

  const summary = useMemo(() => computeInvoiceSummary(invoices), [invoices])

  const filteredInvoices = useMemo(
    () =>
      applyInvoiceFilters(invoices, {
        query,
        statusFilter,
        clientFilter,
        dueFilter,
        sortKey,
      }),
    [invoices, query, statusFilter, clientFilter, dueFilter, sortKey],
  )

  if (loadStatus === 'loading') {
    return (
      <div className="invoices invoices-state">
        <p className="invoices-state__message">Loading invoices…</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="invoices invoices-state">
        <p className="invoices-state__message invoices-state__message--error" role="alert">
          {loadError}
        </p>
        <button type="button" className="btn btn--secondary" onClick={fetchInvoices}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="invoices">
      <section className="invoices-summary" aria-label="Invoice summary">
        <article className="invoices-summary__card">
          <span className="invoices-summary__label">Total invoices</span>
          <span className="invoices-summary__value">{summary.totalCount}</span>
        </article>
        <article className="invoices-summary__card">
          <span className="invoices-summary__label">Outstanding</span>
          <span className="invoices-summary__value">
            {formatGBP(summary.outstandingCents)}
          </span>
        </article>
        <article className="invoices-summary__card">
          <span className="invoices-summary__label">Overdue</span>
          <span className="invoices-summary__value invoices-summary__value--danger">
            {formatGBP(summary.overdueCents)}
          </span>
        </article>
        <article className="invoices-summary__card">
          <span className="invoices-summary__label">Paid</span>
          <span className="invoices-summary__value invoices-summary__value--success">
            {formatGBP(summary.paidCents)}
          </span>
        </article>
      </section>

      <div className="invoices-toolbar list-controls">
        <label className="invoices-search list-controls__search">
          <IconSearch className="invoices-search__icon" />
          <input
            type="search"
            className="invoices-search__input"
            placeholder="Search by invoice number, client, or title..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search invoices"
          />
        </label>

        <div className="invoices-toolbar__filters list-controls__selects">
          <label className="list-controls__field">
            <span className="list-controls__label">Status</span>
            <select
              className="list-controls__select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {INVOICE_STATUS_OPTIONS.filter(
                (option) => option.value !== 'overdue',
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="list-controls__field">
            <span className="list-controls__label">Client</span>
            <select
              className="list-controls__select"
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              aria-label="Filter by client"
            >
              <option value="all">All clients</option>
              {clientOptions.map((client) => (
                <option key={client.id} value={String(client.id)}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="list-controls__field">
            <span className="list-controls__label">Due state</span>
            <select
              className="list-controls__select"
              value={dueFilter}
              onChange={(event) => setDueFilter(event.target.value)}
              aria-label="Filter by due state"
            >
              {INVOICE_DUE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="list-controls__field">
            <span className="list-controls__label">Sort</span>
            <select
              className="list-controls__select"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              aria-label="Sort invoices"
            >
              {INVOICE_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <TableCard
        cardClassName="invoices-table-card"
        footerClassName="invoices-table__footer"
        footerText={`Showing ${filteredInvoices.length} of ${invoices.length} invoices`}
      >
        <table className="invoices-table">
          <thead>
            <tr>
              <th scope="col">Invoice</th>
              <th scope="col">Client</th>
              <th scope="col" className="invoices-table__align-right">
                Amount
              </th>
              <th scope="col">Status</th>
              <th scope="col" className="invoices-table__align-right">
                Issue date
              </th>
              <th scope="col" className="invoices-table__align-right">
                Due date
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="invoices-table__row">
                  <td>
                    <div className="invoice-cell">
                      <span className="invoice-cell__number">
                        {invoice.invoiceNumber}
                      </span>
                      <span className="invoice-cell__title">{invoice.title}</span>
                    </div>
                  </td>
                  <td className="invoices-table__client">{invoice.clientName}</td>
                  <td className="invoices-table__align-right invoices-table__amount">
                    {formatGBP(invoice.amountCents)}
                  </td>
                  <td>
                    <Badge {...getInvoiceStatusBadge(invoice)} />
                  </td>
                  <td className="invoices-table__align-right invoices-table__date">
                    {formatDueDate(invoice.issueDate)}
                  </td>
                  <td className="invoices-table__align-right invoices-table__date">
                    {formatDueDate(invoice.dueDate)}
                  </td>
                </tr>
              ))
            ) : (
              <TableEmptyState colSpan={6} className="invoices-table__empty">
                {invoices.length === 0
                  ? 'No invoices yet.'
                  : 'No invoices match these filters.'}
              </TableEmptyState>
            )}
          </tbody>
        </table>
      </TableCard>
    </div>
  )
}
