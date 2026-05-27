import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

const TAB_LABELS: Record<string, { label: string; icon: string }> = {
  index: { label: "Discover", icon: "◆" },
  search: { label: "Search", icon: "○" },
  sell: { label: "Sell", icon: "+" },
  messages: { label: "Messages", icon: "◇" },
  profile: { label: "Profile", icon: "□" },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 12,
        left: 20,
        right: 20,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "rgba(10, 10, 10, 0.95)",
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: 40,
          paddingVertical: 10,
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
        }}
      >
        {state.routes.map((route, index) => {
          const tab = TAB_LABELS[route.name] ?? { label: route.name, icon: "·" };
          const focused = state.index === index;

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

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}
            >
              {focused && (
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: "absolute",
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.border,
                  }}
                />
              )}
              <Text
                style={{
                  fontSize: focused ? 14 : 12,
                  color: focused ? Colors.textPrimary : Colors.textMuted,
                  marginBottom: 2,
                }}
              >
                {tab.icon}
              </Text>
              <Text
                style={{
                  ...Typography.caption,
                  fontSize: 9,
                  color: focused ? Colors.textPrimary : Colors.textMuted,
                  letterSpacing: 0.5,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
