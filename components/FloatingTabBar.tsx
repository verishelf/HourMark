import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getConversations } from "@/services/messaging";

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  emphasize?: boolean;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: "Home", icon: "compass-outline", iconFocused: "compass" },
  search: { label: "Search", icon: "search-outline", iconFocused: "search" },
  sell: {
    label: "Sell",
    icon: "add-circle-outline",
    iconFocused: "add-circle",
    emphasize: true,
  },
  messages: { label: "Messages", icon: "chatbubble-outline", iconFocused: "chatbubble" },
  profile: { label: "Profile", icon: "person-outline", iconFocused: "person" },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    getConversations(user.id).then((conversations) => {
      const count = conversations.filter(
        (c) =>
          c.last_message &&
          c.last_message.sender_id !== user.id &&
          !c.last_message.read_at
      ).length;
      setUnreadCount(count);
    });
  }, [user, state.index]);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        overflow: "hidden",
      }}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.92)",
          paddingBottom: insets.bottom,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            height: SPACING.tabBarHeight,
            alignItems: "center",
          }}
        >
          {state.routes.map((route, index) => {
            const tab = TAB_CONFIG[route.name] ?? {
              label: route.name,
              icon: "ellipse-outline" as const,
              iconFocused: "ellipse" as const,
            };
            const focused = state.index === index;
            const showBadge = route.name === "messages" && unreadCount > 0;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const iconSize = tab.emphasize ? 26 : 22;

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 6,
                }}
              >
                <View style={{ position: "relative" }}>
                  <Ionicons
                    name={focused ? tab.iconFocused : tab.icon}
                    size={iconSize}
                    color={focused ? Colors.textPrimary : Colors.textMuted}
                  />
                  {showBadge && (
                    <View
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -6,
                        minWidth: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: Colors.textPrimary,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: "700",
                          color: Colors.background,
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    ...Typography.caption,
                    fontSize: 10,
                    marginTop: 3,
                    color: focused ? Colors.textPrimary : Colors.textMuted,
                    letterSpacing: 0.3,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
