export function SettingsSection({ title, description, children }) {
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

export function SettingsField({ label, hint, htmlFor, children }) {
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

export function SettingsToggle({ id, label, hint, defaultChecked = false }) {
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
