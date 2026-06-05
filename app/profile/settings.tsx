import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { SettingsRow } from "@/components/SettingsRow";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useTheme, type ThemePreference } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { screenContentPadding } from "@/styles/layout";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "system",
    label: "System default",
    subtitle: "Follow your phone — light during the day, dark at night.",
    icon: "phone-portrait-outline",
  },
  {
    value: "light",
    label: "Light",
    subtitle: "Bright background across the app.",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    label: "Dark",
    subtitle: "Dark background across the app.",
    icon: "moon-outline",
  },
];

function createSettingsStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    card: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
      overflow: "hidden",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingBottom: 12,
    },
    topBarTitles: {
      flex: 1,
      minWidth: 0,
    },
    topBarTitle: {
      ...Typography.h3,
      color: Colors.textPrimary,
    },
    topBarSubtitle: {
      ...Typography.caption,
      color: Colors.textMuted,
      marginTop: 2,
    },
  });
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, themePreference, setThemePreference } = useTheme();
  const styles = useThemedStyles(createSettingsStyles);

  return (
    <View key={colorScheme} style={styles.screen}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: SPACING.screen }}>
        <View style={styles.topBar}>
          <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
          <View style={styles.topBarTitles}>
            <Text style={styles.topBarTitle}>Settings</Text>
            <Text style={styles.topBarSubtitle}>App preferences</Text>
          </View>
        </View>
      </View>

      <View style={screenContentPadding(insets.bottom)}>
        <View style={styles.card}>
          {THEME_OPTIONS.map((option, index) => {
            const selected = themePreference === option.value;
            return (
              <SettingsRow
                key={option.value}
                label={option.label}
                icon={option.icon}
                subtitle={option.subtitle}
                trailing={
                  selected ? (
                    <Ionicons name="checkmark" size={20} color={Colors.textPrimary} />
                  ) : null
                }
                onPress={() => setThemePreference(option.value)}
                isLast={index === THEME_OPTIONS.length - 1}
              />
            );
          })}
        </View>

        <View style={[styles.card, { marginTop: SPACING.section }]}>
          <SettingsRow
            label="Notifications"
            icon="notifications-outline"
            subtitle="Offers, alerts, and order updates."
            onPress={() => router.push("/notifications")}
          />
          <SettingsRow
            label="Serial lookup"
            icon="shield-checkmark-outline"
            subtitle="Verify Crownly passport and serial history."
            onPress={() => router.push("/passport/lookup")}
            isLast
          />
        </View>
      </View>
    </View>
  );
}
