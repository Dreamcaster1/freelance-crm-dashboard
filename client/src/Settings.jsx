import AppearanceSettings from './settings/AppearanceSettings'
import NotificationSettings from './settings/NotificationSettings'
import ProfileSettings from './settings/ProfileSettings'
import SecuritySettings from './settings/SecuritySettings'
import WorkspaceSettings from './settings/WorkspaceSettings'

export default function Settings() {
  return (
    <div className="settings">
      <form
        className="settings-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <ProfileSettings />
        <WorkspaceSettings />
        <NotificationSettings />
        <AppearanceSettings />
        <SecuritySettings />

        <div className="settings-actions">
          <button type="submit" className="btn btn--primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
