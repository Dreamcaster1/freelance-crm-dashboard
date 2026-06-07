import {
  SettingsSection,
  SettingsToggle,
} from './settingsPrimitives'

export default function NotificationSettings() {
  return (
    <SettingsSection
      title="Notification preferences"
      description="Control which studio events land in your inbox."
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
        hint="A Friday digest of shipped work, billing, and client movement."
        defaultChecked
      />
      <SettingsToggle
        id="notify-marketing"
        label="Product updates"
        hint="News about features, tips, and platform changes."
      />
    </SettingsSection>
  )
}
