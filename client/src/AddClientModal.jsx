import { useState } from 'react'
import useOverlayLock from './hooks/useOverlayLock'
import {
  ModalBody,
  ModalField,
  ModalFooter,
  ModalForm,
  ModalHeader,
  ModalShell,
} from './modals/modalPrimitives'
import { CLIENT_STATUS_OPTIONS } from './utils/badges'

const EMPTY_FORM = {
  company: '',
  contact: '',
  email: '',
  status: 'active',
  projectValue: '',
  lastActivity: '',
}

function clientToForm(client) {
  return {
    company: client.company,
    contact: client.contact,
    email: client.email,
    status: client.status,
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
      status: form.status,
      projectValue,
      lastActivity: form.lastActivity.trim() || 'Just now',
    })
  }

  return (
    <ModalShell onClose={onClose} titleId="client-modal-title">
      <ModalHeader
        titleId="client-modal-title"
        title={isEditing ? 'Edit Client' : 'Add Client'}
        description={
          isEditing
            ? 'Update this client account and project details.'
            : 'Add a new client account to your studio.'
        }
      />

      <ModalForm onSubmit={handleSubmit}>
        <ModalBody>
          <ModalField
            label="Company name"
            htmlFor="client-company"
            error={errors.company}
          >
            <input
              id="client-company"
              type="text"
              className={`field-input${errors.company ? ' field-input--error' : ''}`}
              value={form.company}
              onChange={(event) => updateField('company', event.target.value)}
            />
          </ModalField>

          <ModalField
            label="Contact name"
            htmlFor="client-contact"
            error={errors.contact}
          >
            <input
              id="client-contact"
              type="text"
              className={`field-input${errors.contact ? ' field-input--error' : ''}`}
              value={form.contact}
              onChange={(event) => updateField('contact', event.target.value)}
            />
          </ModalField>

          <ModalField label="Email" htmlFor="client-email" error={errors.email}>
            <input
              id="client-email"
              type="email"
              className={`field-input${errors.email ? ' field-input--error' : ''}`}
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
          </ModalField>

          <ModalField label="Status" htmlFor="client-status">
            <select
              id="client-status"
              className="field-select"
              value={form.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              {CLIENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField label="Project value" htmlFor="client-value">
            <input
              id="client-value"
              type="text"
              className="field-input"
              placeholder="0"
              inputMode="decimal"
              value={form.projectValue}
              onChange={(event) => updateField('projectValue', event.target.value)}
            />
          </ModalField>

          <ModalField label="Last activity" htmlFor="client-activity">
            <input
              id="client-activity"
              type="text"
              className="field-input"
              placeholder="Just now"
              value={form.lastActivity}
              onChange={(event) => updateField('lastActivity', event.target.value)}
            />
          </ModalField>
        </ModalBody>

        <ModalFooter onClose={onClose} />
      </ModalForm>
    </ModalShell>
  )
}
