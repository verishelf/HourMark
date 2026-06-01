import { useEffect } from "react";
import { useSegments } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { resetToApp } from "@/lib/navigation";

/** Keeps authenticated users off auth screens (e.g. after iOS edge swipe). */
export function AuthNavigationGuard() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    if (segments[0] === "auth") {
      resetToApp();
    }
  }, [isAuthenticated, loading, segments]);

  return null;
}
