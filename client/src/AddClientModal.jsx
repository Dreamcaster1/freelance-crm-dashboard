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
import { mapClientToForm, validateProjectValueDollars } from './utils/clientMapper'
import { CLIENT_STATUS_OPTIONS } from './utils/badges'

const EMPTY_FORM = {
  company: '',
  contact: '',
  email: '',
  status: 'active',
  projectValue: '',
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

  const projectValueError = validateProjectValueDollars(form.projectValue)
  if (projectValueError) {
    errors.projectValue = projectValueError
  }

  return errors
}

export default function AddClientModal({
  isOpen,
  client,
  onClose,
  onSave,
  isSaving = false,
  saveError = null,
}) {
  useOverlayLock(isOpen)

  if (!isOpen) return null

  return (
    <ClientModalContent
      key={client?.id ?? 'new-client'}
      client={client}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      saveError={saveError}
    />
  )
}

function ClientModalContent({
  client,
  onClose,
  onSave,
  isSaving,
  saveError,
}) {
  const [form, setForm] = useState(() =>
    client ? mapClientToForm(client) : EMPTY_FORM,
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

  async function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    await onSave(form)
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
              disabled={isSaving}
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
              disabled={isSaving}
            />
          </ModalField>

          <ModalField label="Email" htmlFor="client-email" error={errors.email}>
            <input
              id="client-email"
              type="email"
              className={`field-input${errors.email ? ' field-input--error' : ''}`}
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              disabled={isSaving}
            />
          </ModalField>

          <ModalField label="Status" htmlFor="client-status">
            <select
              id="client-status"
              className="field-select"
              value={form.status}
              onChange={(event) => updateField('status', event.target.value)}
              disabled={isSaving}
            >
              {CLIENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </ModalField>

          <ModalField
            label="Project value"
            htmlFor="client-value"
            error={errors.projectValue}
          >
            <input
              id="client-value"
              type="text"
              className={`field-input${errors.projectValue ? ' field-input--error' : ''}`}
              placeholder="0"
              inputMode="decimal"
              value={form.projectValue}
              onChange={(event) => updateField('projectValue', event.target.value)}
              disabled={isSaving}
            />
          </ModalField>

          {saveError ? <p className="field-error">{saveError}</p> : null}
        </ModalBody>

        <ModalFooter
          onClose={onClose}
          isSubmitting={isSaving}
          submitLabel={isEditing ? 'Save changes' : 'Add client'}
        />
      </ModalForm>
    </ModalShell>
  )
}
