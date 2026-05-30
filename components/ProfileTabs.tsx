import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Tab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function ProfileTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <View style={profileTabStyles.tabsRow}>
      {tabs.map((t) => {
        const selected = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[profileTabStyles.tabButton, selected && profileTabStyles.tabButtonActive]}
          >
            <Text style={[profileTabStyles.tabLabel, selected && profileTabStyles.tabLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const profileTabStyles = StyleSheet.create({
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: 8,
    marginBottom: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
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
});
