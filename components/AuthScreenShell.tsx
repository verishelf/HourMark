import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthImageSlider } from "@/components/AuthImageSlider";
import { CrownlyLogo } from "@/components/CrownlyLogo";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  secondaryLabel: string;
  onSecondary: () => void;
  onBack?: () => void;
  topActionLabel?: string;
  onTopAction?: () => void;
  footerExtra?: ReactNode;
};

export function AuthScreenShell({
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimary,
  primaryLoading,
  secondaryLabel,
  onSecondary,
  onBack,
  topActionLabel = "Sign In",
  onTopAction,
  footerExtra,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={styles.back}>←</Text>
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
        <CrownlyLogo width={88} />
        <Pressable
          onPress={onTopAction ?? onSecondary}
          hitSlop={8}
          style={styles.topAction}
        >
          <Text style={styles.topActionText}>{topActionLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <AuthImageSlider height={220} />

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <LuxuryButton
          label={primaryLabel}
          onPress={onPrimary}
          loading={primaryLoading}
          size="large"
        />
        <View style={styles.gap} />
        <LuxuryButton label={secondaryLabel} onPress={onSecondary} variant="outline" size="large" />
        {footerExtra}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screen,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  back: {
    color: Colors.textPrimary,
    fontSize: 24,
    width: 28,
  },
  topAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 999,
  },
  topActionText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: SPACING.screen,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.card,
    padding: 20,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontSize: 28,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 22,
  },
  bottomBar: {
    paddingHorizontal: SPACING.screen,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  gap: {
    height: 10,
  },
});
