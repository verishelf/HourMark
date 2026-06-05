import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import type { Ionicons } from "@expo/vector-icons";

const ICON_STEP = 46;
const STACK_PEEK = 7;
const COLLAPSED_WIDTH = 40;
const EXPANDED_WIDTH = 40 + ICON_STEP * 2;

type Action = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
};

type Props = {
  unreadNotifs?: number;
  onNotifications: () => void;
  onScanner: () => void;
  onCreatePost: () => void;
};

export function HomeQuickActions({
  unreadNotifs,
  onNotifications,
  onScanner,
  onCreatePost,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const actions: Action[] = [
    {
      key: "add",
      icon: "add",
      onPress: onCreatePost,
    },
    {
      key: "scan",
      icon: "scan-outline",
      onPress: onScanner,
    },
    {
      key: "notifications",
      icon: "notifications-outline",
      onPress: onNotifications,
      badge: unreadNotifs && unreadNotifs > 0 ? unreadNotifs : undefined,
    },
  ];

  const collapse = () => setExpanded(false);

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((open) => !open);
  };

  const handleAction = (action: Action) => {
    if (!expanded) {
      toggleExpanded();
      return;
    }
    collapse();
    action.onPress();
  };

  return (
    <View style={styles.wrap}>
      {expanded ? (
        <Pressable style={styles.backdrop} onPress={collapse} accessibilityLabel="Close actions" />
      ) : null}

      <MotiView
        animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={{ type: "timing", duration: 220 }}
        style={styles.cluster}
      >
        {actions.map((action, index) => (
          <MotiView
            key={action.key}
            animate={{
              translateX: expanded ? -index * ICON_STEP : -index * STACK_PEEK,
            }}
            transition={{ type: "timing", duration: 220 }}
            style={[styles.iconSlot, { zIndex: actions.length - index }]}
          >
            <HeaderIconButton
              icon={action.icon}
              badge={action.badge}
              onPress={() => handleAction(action)}
            />
          </MotiView>
        ))}

        {!expanded ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={toggleExpanded}
            accessibilityLabel="Show quick actions"
            accessibilityRole="button"
          />
        ) : null}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: -120,
    bottom: -400,
    left: -400,
    right: -20,
    zIndex: 0,
  },
  cluster: {
    height: 40,
    position: "relative",
    zIndex: 1,
    overflow: "visible",
  },
  iconSlot: {
    position: "absolute",
    right: 0,
    top: 0,
  },
});
