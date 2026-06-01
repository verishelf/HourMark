import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";

type Tab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function useProfileTabStyles() {
  const { colorScheme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        tabsRow: {
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          marginTop: 8,
          marginBottom: 0,
          marginHorizontal: -SPACING.screen,
        },
        tabButton: {
          alignItems: "center",
          paddingVertical: 14,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 2,
          borderBottomColor: "transparent",
          marginBottom: -1,
        },
        tabsScrollContent: {
          flexDirection: "row",
          paddingHorizontal: SPACING.screen,
          gap: 4,
        },
        tabButtonActive: {
          borderBottomColor: Colors.textPrimary,
        },
        tabLabel: {
          ...Typography.caption,
          color: Colors.textMuted,
          fontWeight: "400",
          fontSize: 14,
          letterSpacing: 0.3,
          flexShrink: 0,
        },
        tabLabelActive: {
          color: Colors.textPrimary,
          fontWeight: "600",
        },
        tabContent: {
          minHeight: 100,
          marginTop: 0,
          paddingTop: 0,
        },
        tabContentPadded: {
          paddingTop: 16,
        },
        tabContentListings: {
          paddingTop: 24,
          paddingBottom: 24,
        },
      }),
    [colorScheme]
  );
}

export function ProfileTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  const profileTabStyles = useProfileTabStyles();

  return (
    <View style={profileTabStyles.tabsRow}>
      <ScrollView
        horizontal
        {...HIDE_SCROLL_INDICATORS}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={profileTabStyles.tabsScrollContent}
      >
        {tabs.map((t) => {
          const selected = active === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              style={[profileTabStyles.tabButton, selected && profileTabStyles.tabButtonActive]}
            >
              <Text
                numberOfLines={1}
                style={[profileTabStyles.tabLabel, selected && profileTabStyles.tabLabelActive]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
