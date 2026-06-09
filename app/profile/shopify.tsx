import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { Typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  disconnectShopify,
  getShopifyStatus,
  startShopifyOAuth,
  syncShopifyNow,
  type ShopifyStatusResponse,
} from "@/services/shopify";
import { screenContentPadding } from "@/styles/layout";

const BENEFITS = [
  { icon: "sync-outline" as const, title: "Auto inventory sync", body: "Keep Crownly listings in sync with your Shopify catalog." },
  { icon: "checkmark-done-outline" as const, title: "Auto sold updates", body: "When inventory hits zero on Shopify, listings mark as sold on Crownly." },
  { icon: "watch-outline" as const, title: "Automatic watch imports", body: "Import titles, photos, prices, SKUs, and tags as Crownly listings." },
  { icon: "cash-outline" as const, title: "Standard seller fees", body: "Imported listings use Crownly checkout with your seller fee (7% default, launch partners exempt)." },
];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function syncStatusLabel(status: string): string {
  switch (status) {
    case "syncing": return "Syncing…";
    case "success": return "Up to date";
    case "error": return "Error";
    case "disabled": return "Disabled";
    default: return "Idle";
  }
}

function createStyles() {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background },
    topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 12 },
    topBarTitles: { flex: 1, minWidth: 0 },
    topBarTitle: { ...Typography.h3, color: Colors.textPrimary },
    topBarSubtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
    card: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      padding: 16,
      marginBottom: SPACING.section,
    },
    cardTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 12 },
    statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
    statLabel: { ...Typography.body, color: Colors.textMuted },
    statValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: "500", maxWidth: "60%", textAlign: "right" },
    benefitRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    benefitCopy: { flex: 1, gap: 4 },
    benefitTitle: { ...Typography.body, color: Colors.textPrimary, fontWeight: "600" },
    benefitBody: { ...Typography.caption, color: Colors.textMuted },
    input: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.sm,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: Colors.textPrimary,
      backgroundColor: Colors.background,
      marginBottom: 12,
    },
    inputHint: { ...Typography.caption, color: Colors.textMuted, marginBottom: 12 },
    actions: { gap: 10, marginTop: 4 },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      marginBottom: 12,
    },
    statusBadgeText: { ...Typography.caption, fontWeight: "600" },
    logRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingTop: 10,
      marginTop: 10,
    },
    logMeta: { ...Typography.caption, color: Colors.textMuted },
    disconnect: { marginTop: 8 },
  });
}

export default function ShopifyIntegrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ connected?: string }>();

  const [status, setStatus] = useState<ShopifyStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopDomain, setShopDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (params.connected === "1") {
      Alert.alert("Shopify connected", "Your store is linked. Initial import is running in the background.");
      router.setParams({ connected: undefined });
    } else if (params.connected === "0") {
      Alert.alert("Connection failed", "Shopify authorization did not complete.");
      router.setParams({ connected: undefined });
    }
  }, [params.connected, router]);

  const loadStatus = useCallback(async () => {
    try {
      const data = await getShopifyStatus();
      setStatus(data);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not load status");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      Alert.alert("Store required", "Enter your Shopify store domain (e.g. your-store.myshopify.com).");
      return;
    }
    setConnecting(true);
    try {
      const { url } = await startShopifyOAuth(shopDomain.trim());
      await WebBrowser.openAuthSessionAsync(url, "crownly://profile/shopify");
      await loadStatus();
    } catch (e) {
      Alert.alert("Connection failed", e instanceof Error ? e.message : "Could not connect Shopify");
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncShopifyNow();
      Alert.alert(
        "Sync complete",
        `Created ${result.created}, updated ${result.updated} listings.`
      );
      await loadStatus();
    } catch (e) {
      Alert.alert("Sync failed", e instanceof Error ? e.message : "Could not sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Shopify?",
      "Imported listings remain on Crownly but will no longer sync.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setDisconnecting(true);
            try {
              await disconnectShopify();
              setStatus({ connected: false });
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Could not disconnect");
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  const store = status?.connected ? status.store : null;
  const feePct = store ? (store.sellerFeeRate * 100).toFixed(1) : "7.0";

  return (
    <View key={colorScheme} style={styles.screen}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: SPACING.screen }}>
        <View style={styles.topBar}>
          <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
          <View style={styles.topBarTitles}>
            <Text style={styles.topBarTitle}>Shopify Integration</Text>
            <Text style={styles.topBarSubtitle}>Sync inventory from your Shopify store</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.textPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={screenContentPadding(insets.bottom)}
          {...HIDE_SCROLL_INDICATORS}
        >
          {store ? (
            <>
              <View
                style={[
                  styles.statusBadge,
                  {
                    borderColor: store.syncStatus === "error" ? Colors.error : Colors.border,
                    backgroundColor: Colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: store.syncStatus === "error" ? Colors.error : Colors.textPrimary },
                  ]}
                >
                  {syncStatusLabel(store.syncStatus)}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Shopify Status</Text>
                <StatRow label="Store Name" value={store.shopName ?? store.shopDomain} />
                <StatRow
                  label="Store URL"
                  value={store.shopUrl.replace("https://", "")}
                  onPress={() => Linking.openURL(store.shopUrl)}
                />
                <StatRow label="Connection Date" value={formatDate(store.connectedAt)} />
                <StatRow label="Last Sync" value={formatDate(store.lastSync)} />
                <StatRow label="Imported Watches" value={String(store.productsImported)} />
                <StatRow label="Sync Status" value={syncStatusLabel(store.syncStatus)} />
                <StatRow label="Seller Fee" value={`${feePct}% per sale`} />
              </View>

              <View style={styles.actions}>
                <LuxuryButton
                  label={syncing ? "Syncing…" : "Sync Now"}
                  onPress={handleSync}
                  disabled={syncing || store.syncStatus === "syncing"}
                  loading={syncing}
                />
                <Pressable style={styles.disconnect} onPress={handleDisconnect} disabled={disconnecting}>
                  <LuxuryButton
                    label={disconnecting ? "Disconnecting…" : "Disconnect Shopify"}
                    variant="outline"
                    onPress={handleDisconnect}
                    disabled={disconnecting}
                    loading={disconnecting}
                  />
                </Pressable>
              </View>

              {(status?.recentLogs?.length ?? 0) > 0 ? (
                <View style={[styles.card, { marginTop: SPACING.section }]}>
                  <Text style={styles.cardTitle}>Recent Activity</Text>
                  {status!.recentLogs!.map((log) => (
                    <View key={log.id} style={styles.logRow}>
                      <Text style={styles.benefitTitle}>
                        {log.sync_type.replace(/_/g, " ")} · {log.status}
                      </Text>
                      <Text style={styles.logMeta}>
                        {formatDate(log.created_at)}
                        {log.products_created || log.products_updated
                          ? ` · +${log.products_created} / ~${log.products_updated}`
                          : ""}
                        {log.error_message ? ` · ${log.error_message}` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Connect your Shopify store</Text>
                <Text style={styles.inputHint}>
                  Enter your store domain to authorize Crownly. We import watches and keep inventory in sync.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="your-store.myshopify.com"
                  placeholderTextColor={Colors.textMuted}
                  value={shopDomain}
                  onChangeText={setShopDomain}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <LuxuryButton
                  label={connecting ? "Connecting…" : "Connect Shopify"}
                  onPress={handleConnect}
                  loading={connecting}
                  disabled={connecting}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Benefits</Text>
                {BENEFITS.map((item) => (
                  <View key={item.title} style={styles.benefitRow}>
                    <Ionicons name={item.icon} size={22} color={Colors.textPrimary} />
                    <View style={styles.benefitCopy}>
                      <Text style={styles.benefitTitle}>{item.title}</Text>
                      <Text style={styles.benefitBody}>{item.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const content = (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, onPress && { textDecorationLine: "underline" }]}>{value}</Text>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
