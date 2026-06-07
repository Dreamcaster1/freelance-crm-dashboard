import {
  SettingsField,
  SettingsSection,
  SettingsToggle,
} from './settingsPrimitives'

export default function AppearanceSettings() {
  return (
    <SettingsSection
      title="Appearance"
      description="Tune how ClientFlow looks on your screen."
    >
      <SettingsField
        label="Theme"
        hint="Select your preferred color scheme."
        htmlFor="appearance-theme"
      >
        <select id="appearance-theme" className="field-select" defaultValue="dark">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </SettingsField>

      <SettingsField
        label="Language"
        hint="Choose the language used across the interface."
        htmlFor="appearance-language"
      >
        <select id="appearance-language" className="field-select" defaultValue="en">
          <option value="en">English (US)</option>
          <option value="en-gb">English (UK)</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
        </select>
      </SettingsField>

      <SettingsField
        label="Date format"
        hint="How dates appear in tables and detail views."
        htmlFor="appearance-date"
      >
        <select id="appearance-date" className="field-select" defaultValue="mdy">
          <option value="mdy">MM/DD/YYYY</option>
          <option value="dmy">DD/MM/YYYY</option>
          <option value="iso">YYYY-MM-DD</option>
        </select>
      </SettingsField>

      <SettingsToggle
        id="appearance-compact"
        label="Compact mode"
        hint="Reduce spacing in tables and lists for denser layouts."
      />
    </SettingsSection>
  )
}
