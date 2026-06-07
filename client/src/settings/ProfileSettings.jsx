import {
  SettingsField,
  SettingsSection,
} from './settingsPrimitives'

export default function ProfileSettings() {
  return (
    <SettingsSection
      title="Profile"
      description="How you appear on proposals, invoices, and shared client views."
    >
      <div className="settings-profile">
        <div className="settings-profile__avatar" aria-hidden="true">
          AM
        </div>
        <div className="settings-profile__meta">
          <span className="settings-profile__name">Alex Morgan</span>
          <span className="settings-profile__email">alex@clearline.studio</span>
          <button type="button" className="btn btn--secondary btn--sm">
            Change photo
          </button>
        </div>
      </div>

      <SettingsField
        label="Full name"
        hint="Displayed on invoices and client-facing documents."
        htmlFor="profile-name"
      >
        <input
          id="profile-name"
          type="text"
          className="field-input"
          defaultValue="Alex Morgan"
        />
      </SettingsField>

      <SettingsField
        label="Email address"
        hint="Used for login and account notifications."
        htmlFor="profile-email"
      >
        <input
          id="profile-email"
          type="email"
          className="field-input"
          defaultValue="alex@clearline.studio"
        />
      </SettingsField>

      <SettingsField
        label="Job title"
        hint="Shown on your profile and shared workspace views."
        htmlFor="profile-title"
      >
        <input
          id="profile-title"
          type="text"
          className="field-input"
          defaultValue="Lead Developer"
        />
      </SettingsField>
    </SettingsSection>
  )
}
