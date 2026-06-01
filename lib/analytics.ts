import Constants from "expo-constants";

type AnalyticsInstance = {
  logEvent: (name: string, params?: Record<string, string | number>) => Promise<void>;
  logScreenView: (params: { screen_name: string; screen_class?: string }) => Promise<void>;
  setUserId: (id: string | null) => Promise<void>;
  setAnalyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
};

let cached: AnalyticsInstance | null | undefined;

/** Native Firebase Analytics is unavailable in Expo Go. */
export function isFirebaseAnalyticsAvailable(): boolean {
  return Constants.executionEnvironment !== "storeClient";
}

function getAnalytics(): AnalyticsInstance | null {
  if (cached !== undefined) return cached;
  if (!isFirebaseAnalyticsAvailable()) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require("@react-native-firebase/analytics").default;
    cached = module() as AnalyticsInstance;
  } catch {
    cached = null;
  }
  return cached;
}

export async function initFirebaseAnalytics(): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;
  await analytics.setAnalyticsCollectionEnabled(true);
}

export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;
  await analytics.setUserId(userId);
}

export async function logAnalyticsScreen(screenName: string): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;
  const name = screenName || "unknown";
  await analytics.logScreenView({ screen_name: name, screen_class: name });
}

export async function logAnalyticsEvent(
  name: string,
  params?: Record<string, string | number>,
): Promise<void> {
  const analytics = getAnalytics();
  if (!analytics) return;
  await analytics.logEvent(name, params);
}
