import { Image } from "expo-image";
import { StyleSheet, View, type ViewStyle } from "react-native";

const LOGO = require("@/assets/crownly-logo.png");

type Props = {
  width?: number;
  height?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function CrownlyLogo({
  width = 132,
  height,
  style,
  accessibilityLabel = "Crownly",
}: Props) {
  const resolvedHeight = height ?? width;

  return (
    <View style={[styles.wrap, style]} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Image
        source={LOGO}
        style={{ width, height: resolvedHeight }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
