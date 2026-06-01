import { type Href, router } from "expo-router";

function isTabsRoute(route: Href): boolean {
  const path =
    typeof route === "string"
      ? route
      : typeof route === "object" && route !== null && "pathname" in route
        ? String(route.pathname)
        : "";
  return path === "/(tabs)" || path.startsWith("/(tabs)/");
}

/** Replace navigation stack so iOS swipe-back cannot return to auth/onboarding. */
export function resetToRoute(route: Href) {
  if (router.canDismiss()) {
    router.dismissAll();
  }

  if (!isTabsRoute(route)) {
    router.replace("/(tabs)");
    queueMicrotask(() => router.push(route));
    return;
  }

  router.replace(route);
}

export function resetToApp(route: Href = "/(tabs)") {
  resetToRoute(route);
}

export function resetToAuth(route: Href = "/auth/welcome") {
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace(route);
}

/** Close or pop; falls back when stack was reset (e.g. post-login deep link). */
export function safeGoBack(fallback: Href = "/(tabs)") {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
