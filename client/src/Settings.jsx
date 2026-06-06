function SettingsSection({ title, description, children }) {
  return (
    <section className="settings-section">
      <header className="settings-section__header">
        <h2 className="settings-section__title">{title}</h2>
        <p className="settings-section__description">{description}</p>
      </header>
      <div className="settings-section__body">{children}</div>
    </section>
  )
}

function SettingsField({ label, hint, htmlFor, children }) {
  return (
    <div className="settings-field">
      <div className="settings-field__label">
        <label className="settings-field__name" htmlFor={htmlFor}>
          {label}
        </label>
        {hint && <p className="settings-field__hint">{hint}</p>}
      </div>
      <div className="settings-field__control">{children}</div>
    </div>
  )
}

function SettingsToggle({ id, label, hint, defaultChecked = false }) {
  return (
    <div className="settings-toggle">
      <div className="settings-toggle__label">
        <label className="settings-toggle__name" htmlFor={id}>
          {label}
        </label>
        {hint && <p className="settings-toggle__hint">{hint}</p>}
      </div>
      <label className="switch" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="switch__input"
          defaultChecked={defaultChecked}
        />
        <span className="switch__track" aria-hidden="true" />
      </label>
    </div>
  )
}

export default function Settings() {
  return (
    <div className="settings">
      <form
        className="settings-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <SettingsSection
          title="Profile"
          description="Manage your personal account details and how others see you."
        >
          <div className="settings-profile">
            <div className="settings-profile__avatar" aria-hidden="true">
              AM
            </div>
            <div className="settings-profile__meta">
              <span className="settings-profile__name">Alex Morgan</span>
              <span className="settings-profile__email">alex@freelance.dev</span>
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
              defaultValue="alex@freelance.dev"
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
              defaultValue="Independent Designer"
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="Workspace"
          description="Configure defaults for your freelance CRM workspace."
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
              defaultValue="Personal"
            />
          </SettingsField>

          <SettingsField
            label="Workspace URL"
            hint="Your unique workspace identifier."
            htmlFor="workspace-slug"
          >
            <div className="field-input-group">
              <span className="field-input-group__prefix">crm.app/</span>
              <input
                id="workspace-slug"
                type="text"
                className="field-input field-input--grouped"
                defaultValue="alex-morgan"
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

        <SettingsSection
          title="Notification preferences"
          description="Choose what you want to be notified about and how."
        >
          <SettingsToggle
            id="notify-email"
            label="Email notifications"
            hint="Receive email alerts for important account activity."
            defaultChecked
          />
          <SettingsToggle
            id="notify-tasks"
            label="Task reminders"
            hint="Get notified when tasks are due or overdue."
            defaultChecked
          />
          <SettingsToggle
            id="notify-clients"
            label="Client updates"
            hint="Alerts when clients are added or statuses change."
            defaultChecked
          />
          <SettingsToggle
            id="notify-weekly"
            label="Weekly summary"
            hint="A digest of tasks, revenue, and client activity."
            defaultChecked
          />
          <SettingsToggle
            id="notify-marketing"
            label="Product updates"
            hint="News about features, tips, and platform changes."
          />
        </SettingsSection>

        <SettingsSection
          title="Appearance"
          description="Customize how Freelance CRM looks on your device."
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

        <div className="settings-actions">
          <button type="submit" className="btn btn--primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
