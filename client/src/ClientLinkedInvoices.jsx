import { useCallback, useEffect, useRef, useState } from 'react'
import * as invoicesApi from './api/invoices.js'
import { ApiError } from './api/client.js'
import Badge from './Badge'
import { getInvoiceStatusBadge } from './utils/badges'
import { formatDueDate, formatGBP } from './utils/format'
import { mapInvoicesFromApi } from './utils/invoiceMapper'

function getInvoicesLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load linked invoices. Try again.'
}

export default function ClientLinkedInvoices({
  clientId,
  onOpenInvoice,
  onCreateInvoice,
  invoicesRevision,
}) {
  const [invoices, setInvoices] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const fetchGenerationRef = useRef(0)

  const fetchInvoices = useCallback(async () => {
    const generation = fetchGenerationRef.current + 1
    fetchGenerationRef.current = generation
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const data = await invoicesApi.listClientInvoices(clientId)
      if (fetchGenerationRef.current !== generation) return
      setInvoices(mapInvoicesFromApi(data.invoices ?? []))
      setLoadStatus('ready')
    } catch (err) {
      if (fetchGenerationRef.current !== generation) return
      setInvoices([])
      setLoadStatus('error')
      setLoadError(getInvoicesLoadError(err))
    }
  }, [clientId])

  useEffect(() => {
    let cancelled = false
    const generation = fetchGenerationRef.current + 1
    fetchGenerationRef.current = generation

    invoicesApi
      .listClientInvoices(clientId)
      .then((data) => {
        if (cancelled || fetchGenerationRef.current !== generation) return
        setInvoices(mapInvoicesFromApi(data.invoices ?? []))
        setLoadStatus('ready')
        setLoadError(null)
      })
      .catch((err) => {
        if (cancelled || fetchGenerationRef.current !== generation) return
        setInvoices([])
        setLoadStatus('error')
        setLoadError(getInvoicesLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [clientId, invoicesRevision])

  return (
    <section className="drawer-linked-invoices" aria-label="Linked invoices">
      <header className="drawer-linked-invoices__header">
        <h3 className="drawer-linked-invoices__title">Linked invoices</h3>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onCreateInvoice}
        >
          Create invoice
        </button>
      </header>

      {loadStatus === 'loading' ? (
        <p className="drawer-linked-invoices__status">Loading linked invoices…</p>
      ) : null}

      {loadStatus === 'error' ? (
        <div className="drawer-linked-invoices__status drawer-linked-invoices__status--error">
          <p role="alert">{loadError}</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={fetchInvoices}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loadStatus === 'ready' ? (
        invoices.length > 0 ? (
          <ul className="drawer-linked-invoices__list">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="drawer-linked-invoices__item">
                <div className="drawer-linked-invoices__item-main">
                  <p className="drawer-linked-invoices__number">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="drawer-linked-invoices__title-text">{invoice.title}</p>
                  <div className="drawer-linked-invoices__meta">
                    <span className="drawer-linked-invoices__amount">
                      {formatGBP(invoice.amountCents)}
                    </span>
                    <Badge {...getInvoiceStatusBadge(invoice)} />
                    <span className="drawer-linked-invoices__due">
                      Due {formatDueDate(invoice.dueDate)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm drawer-linked-invoices__view-btn"
                  onClick={() => onOpenInvoice(invoice.id)}
                  aria-label={`View invoice ${invoice.invoiceNumber}`}
                >
                  View invoice
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="drawer-linked-invoices__empty">
            No invoices linked to this client.
          </p>
        )
      ) : null}
    </section>
  )
}
