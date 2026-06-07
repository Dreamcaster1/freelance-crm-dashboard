import { useState } from 'react'
import useOverlayLock from './hooks/useOverlayLock'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', variant: 'success' },
  { value: 'lead', label: 'Lead', variant: 'info' },
  { value: 'on-hold', label: 'On hold', variant: 'warning' },
  { value: 'at-risk', label: 'At risk', variant: 'danger' },
  { value: 'inactive', label: 'Inactive', variant: 'neutral' },
]

const EMPTY_FORM = {
  company: '',
  contact: '',
  email: '',
  status: 'active',
  projectValue: '',
  lastActivity: '',
}

function getStatusBadge(statusValue) {
  const option = STATUS_OPTIONS.find((item) => item.value === statusValue)
  return {
    label: option?.label ?? 'Active',
    variant: option?.variant ?? 'success',
  }
}

function getStatusValue(status) {
  const option = STATUS_OPTIONS.find((item) => item.label === status.label)
  return option?.value ?? 'active'
}

function clientToForm(client) {
  return {
    company: client.company,
    contact: client.contact,
    email: client.email,
    status: getStatusValue(client.status),
    projectValue: client.projectValue ? String(client.projectValue) : '',
    lastActivity: client.lastActivity,
  }
}

function validateForm(form) {
  const errors = {}

  if (!form.company.trim()) {
    errors.company = 'Company name is required.'
  }

  if (!form.contact.trim()) {
    errors.contact = 'Contact name is required.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

export default function AddClientModal({ isOpen, client, onClose, onSave }) {
  useOverlayLock(isOpen)

  if (!isOpen) return null

  return (
    <ClientModalContent
      key={client?.id ?? 'new-client'}
      client={client}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function ClientModalContent({ client, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    client ? clientToForm(client) : EMPTY_FORM,
  )
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(client)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const projectValue = form.projectValue.trim()
      ? Number(form.projectValue.replace(/[^0-9.]/g, '')) || 0
      : 0

    onSave({
      id: client?.id ?? `c${Date.now()}`,
      company: form.company.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      status: getStatusBadge(form.status),
      projectValue,
      lastActivity: form.lastActivity.trim() || 'Just now',
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="client-modal-title" className="modal__title">
            {isEditing ? 'Edit Client' : 'Add Client'}
          </h2>
          <p className="modal__description">
            {isEditing
              ? 'Update this client account and project details.'
              : 'Add a new client account to your studio.'}
          </p>
        </header>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <div className="modal__body">
            <div className="modal-field">
              <label className="modal-field__label" htmlFor="client-company">
                Company name
              </label>
              <input
                id="client-company"
                type="text"
                className={`field-input${errors.company ? ' field-input--error' : ''}`}
                value={form.company}
                onChange={(event) => updateField('company', event.target.value)}
              />
              {errors.company && (
                <span className="field-error">{errors.company}</span>
              )}
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="client-contact">
                Contact name
              </label>
              <input
                id="client-contact"
                type="text"
                className={`field-input${errors.contact ? ' field-input--error' : ''}`}
                value={form.contact}
                onChange={(event) => updateField('contact', event.target.value)}
              />
              {errors.contact && (
                <span className="field-error">{errors.contact}</span>
              )}
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="client-email">
                Email
              </label>
              <input
                id="client-email"
                type="email"
                className={`field-input${errors.email ? ' field-input--error' : ''}`}
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="client-status">
                Status
              </label>
              <select
                id="client-status"
                className="field-select"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="client-value">
                Project value
              </label>
              <input
                id="client-value"
                type="text"
                className="field-input"
                placeholder="0"
                inputMode="decimal"
                value={form.projectValue}
                onChange={(event) => updateField('projectValue', event.target.value)}
              />
            </div>

            <div className="modal-field">
              <label className="modal-field__label" htmlFor="client-activity">
                Last activity
              </label>
              <input
                id="client-activity"
                type="text"
                className="field-input"
                placeholder="Just now"
                value={form.lastActivity}
                onChange={(event) => updateField('lastActivity', event.target.value)}
              />
            </div>
          </div>

          <footer className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Save
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
