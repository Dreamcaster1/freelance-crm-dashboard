import { useState } from 'react'
import { ApiError } from './api/client.js'

function displayValue(value) {
  if (value == null || value === '') return 'Not available'
  return String(value)
}

function formatWorkspaceRole(role) {
  if (role === 'owner') return 'Owner'
  if (role === 'member') return 'Member'
  return role
}

function SettingsDetail({ term, value, valueId }) {
  return (
    <div className="settings-detail">
      <dt className="settings-detail__term">{term}</dt>
      <dd className="settings-detail__value" id={valueId}>
        {value}
      </dd>
    </div>
  )
}

function SettingsSection({ title, description, children }) {
  return (
    <section className="settings-section" aria-labelledby={`${title}-heading`}>
      <header className="settings-section__header">
        <h2 className="settings-section__title" id={`${title}-heading`}>
          {title}
        </h2>
        {description ? (
          <p className="settings-section__description">{description}</p>
        ) : null}
      </header>
      <div className="settings-section__body">{children}</div>
    </section>
  )
}

export default function Settings({ user, workspace, onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(null)

  async function handleLogout() {
    setLogoutError(null)
    setIsLoggingOut(true)

    try {
      await onLogout()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Unable to log out. Try again.'
      setLogoutError(message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const workspaceRole = workspace?.role

  return (
    <div className="settings">
      <p className="settings-intro">
        Account and workspace details for your signed-in session. This
        information is managed by ClientFlow and shown here for reference.
      </p>

      <div className="settings-stack">
        <SettingsSection
          title="Account"
          description="Your user identity in this workspace."
        >
          <dl className="settings-details">
            <SettingsDetail
              term="Name"
              value={displayValue(user?.name)}
              valueId="settings-account-name"
            />
            <SettingsDetail
              term="Email"
              value={displayValue(user?.email)}
              valueId="settings-account-email"
            />
          </dl>
        </SettingsSection>

        <SettingsSection
          title="Workspace"
          description="The studio workspace linked to your account."
        >
          <dl className="settings-details">
            <SettingsDetail
              term="Workspace name"
              value={displayValue(workspace?.name)}
              valueId="settings-workspace-name"
            />
            <SettingsDetail
              term="Workspace slug"
              value={displayValue(workspace?.slug)}
              valueId="settings-workspace-slug"
            />
            {workspaceRole != null && workspaceRole !== '' ? (
              <SettingsDetail
                term="Your role"
                value={formatWorkspaceRole(workspaceRole)}
                valueId="settings-workspace-role"
              />
            ) : null}
          </dl>
        </SettingsSection>

        <SettingsSection
          title="Session"
          description="Sign out of ClientFlow on this device."
        >
          <div className="settings-session">
            {logoutError ? (
              <p className="settings-session__error" role="alert">
                {logoutError}
              </p>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out…' : 'Log out'}
            </button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}
