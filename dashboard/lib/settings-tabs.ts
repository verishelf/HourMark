export const SETTINGS_TABS = ["fees", "email", "auth", "social", "platform"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export const SETTINGS_SOCIAL_KEYS_URL = "/settings?tab=social";

export function parseSettingsTab(tab: string | null | undefined): SettingsTab {
  if (tab && SETTINGS_TABS.includes(tab as SettingsTab)) {
    return tab as SettingsTab;
  }
  return "fees";
}
