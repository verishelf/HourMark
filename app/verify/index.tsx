import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import {
  getConnectReturnRedirectUrl,
  startSellerVerification,
} from "@/services/verification";

type ReturnPath = "profile" | "sell";

function sanitizeReturnPath(value: string | string[] | undefined): ReturnPath {
  return value === "sell" ? "sell" : "profile";
}

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnPath?: string | string[] }>();
  const returnPath = sanitizeReturnPath(params.returnPath);
  const redirectPrefix = getConnectReturnRedirectUrl();

  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const finishVerification = useCallback(() => {
    router.replace(returnPath === "sell" ? "/sell" : "/profile");
  }, [returnPath, router]);

  useEffect(() => {
    let cancelled = false;

    startSellerVerification(returnPath)
      .then((url) => {
        if (!cancelled) setStripeUrl(url);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to start verification");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [returnPath]);

  const handleNavigation = useCallback(
    (navState: WebViewNavigation) => {
      const url = navState.url;

      if (url.startsWith(redirectPrefix) || url.startsWith("hourmark://")) {
        finishVerification();
      }
    },
    [finishVerification, redirectPrefix]
  );

  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Verification unavailable</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!stripeUrl) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.textPrimary} />
        <Text style={styles.loadingText}>Loading verification...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Verify Identity</Text>
          <Text style={styles.headerSubtitle}>Name, address, SSN, and payout details</Text>
        </View>
      </View>

      {loadingPage ? (
        <View style={styles.webviewLoader}>
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        </View>
      ) : null}

      <WebView
        source={{ uri: stripeUrl }}
        style={styles.webview}
        onLoadEnd={() => setLoadingPage(false)}
        onNavigationStateChange={handleNavigation}
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.url.startsWith(redirectPrefix) ||
            request.url.startsWith("hourmark://")
          ) {
            finishVerification();
            return false;
          }
          return true;
        }}
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.screen,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    top: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.screen,
    gap: 12,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  errorBody: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
