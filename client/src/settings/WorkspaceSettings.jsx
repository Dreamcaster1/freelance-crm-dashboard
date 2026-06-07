import {
  SettingsField,
  SettingsSection,
} from './settingsPrimitives'

export default function WorkspaceSettings() {
  return (
    <SettingsSection
      title="Workspace"
      description="Defaults for how Clearline Studio runs inside ClientFlow."
    >
      <SettingsField
        label="Workspace name"
        hint="Visible across the app and in exported reports."
        htmlFor="workspace-name"
      >
        <input
          id="workspace-name"
          type="text"
          className="field-input"
          defaultValue="Clearline Studio"
        />
      </SettingsField>

      <SettingsField
        label="Workspace URL"
        hint="Your unique workspace identifier."
        htmlFor="workspace-slug"
      >
        <div className="field-input-group">
          <span className="field-input-group__prefix">clientflow.app/</span>
          <input
            id="workspace-slug"
            type="text"
            className="field-input field-input--grouped"
            defaultValue="clearline-studio"
          />
        </div>
      </SettingsField>

      <SettingsField
        label="Default currency"
        hint="Applied to new projects and invoices."
        htmlFor="workspace-currency"
      >
        <select id="workspace-currency" className="field-select" defaultValue="usd">
          <option value="usd">USD — US Dollar</option>
          <option value="eur">EUR — Euro</option>
          <option value="gbp">GBP — British Pound</option>
          <option value="cad">CAD — Canadian Dollar</option>
        </select>
      </SettingsField>

      <SettingsField
        label="Timezone"
        hint="Used for due dates, reminders, and activity timestamps."
        htmlFor="workspace-timezone"
      >
        <select
          id="workspace-timezone"
          className="field-select"
          defaultValue="america-new_york"
        >
          <option value="america-new_york">Eastern Time (US & Canada)</option>
          <option value="america-chicago">Central Time (US & Canada)</option>
          <option value="america-denver">Mountain Time (US & Canada)</option>
          <option value="america-los_angeles">Pacific Time (US & Canada)</option>
          <option value="europe-london">London (GMT)</option>
          <option value="europe-berlin">Berlin (CET)</option>
        </select>
      </SettingsField>
    </SettingsSection>
  )
}
