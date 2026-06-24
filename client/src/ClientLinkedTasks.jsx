import { useCallback, useEffect, useRef, useState } from 'react'
import * as tasksApi from './api/tasks.js'
import { ApiError } from './api/client.js'
import Badge from './Badge'
import { mapTasksFromApi } from './utils/taskMapper'
import { getTaskPriorityBadge, getTaskStatusBadge } from './utils/badges'

function getTasksLoadError(err) {
  return err instanceof ApiError
    ? err.message
    : 'Unable to load linked tasks. Try again.'
}

export default function ClientLinkedTasks({
  clientId,
  onOpenTask,
  onCreateTask,
  tasksRevision,
}) {
  const [tasks, setTasks] = useState([])
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const fetchGenerationRef = useRef(0)

  const fetchTasks = useCallback(async () => {
    const generation = fetchGenerationRef.current + 1
    fetchGenerationRef.current = generation
    setLoadStatus('loading')
    setLoadError(null)

    try {
      const data = await tasksApi.listClientTasks(clientId)
      if (fetchGenerationRef.current !== generation) return
      setTasks(mapTasksFromApi(data.tasks ?? []))
      setLoadStatus('ready')
    } catch (err) {
      if (fetchGenerationRef.current !== generation) return
      setTasks([])
      setLoadStatus('error')
      setLoadError(getTasksLoadError(err))
    }
  }, [clientId])

  useEffect(() => {
    let cancelled = false
    const generation = fetchGenerationRef.current + 1
    fetchGenerationRef.current = generation

    tasksApi
      .listClientTasks(clientId)
      .then((data) => {
        if (cancelled || fetchGenerationRef.current !== generation) return
        setTasks(mapTasksFromApi(data.tasks ?? []))
        setLoadStatus('ready')
        setLoadError(null)
      })
      .catch((err) => {
        if (cancelled || fetchGenerationRef.current !== generation) return
        setTasks([])
        setLoadStatus('error')
        setLoadError(getTasksLoadError(err))
      })

    return () => {
      cancelled = true
    }
  }, [clientId, tasksRevision])

  return (
    <section className="drawer-linked-tasks" aria-label="Linked tasks">
      <header className="drawer-linked-tasks__header">
        <h3 className="drawer-linked-tasks__title">Linked tasks</h3>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={onCreateTask}
        >
          Create task
        </button>
      </header>

      {loadStatus === 'loading' ? (
        <p className="drawer-linked-tasks__status">Loading linked tasks…</p>
      ) : null}

      {loadStatus === 'error' ? (
        <div className="drawer-linked-tasks__status drawer-linked-tasks__status--error">
          <p role="alert">{loadError}</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={fetchTasks}
          >
            Try again
          </button>
        </div>
      ) : null}

      {loadStatus === 'ready' ? (
        tasks.length > 0 ? (
          <ul className="drawer-linked-tasks__list">
            {tasks.map((task) => (
              <li key={task.id} className="drawer-linked-tasks__item">
                <div className="drawer-linked-tasks__item-main">
                  <p className="drawer-linked-tasks__name">{task.name}</p>
                  <div className="drawer-linked-tasks__meta">
                    <Badge {...getTaskStatusBadge(task.status)} />
                    <Badge {...getTaskPriorityBadge(task.priority)} />
                    <span className="drawer-linked-tasks__due">{task.dueDate}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm drawer-linked-tasks__view-btn"
                  onClick={() => onOpenTask(task.id)}
                  aria-label={`View task ${task.name}`}
                >
                  View task
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="drawer-linked-tasks__empty">
            No tasks linked to this client.
          </p>
        )
      ) : null}
    </section>
  )
}
