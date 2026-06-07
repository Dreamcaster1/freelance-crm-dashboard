import {
  SettingsField,
  SettingsSection,
  SettingsToggle,
} from './settingsPrimitives'

export default function SecuritySettings() {
  return (
    <SettingsSection
      title="Security"
      description="Manage your password, authentication, and active sessions."
    >
      <SettingsField
        label="Current password"
        hint="Enter your existing password to make changes."
        htmlFor="security-current"
      >
        <input
          id="security-current"
          type="password"
          className="field-input"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </SettingsField>

      <SettingsField
        label="New password"
        hint="Must be at least 12 characters with mixed case and numbers."
        htmlFor="security-new"
      >
        <input
          id="security-new"
          type="password"
          className="field-input"
          placeholder="Enter new password"
          autoComplete="new-password"
        />
      </SettingsField>

      <SettingsToggle
        id="security-2fa"
        label="Two-factor authentication"
        hint="Add an extra layer of security to your account."
      />

      <div className="settings-sessions">
        <div className="settings-sessions__info">
          <span className="settings-sessions__label">Active sessions</span>
          <p className="settings-sessions__hint">
            You are signed in on 2 devices. Last activity was 3 hours ago on
            this device.
          </p>
        </div>
        <button type="button" className="btn btn--secondary btn--sm">
          Manage sessions
        </button>
      </div>
    </SettingsSection>
  )
}
