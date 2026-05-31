import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullScreenAuthSlider } from "@/components/FullScreenAuthSlider";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const goToLogin = () => {
    if (typeof redirect === "string" && redirect.startsWith("/")) {
      router.push({ pathname: "/auth/login", params: { redirect } });
      return;
    }
    router.push("/auth/login");
  };

  return (
    <View style={styles.screen}>
      <FullScreenAuthSlider />

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 20,
            paddingTop: 16,
          },
        ]}
        pointerEvents="box-none"
      >
        <LuxuryButton label="Sign In" onPress={goToLogin} size="large" />
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={styles.guest}
          hitSlop={12}
        >
          <Text style={styles.guestText}>Browse as guest</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.screen,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  guest: {
    marginTop: 14,
    alignItems: "center",
  },
  guestText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
