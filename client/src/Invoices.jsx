import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AddInvoiceModal from './AddInvoiceModal'
import ConfirmModal from './ConfirmModal'
import InvoiceDetailDrawer from './InvoiceDetailDrawer'
import MarkInvoicePaidModal from './MarkInvoicePaidModal'
import * as clientsApi from './api/clients.js'
import * as invoicesApi from './api/invoices.js'
import { ApiError } from './api/client.js'
import Badge from './Badge'
import useConfirmDeleteState from './hooks/useConfirmDeleteState'
import useEditModalState from './hooks/useEditModalState'
import { IconPlus, IconSearch } from './icons'
import {
  SelectableTableRow,
  TableActions,
  TableEmptyState,
} from './tables/tablePrimitives'
import { INVOICE_STATUS_OPTIONS, getInvoiceStatusBadge } from './utils/badges'
import { mapClientsFromApi } from './utils/clientMapper'
import {
  formatDueDate,
  formatGBP,
  futureDateInt,
  parseDateOnlyInt,
  todayDateInt,
} from './utils/format'
import {
  mapInvoiceFormToApiPayload,
  mapInvoiceFromApi,
  mapInvoicesFromApi,
} from './utils/invoiceMapper'

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

function InvoiceListEmptyState({ invoiceCount, onAddInvoice }) {
  if (invoiceCount === 0) {
    return (
      <>
        <span className="invoices-table__empty-title">No invoices yet.</span>
        <span className="invoices-table__empty-hint">
          Create your first invoice to start tracking billing.
        </span>
        <button
          type="button"
          className="btn btn--primary invoices-table__empty-action"
          onClick={onAddInvoice}
        >
          <IconPlus />
          Add invoice
        </button>
      </>
    )
  }

  return 'No invoices match these filters.'
}

function InvoiceMobileCard({
  invoice,
  isSelected,
  onOpen,
  onEdit,
  onDelete,
}) {
  return (
    <li
      className={`invoices-card${isSelected ? ' invoices-card--selected' : ''}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for invoice ${invoice.invoiceNumber}`}
    >
      <div className="invoices-card__header">
        <div className="invoice-cell">
          <span className="invoice-cell__number">{invoice.invoiceNumber}</span>
          <span className="invoice-cell__title">{invoice.title}</span>
        </div>
        <Badge {...getInvoiceStatusBadge(invoice)} />
      </div>

      <dl className="invoices-card__meta">
        <div className="invoices-card__meta-row">
          <dt>Client</dt>
          <dd>{invoice.clientName}</dd>
        </div>
        <div className="invoices-card__meta-row">
          <dt>Amount</dt>
          <dd>{formatGBP(invoice.amountCents)}</dd>
        </div>
        <div className="invoices-card__meta-row">
          <dt>Issue date</dt>
          <dd>{formatDueDate(invoice.issueDate)}</dd>
        </div>
        <div className="invoices-card__meta-row">
          <dt>Due date</dt>
          <dd>{formatDueDate(invoice.dueDate)}</dd>
        </div>
      </dl>

      <div
        className="invoices-card__actions"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <TableActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </li>
  )
}

export default function Invoices() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invoiceIdParam = searchParams.get('invoiceId')
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [deepLinkFetchStatus, setDeepLinkFetchStatus] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [dueFilter, setDueFilter] = useState('all')
  const [sortKey, setSortKey] = useState('recently-updated')
  const [saveError, setSaveError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [markSentTarget, setMarkSentTarget] = useState(null)
  const [markSentError, setMarkSentError] = useState(null)
  const [isMarkingSent, setIsMarkingSent] = useState(false)
  const [markPaidTarget, setMarkPaidTarget] = useState(null)
  const [markPaidError, setMarkPaidError] = useState(null)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [drawerActionError, setDrawerActionError] = useState(null)
  const {
    isOpen: isModalOpen,
    editingItem: editingInvoice,
    openAdd: openAddModal,
    openEdit: openEditModal,
    close: closeModal,
  } = useEditModalState()
  const {
    deletingItem: deletingInvoice,
    openDelete: openDeleteModal,
    closeDelete: closeDeleteModal,
  } = useConfirmDeleteState()
  const saveInFlightRef = useRef(false)
  const deleteInFlightRef = useRef(false)
  const markSentInFlightRef = useRef(false)
  const markPaidInFlightRef = useRef(false)
  const deepLinkFetchRef = useRef(null)

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

    Promise.all([requestInvoicesList(), clientsApi.listClients()])
      .then(([nextInvoices, clientsData]) => {
        if (cancelled) return
        setInvoices(nextInvoices)
        setClients(mapClientsFromApi(clientsData.clients ?? []))
        setLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setInvoices([])
        setClients([])
        setLoadStatus('error')
        setLoadError(getInvoicesLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const clientOptions = useMemo(
    () =>
      [...clients]
        .map((client) => ({ id: client.id, name: client.company }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  )

  const summary = useMemo(() => computeInvoiceSummary(invoices), [invoices])

  const modalInvoice = useMemo(() => {
    if (!editingInvoice) return null
    return invoices.find((item) => item.id === editingInvoice.id) ?? editingInvoice
  }, [editingInvoice, invoices])

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

  const parsedInvoiceId = useMemo(() => {
    if (!invoiceIdParam) return null
    const invoiceId = Number(invoiceIdParam)
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) return null
    return invoiceId
  }, [invoiceIdParam])

  const deepLinkInvoice = useMemo(() => {
    if (loadStatus !== 'ready' || parsedInvoiceId == null) return null
    return invoices.find((invoice) => invoice.id === parsedInvoiceId) ?? null
  }, [loadStatus, parsedInvoiceId, invoices])

  const deepLinkUnavailable = useMemo(() => {
    if (loadStatus !== 'ready' || parsedInvoiceId == null) return false
    if (deepLinkInvoice) return false
    return deepLinkFetchStatus === 'error'
  }, [loadStatus, parsedInvoiceId, deepLinkInvoice, deepLinkFetchStatus])

  const isDeepLinkLoading = useMemo(() => {
    if (loadStatus !== 'ready' || parsedInvoiceId == null) return false
    if (deepLinkInvoice) return false
    return deepLinkFetchStatus === 'loading'
  }, [loadStatus, parsedInvoiceId, deepLinkInvoice, deepLinkFetchStatus])

  const isDrawerOpen = Boolean(invoiceIdParam && parsedInvoiceId != null)

  const replaceInvoiceInState = useCallback((savedInvoice) => {
    setInvoices((current) => {
      const exists = current.some((item) => item.id === savedInvoice.id)
      if (exists) {
        return current.map((item) =>
          item.id === savedInvoice.id ? savedInvoice : item,
        )
      }
      return [...current, savedInvoice]
    })
  }, [])

  useEffect(() => {
    if (parsedInvoiceId == null) {
      deepLinkFetchRef.current = null
      return
    }

    if (deepLinkFetchRef.current !== parsedInvoiceId) {
      deepLinkFetchRef.current = null
    }
  }, [parsedInvoiceId])

  useEffect(() => {
    if (loadStatus !== 'ready' || parsedInvoiceId == null) {
      return undefined
    }

    if (invoices.some((invoice) => invoice.id === parsedInvoiceId)) {
      return undefined
    }

    if (deepLinkFetchRef.current === parsedInvoiceId) {
      return undefined
    }

    deepLinkFetchRef.current = parsedInvoiceId
    let cancelled = false

    void invoicesApi
      .getInvoice(parsedInvoiceId)
      .then((data) => {
        if (cancelled) return
        const invoice = mapInvoiceFromApi(data.invoice)
        setInvoices((current) => {
          if (current.some((item) => item.id === invoice.id)) {
            return current.map((item) => (item.id === invoice.id ? invoice : item))
          }
          return [...current, invoice]
        })
        setDeepLinkFetchStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setDeepLinkFetchStatus('error')
      })

    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) {
        setDeepLinkFetchStatus('loading')
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(loadingTimer)
    }
  }, [loadStatus, parsedInvoiceId, invoices])

  function handleOpenInvoiceDrawer(invoice) {
    setDrawerActionError(null)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('invoiceId', String(invoice.id))
    navigate({
      pathname: location.pathname,
      search: `?${nextParams.toString()}`,
    })
  }

  function handleCloseInvoiceDrawer() {
    setDrawerActionError(null)

    if (!invoiceIdParam) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('invoiceId')
    const nextSearch = nextParams.toString()

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    )
  }

  function handleOpenAddModal() {
    setSaveError(null)
    openAddModal()
  }

  function handleOpenEditModal(invoice) {
    setSaveError(null)
    openEditModal(invoice)
  }

  function handleCloseModal() {
    if (isSaving || isMarkingPaid) return
    setSaveError(null)
    closeModal()
  }

  async function handleSaveInvoice(form, { notesOnly = false } = {}) {
    if (saveInFlightRef.current) return
    saveInFlightRef.current = true
    setIsSaving(true)
    setSaveError(null)

    const payload = mapInvoiceFormToApiPayload(form, { notesOnly })

    try {
      if (editingInvoice) {
        const data = await invoicesApi.updateInvoice(editingInvoice.id, payload)
        const savedInvoice = mapInvoiceFromApi(data.invoice)
        replaceInvoiceInState(savedInvoice)
      } else {
        const data = await invoicesApi.createInvoice(payload)
        const savedInvoice = mapInvoiceFromApi(data.invoice)
        setInvoices((current) => [...current, savedInvoice])
      }

      closeModal()
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : editingInvoice
            ? 'Unable to save invoice. Try again.'
            : 'Unable to create invoice. Try again.',
      )
    } finally {
      saveInFlightRef.current = false
      setIsSaving(false)
    }
  }

  function handleOpenDeleteModal(invoice) {
    setDeleteError(null)
    openDeleteModal(invoice)
  }

  function handleCloseDeleteModal() {
    if (isDeleting) return
    setDeleteError(null)
    closeDeleteModal()
  }

  async function confirmDeleteInvoice() {
    if (!deletingInvoice) return
    if (deleteInFlightRef.current) return
    deleteInFlightRef.current = true
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await invoicesApi.deleteInvoice(deletingInvoice.id)
      setInvoices((current) =>
        current.filter((item) => item.id !== deletingInvoice.id),
      )
      closeDeleteModal()

      if (parsedInvoiceId === deletingInvoice.id) {
        handleCloseInvoiceDrawer()
      }
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : 'Unable to delete invoice. Try again.',
      )
    } finally {
      deleteInFlightRef.current = false
      setIsDeleting(false)
    }
  }

  function handleOpenMarkSent(invoice) {
    setMarkSentError(null)
    setMarkSentTarget(invoice)
  }

  function handleCloseMarkSentModal() {
    if (isMarkingSent) return
    setMarkSentError(null)
    setMarkSentTarget(null)
  }

  async function confirmMarkSent() {
    if (!markSentTarget) return
    if (markSentInFlightRef.current) return
    markSentInFlightRef.current = true
    setIsMarkingSent(true)
    setMarkSentError(null)
    setDrawerActionError(null)

    try {
      const data = await invoicesApi.markInvoiceSent(markSentTarget.id)
      const savedInvoice = mapInvoiceFromApi(data.invoice)
      replaceInvoiceInState(savedInvoice)
      setMarkSentTarget(null)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to mark invoice as sent. Try again.'
      setMarkSentError(message)
      setDrawerActionError(message)
    } finally {
      markSentInFlightRef.current = false
      setIsMarkingSent(false)
    }
  }

  function handleOpenMarkPaid(invoice) {
    setMarkPaidError(null)
    setMarkPaidTarget(invoice)
  }

  function handleCloseMarkPaidModal() {
    if (isMarkingPaid) return
    setMarkPaidError(null)
    setMarkPaidTarget(null)
  }

  async function markInvoiceAsPaid(invoice, paidDate) {
    if (markPaidInFlightRef.current) return false
    markPaidInFlightRef.current = true
    setIsMarkingPaid(true)
    setMarkPaidError(null)
    setDrawerActionError(null)

    try {
      const data = await invoicesApi.markInvoicePaid(invoice.id, {
        paid_date: paidDate,
      })
      const savedInvoice = mapInvoiceFromApi(data.invoice)
      replaceInvoiceInState(savedInvoice)
      setMarkPaidTarget(null)
      return true
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to mark invoice as paid. Try again.'
      setMarkPaidError(message)
      setDrawerActionError(message)
      return false
    } finally {
      markPaidInFlightRef.current = false
      setIsMarkingPaid(false)
    }
  }

  async function confirmMarkPaid(paidDate) {
    if (!markPaidTarget) return
    await markInvoiceAsPaid(markPaidTarget, paidDate)
  }

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
      {(deepLinkUnavailable || (invoiceIdParam && parsedInvoiceId == null)) ? (
        <p className="invoices-deeplink-unavailable" role="alert">
          Invoice unavailable.
        </p>
      ) : null}

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

      <div className="invoices-toolbar">
        <div className="invoices-toolbar__primary">
          <label className="invoices-search invoices-toolbar__search">
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
          <button
            type="button"
            className="btn btn--primary invoices-toolbar__action"
            onClick={handleOpenAddModal}
          >
            <IconPlus />
            Add invoice
          </button>
        </div>

        <div className="invoices-toolbar__filters">
          <label className="invoices-toolbar__field">
            <span className="invoices-toolbar__label">Status</span>
            <select
              className="invoices-toolbar__select"
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

          <label className="invoices-toolbar__field">
            <span className="invoices-toolbar__label">Client</span>
            <select
              className="invoices-toolbar__select"
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

          <label className="invoices-toolbar__field">
            <span className="invoices-toolbar__label">Due state</span>
            <select
              className="invoices-toolbar__select"
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

          <label className="invoices-toolbar__field">
            <span className="invoices-toolbar__label">Sort</span>
            <select
              className="invoices-toolbar__select"
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

      <div className="invoices-table-card">
        <div className="invoices-table-desktop">
          <table className="invoices-table">
            <colgroup>
              <col className="invoices-table__col invoices-table__col--invoice" />
              <col className="invoices-table__col invoices-table__col--client" />
              <col className="invoices-table__col invoices-table__col--amount" />
              <col className="invoices-table__col invoices-table__col--status" />
              <col className="invoices-table__col invoices-table__col--issue" />
              <col className="invoices-table__col invoices-table__col--due" />
              <col className="invoices-table__col invoices-table__col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="invoices-table__invoice-col">
                  Invoice
                </th>
                <th scope="col" className="invoices-table__client-col">
                  Client
                </th>
                <th scope="col" className="invoices-table__align-right invoices-table__amount-col">
                  Amount
                </th>
                <th scope="col" className="invoices-table__status-col">
                  Status
                </th>
                <th scope="col" className="invoices-table__align-right invoices-table__date-col">
                  Issue date
                </th>
                <th scope="col" className="invoices-table__align-right invoices-table__date-col">
                  Due date
                </th>
                <th
                  scope="col"
                  className="invoices-table__align-right invoices-table__actions-col"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <SelectableTableRow
                    key={invoice.id}
                    isSelected={parsedInvoiceId === invoice.id}
                    rowClassName="invoices-table__row"
                    selectedClassName="invoices-table__row--selected"
                    ariaLabel={`View details for invoice ${invoice.invoiceNumber}`}
                    onOpen={() => handleOpenInvoiceDrawer(invoice)}
                  >
                    <td className="invoices-table__invoice-col">
                      <div className="invoice-cell">
                        <span className="invoice-cell__number">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="invoice-cell__title">{invoice.title}</span>
                      </div>
                    </td>
                    <td className="invoices-table__client invoices-table__client-col">
                      {invoice.clientName}
                    </td>
                    <td className="invoices-table__align-right invoices-table__amount invoices-table__amount-col">
                      {formatGBP(invoice.amountCents)}
                    </td>
                    <td className="invoices-table__status-col">
                      <Badge {...getInvoiceStatusBadge(invoice)} />
                    </td>
                    <td className="invoices-table__align-right invoices-table__date invoices-table__date-col">
                      {formatDueDate(invoice.issueDate)}
                    </td>
                    <td className="invoices-table__align-right invoices-table__date invoices-table__date-col">
                      {formatDueDate(invoice.dueDate)}
                    </td>
                    <td className="invoices-table__actions-col">
                      <div className="invoices-table__actions">
                        <TableActions
                          onEdit={() => handleOpenEditModal(invoice)}
                          onDelete={() => handleOpenDeleteModal(invoice)}
                        />
                      </div>
                    </td>
                  </SelectableTableRow>
                ))
              ) : (
                <TableEmptyState colSpan={7} className="invoices-table__empty">
                  <InvoiceListEmptyState
                    invoiceCount={invoices.length}
                    onAddInvoice={handleOpenAddModal}
                  />
                </TableEmptyState>
              )}
            </tbody>
          </table>
        </div>

        <ul className="invoices-card-list" aria-label="Invoices">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <InvoiceMobileCard
                key={invoice.id}
                invoice={invoice}
                isSelected={parsedInvoiceId === invoice.id}
                onOpen={() => handleOpenInvoiceDrawer(invoice)}
                onEdit={() => handleOpenEditModal(invoice)}
                onDelete={() => handleOpenDeleteModal(invoice)}
              />
            ))
          ) : (
            <li className="invoices-card invoices-card--empty">
              <InvoiceListEmptyState
                invoiceCount={invoices.length}
                onAddInvoice={handleOpenAddModal}
              />
            </li>
          )}
        </ul>

        <footer className="invoices-table__footer">
          {`Showing ${filteredInvoices.length} of ${invoices.length} invoices`}
        </footer>
      </div>

      <AddInvoiceModal
        isOpen={isModalOpen}
        invoice={modalInvoice}
        onClose={handleCloseModal}
        onSubmit={handleSaveInvoice}
        onRequestMarkPaid={handleOpenMarkPaid}
        clients={clients}
        isSubmitting={isSaving}
        isMarkingPaid={isMarkingPaid}
        serverError={saveError}
      />

      {isDrawerOpen ? (
        <InvoiceDetailDrawer
          invoice={deepLinkInvoice}
          isLoading={isDeepLinkLoading}
          actionError={drawerActionError}
          isMarkingSent={isMarkingSent}
          isMarkingPaid={isMarkingPaid}
          onClose={handleCloseInvoiceDrawer}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onMarkSent={handleOpenMarkSent}
          onMarkPaid={handleOpenMarkPaid}
        />
      ) : null}

      <ConfirmModal
        isOpen={Boolean(deletingInvoice)}
        title="Delete invoice?"
        description="This invoice will be permanently deleted."
        confirmLabel="Delete invoice"
        error={deleteError}
        isConfirming={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteInvoice}
      />

      <ConfirmModal
        isOpen={Boolean(markSentTarget)}
        title="Mark invoice as sent?"
        description={
          markSentTarget
            ? `${markSentTarget.invoiceNumber} will move from draft to sent.`
            : ''
        }
        confirmLabel="Mark as sent"
        confirmingLabel="Marking…"
        confirmClassName="btn--primary"
        error={markSentError}
        isConfirming={isMarkingSent}
        onClose={handleCloseMarkSentModal}
        onConfirm={confirmMarkSent}
      />

      <MarkInvoicePaidModal
        isOpen={Boolean(markPaidTarget)}
        invoice={markPaidTarget}
        onClose={handleCloseMarkPaidModal}
        onConfirm={confirmMarkPaid}
        isSubmitting={isMarkingPaid}
        serverError={markPaidError}
      />
    </div>
  )
}
