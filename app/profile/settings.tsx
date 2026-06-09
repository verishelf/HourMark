import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { SettingsRow } from "@/components/SettingsRow";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { screenContentPadding } from "@/styles/layout";

function createSettingsStyles() {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background },
    card: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      overflow: "hidden",
    },
    sectionLabel: {
      ...Typography.caption,
      color: Colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: SPACING.section,
    },
    topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 12 },
    topBarTitles: { flex: 1, minWidth: 0 },
    topBarTitle: { ...Typography.h3, color: Colors.textPrimary },
    topBarSubtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  });
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createSettingsStyles);

  return (
    <View key={colorScheme} style={styles.screen}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: SPACING.screen }}>
        <View style={styles.topBar}>
          <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
          <View style={styles.topBarTitles}>
            <Text style={styles.topBarTitle}>Settings</Text>
            <Text style={styles.topBarSubtitle}>Seller account & preferences</Text>
          </View>
        </View>
      </View>

      <View style={screenContentPadding(insets.bottom)}>
        <Text style={[styles.sectionLabel, { marginTop: 0 }]}>Seller</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Profile"
            icon="person-outline"
            subtitle="Name, photo, and public profile."
            onPress={() => router.push("/profile/edit")}
          />
          <SettingsRow
            label="Business Information"
            icon="business-outline"
            subtitle="Seller verification and business details."
            onPress={() => router.push("/verify?returnPath=profile")}
          />
          <SettingsRow
            label="Payment Settings"
            icon="card-outline"
            subtitle="Stripe Connect payouts and banking."
            onPress={() => router.push("/verify?returnPath=profile")}
          />
          <SettingsRow
            label="Shopify Integration"
            icon="storefront-outline"
            subtitle="Import and sync inventory from Shopify."
            onPress={() => router.push("/profile/shopify")}
          />
          <SettingsRow
            label="Security"
            icon="lock-closed-outline"
            subtitle="Identity verification and account security."
            onPress={() => router.push("/kyc")}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <SettingsRow
            label="App Preferences"
            icon="options-outline"
            subtitle="Theme, notifications, and more."
            onPress={() => router.push("/profile/app-preferences")}
            isLast
          />
        </View>
      </View>
    </View>
  );
}
