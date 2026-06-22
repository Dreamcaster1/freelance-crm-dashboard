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
  isDragging,
  desktopDragEnabled,
  onDragStart,
  onDragEnd,
  onStageChange,
}) {
  const displayStage = getDisplayStage(client)
  const selectValue = client.pipelineStage ?? displayStage
  const selectId = `pipeline-stage-${client.id}`
  const canDrag = desktopDragEnabled && !isMoving

  const cardClassName = [
    'pipeline-card',
    canDrag ? 'pipeline-card--draggable' : '',
    isDragging ? 'pipeline-card--dragging' : '',
    isMoving ? 'pipeline-card--moving' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={cardClassName}
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      aria-grabbed={isDragging ? true : undefined}
    >
      <div
        className="pipeline-card__body"
        title={
          canDrag
            ? 'Drag to another stage, or use the Move select below'
            : undefined
        }
      >
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

      <footer
        className="pipeline-card__footer"
        onDragStart={(event) => event.preventDefault()}
      >
        <label className="pipeline-card__move-label" htmlFor={selectId}>
          Move
        </label>
        <select
          id={selectId}
          className="pipeline-card__stage-select"
          value={selectValue}
          onChange={(event) => onStageChange(client.id, event.target.value)}
          disabled={isMoving}
          draggable={false}
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

function PipelineColumn({
  stageId,
  label,
  clients,
  movingClientId,
  draggedClientId,
  dragOverStage,
  draggedClientStage,
  desktopDragEnabled,
  isDragActive,
  onStageChange,
  onCardDragStart,
  onCardDragEnd,
  onColumnDragEnter,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
}) {
  const isDropTarget =
    desktopDragEnabled &&
    draggedClientId != null &&
    dragOverStage === stageId &&
    draggedClientStage !== stageId
  const isCurrentStageDrag =
    desktopDragEnabled &&
    draggedClientId != null &&
    draggedClientStage === stageId

  const columnClassName = [
    'pipeline-column',
    `pipeline-column--${stageId}`,
    isDragActive ? 'pipeline-column--drag-active' : '',
    isDropTarget ? 'pipeline-column--drop-target' : '',
    isCurrentStageDrag ? 'pipeline-column--drop-current' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      className={columnClassName}
      aria-label={`${label} stage`}
      onDragEnter={
        desktopDragEnabled
          ? (event) => onColumnDragEnter(stageId, event)
          : undefined
      }
      onDragOver={
        desktopDragEnabled
          ? (event) => onColumnDragOver(stageId, event)
          : undefined
      }
      onDragLeave={
        desktopDragEnabled
          ? (event) => onColumnDragLeave(stageId, event)
          : undefined
      }
      onDrop={
        desktopDragEnabled
          ? (event) => onColumnDrop(stageId, event)
          : undefined
      }
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
                  isDragging={draggedClientId === client.id}
                  desktopDragEnabled={desktopDragEnabled}
                  onDragStart={(event) => onCardDragStart(client.id, event)}
                  onDragEnd={onCardDragEnd}
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
  const [draggedClientId, setDraggedClientId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [desktopDragEnabled, setDesktopDragEnabled] = useState(false)
  const moveInFlightRef = useRef(new Set())
  const columnDragDepthRef = useRef(new Map())

  const resetColumnDragDepths = useCallback(() => {
    columnDragDepthRef.current.clear()
  }, [])

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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const syncDesktopDrag = () => setDesktopDragEnabled(mediaQuery.matches)

    syncDesktopDrag()
    mediaQuery.addEventListener('change', syncDesktopDrag)
    return () => mediaQuery.removeEventListener('change', syncDesktopDrag)
  }, [])

  const groupedClients = useMemo(
    () => groupClientsByStage(clients),
    [clients],
  )

  const handleStageChange = useCallback(async (clientId, nextStage) => {
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
  }, [clients])

  const clearDragState = useCallback(() => {
    resetColumnDragDepths()
    setDraggedClientId(null)
    setDragOverStage(null)
  }, [resetColumnDragDepths])

  const draggedClient = useMemo(
    () =>
      draggedClientId == null
        ? null
        : clients.find((client) => client.id === draggedClientId) ?? null,
    [clients, draggedClientId],
  )
  const draggedClientStage = draggedClient
    ? getDisplayStage(draggedClient)
    : null

  const handleCardDragStart = useCallback((clientId, event) => {
    if (
      event.target.closest('.pipeline-card__footer, select, button, label')
    ) {
      event.preventDefault()
      return
    }

    if (moveInFlightRef.current.has(clientId)) {
      event.preventDefault()
      return
    }

    setDraggedClientId(clientId)
    setDragOverStage(null)
    resetColumnDragDepths()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(clientId))
  }, [resetColumnDragDepths])

  const handleCardDragEnd = useCallback(() => {
    clearDragState()
  }, [clearDragState])

  const handleColumnDragEnter = useCallback(
    (stageId, event) => {
      if (draggedClientId == null) return
      if (moveInFlightRef.current.has(draggedClientId)) return

      const { currentTarget, relatedTarget } = event
      if (
        relatedTarget instanceof Node &&
        currentTarget.contains(relatedTarget)
      ) {
        return
      }

      const depths = columnDragDepthRef.current
      depths.set(stageId, (depths.get(stageId) ?? 0) + 1)
    },
    [draggedClientId],
  )

  const handleColumnDragOver = useCallback(
    (stageId, event) => {
      if (draggedClientId == null) return
      if (moveInFlightRef.current.has(draggedClientId)) return

      if (draggedClientStage === stageId) {
        event.dataTransfer.dropEffect = 'none'
        setDragOverStage(null)
        return
      }

      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setDragOverStage(stageId)
    },
    [draggedClientId, draggedClientStage],
  )

  const handleColumnDragLeave = useCallback((stageId, event) => {
    const { currentTarget, relatedTarget } = event
    if (
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return
    }

    const depths = columnDragDepthRef.current
    const nextDepth = (depths.get(stageId) ?? 0) - 1

    if (nextDepth <= 0) {
      depths.delete(stageId)
      setDragOverStage((current) => (current === stageId ? null : current))
      return
    }

    depths.set(stageId, nextDepth)
  }, [])

  const handleColumnDrop = useCallback(
    (stageId, event) => {
      event.preventDefault()

      const rawClientId =
        draggedClientId ?? event.dataTransfer.getData('text/plain')
      const clientId = Number(rawClientId)
      const droppedClient = clients.find((client) => client.id === clientId)
      const currentStage = droppedClient ? getDisplayStage(droppedClient) : null

      clearDragState()

      if (!Number.isFinite(clientId) || clientId <= 0) return
      if (moveInFlightRef.current.has(clientId)) return
      if (currentStage === stageId) return

      handleStageChange(clientId, stageId)
    },
    [clearDragState, clients, draggedClientId, handleStageChange],
  )

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

  const isDragActive = desktopDragEnabled && draggedClientId != null

  return (
    <div className="pipeline">
      {moveError ? (
        <p className="pipeline__move-error" role="alert">
          {moveError}
        </p>
      ) : null}

      <div
        className={[
          'pipeline-board',
          isDragActive ? 'pipeline-board--drag-active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {PIPELINE_STAGE_OPTIONS.map((stage) => (
          <PipelineColumn
            key={stage.value}
            stageId={stage.value}
            label={stage.label}
            clients={groupedClients[stage.value]}
            movingClientId={movingClientId}
            draggedClientId={draggedClientId}
            dragOverStage={dragOverStage}
            draggedClientStage={draggedClientStage}
            desktopDragEnabled={desktopDragEnabled}
            isDragActive={isDragActive}
            onStageChange={handleStageChange}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
            onColumnDragEnter={handleColumnDragEnter}
            onColumnDragOver={handleColumnDragOver}
            onColumnDragLeave={handleColumnDragLeave}
            onColumnDrop={handleColumnDrop}
          />
        ))}
      </div>
    </div>
  )
}
