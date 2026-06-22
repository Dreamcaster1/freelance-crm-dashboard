import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as clientsApi from './api/clients.js'
import { ApiError } from './api/client.js'
import Badge from './Badge'
import {
  mapClientFromApi,
  mapClientsFromApi,
} from './utils/clientMapper'
import {
  getClientStatusBadge,
  PIPELINE_STAGE_OPTIONS,
} from './utils/badges'
import { formatCurrency } from './utils/format'

function getPipelineLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load pipeline. Try again.'
}

function getPipelineMoveError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to update pipeline stage. Try again.'
}

function getDisplayStage(client) {
  return client.pipelineStage ?? 'lead'
}

function groupClientsByStage(clients) {
  const groups = Object.fromEntries(
    PIPELINE_STAGE_OPTIONS.map((option) => [option.value, []]),
  )

  for (const client of clients) {
    const stage = getDisplayStage(client)
    groups[stage].push(client)
  }

  return groups
}

async function requestPipelineClients() {
  const data = await clientsApi.listClients()
  return mapClientsFromApi(data.clients)
}

function PipelineCard({
  client,
  isMoving,
  onStageChange,
}) {
  const displayStage = getDisplayStage(client)
  const selectValue = client.pipelineStage ?? displayStage
  const selectId = `pipeline-stage-${client.id}`

  return (
    <article className="pipeline-card">
      <div className="pipeline-card__body">
        <h3 className="pipeline-card__company">{client.company}</h3>
        <p className="pipeline-card__contact">
          {client.contact}
          {client.pipelineStage == null ? (
            <span className="pipeline-card__hint"> · Unassigned</span>
          ) : null}
        </p>
        <div className="pipeline-card__meta">
          <Badge {...getClientStatusBadge(client.status)} />
          <span className="pipeline-card__value">
            {formatCurrency(client.projectValue)}
          </span>
        </div>
      </div>

      <footer className="pipeline-card__footer">
        <label className="pipeline-card__move-label" htmlFor={selectId}>
          Move
        </label>
        <select
          id={selectId}
          className="pipeline-card__stage-select"
          value={selectValue}
          onChange={(event) => onStageChange(client.id, event.target.value)}
          disabled={isMoving}
          aria-label={`Change pipeline stage for ${client.company}`}
        >
          {PIPELINE_STAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </footer>
    </article>
  )
}

function PipelineColumn({ stageId, label, clients, movingClientId, onStageChange }) {
  return (
    <section
      className={`pipeline-column pipeline-column--${stageId}`}
      aria-label={`${label} stage`}
    >
      <header className="pipeline-column__header">
        <div className="pipeline-column__title-group">
          <span className="pipeline-column__marker" aria-hidden="true" />
          <h2 className="pipeline-column__title">{label}</h2>
        </div>
        <span className="pipeline-column__count">{clients.length}</span>
      </header>

      <div className="pipeline-column__body">
        {clients.length > 0 ? (
          <ul className="pipeline-column__list">
            {clients.map((client) => (
              <li key={client.id}>
                <PipelineCard
                  client={client}
                  isMoving={movingClientId === client.id}
                  onStageChange={onStageChange}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="pipeline-column__empty">No clients</p>
        )}
      </div>
    </section>
  )
}

export default function Pipeline() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [moveError, setMoveError] = useState(null)
  const [movingClientId, setMovingClientId] = useState(null)
  const moveInFlightRef = useRef(new Set())

  const fetchClients = useCallback(async () => {
    setLoadStatus('loading')
    setLoadError(null)

    try {
      setClients(await requestPipelineClients())
      setLoadStatus('ready')
    } catch (err) {
      setClients([])
      setLoadStatus('error')
      setLoadError(getPipelineLoadError(err))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    requestPipelineClients()
      .then((nextClients) => {
        if (cancelled) return
        setClients(nextClients)
        setLoadStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setClients([])
        setLoadStatus('error')
        setLoadError(getPipelineLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const groupedClients = useMemo(
    () => groupClientsByStage(clients),
    [clients],
  )

  async function handleStageChange(clientId, nextStage) {
    if (moveInFlightRef.current.has(clientId)) return

    const previousClient = clients.find((client) => client.id === clientId)
    if (!previousClient || getDisplayStage(previousClient) === nextStage) return

    moveInFlightRef.current.add(clientId)
    setMovingClientId(clientId)
    setMoveError(null)

    setClients((current) =>
      current.map((client) =>
        client.id === clientId
          ? { ...client, pipelineStage: nextStage }
          : client,
      ),
    )

    try {
      const data = await clientsApi.updateClient(clientId, {
        pipeline_stage: nextStage,
      })
      const savedClient = mapClientFromApi(data.client)

      setClients((current) =>
        current.map((client) =>
          client.id === clientId ? savedClient : client,
        ),
      )
    } catch (err) {
      setClients((current) =>
        current.map((client) =>
          client.id === clientId ? previousClient : client,
        ),
      )
      setMoveError(getPipelineMoveError(err))
    } finally {
      moveInFlightRef.current.delete(clientId)
      setMovingClientId(null)
    }
  }

  if (loadStatus === 'loading') {
    return (
      <div className="pipeline pipeline-state">
        <p className="pipeline-state__message">Loading pipeline…</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="pipeline pipeline-state">
        <p className="pipeline-state__message pipeline-state__message--error">
          {loadError}
        </p>
        <button type="button" className="btn btn--secondary" onClick={fetchClients}>
          Try again
        </button>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="pipeline pipeline-state">
        <p className="pipeline-state__title">No clients in your pipeline</p>
        <p className="pipeline-state__message">
          Add a client to begin tracking opportunities.
        </p>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate('/clients')}
        >
          Go to Clients
        </button>
      </div>
    )
  }

  return (
    <div className="pipeline">
      {moveError ? (
        <p className="pipeline__move-error" role="alert">
          {moveError}
        </p>
      ) : null}

      <div className="pipeline-board">
        {PIPELINE_STAGE_OPTIONS.map((stage) => (
          <PipelineColumn
            key={stage.value}
            stageId={stage.value}
            label={stage.label}
            clients={groupedClients[stage.value]}
            movingClientId={movingClientId}
            onStageChange={handleStageChange}
          />
        ))}
      </div>
    </div>
  )
}
