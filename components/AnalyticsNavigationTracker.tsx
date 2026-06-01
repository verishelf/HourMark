import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";
import { initFirebaseAnalytics, logAnalyticsScreen } from "@/lib/analytics";

/** Logs Firebase screen_view events on route changes (dev/production builds only). */
export function AnalyticsNavigationTracker() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void initFirebaseAnalytics();
  }, []);

  useEffect(() => {
    void logAnalyticsScreen(pathname || "/");
  }, [pathname]);

  return null;
}
