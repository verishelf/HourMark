import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";

export default function TabLayout() {
  const { colorScheme } = useTheme();

  return (
    <Tabs
      key={colorScheme}
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        sceneStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="sell" options={{ title: "Sell" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
