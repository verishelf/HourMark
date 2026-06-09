import { Orbitron_500Medium, useFonts } from "@expo-google-fonts/orbitron";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { SPACING } from "@/constants/layout";

type Props = {
  fontSize?: number;
};

export function CrownlyHomeWordmark({ fontSize = 32 }: Props) {
  const [fontsLoaded] = useFonts({ Orbitron_500Medium });
  const lineHeight = fontSize * 1.2;
  const sliderOverlap = 11.3;

  return (
    <View
      style={[
        styles.wrap,
        {
          marginBottom: -sliderOverlap,
        },
      ]}
    >
      <Text
        style={[
          styles.wordmark,
          { fontSize, lineHeight },
          fontsLoaded ? { fontFamily: Fonts.orbitronMedium } : null,
        ]}
        accessibilityRole="header"
      >
        Crownly
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    zIndex: -2,
    paddingHorizontal: SPACING.screen,
  },
  wordmark: {
    fontWeight: "500",
    letterSpacing: 2.4,
    color: Colors.textPrimary,
  },
});
