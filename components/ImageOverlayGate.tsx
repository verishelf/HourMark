import { Image } from "expo-image";
import { ScrollView, StyleSheet, View, type ReactNode, type ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";

type Props = {
  backgroundImage: string;
  children: ReactNode;
  style?: ViewStyle;
};

function createStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    background: {
      ...StyleSheet.absoluteFillObject,
    },
    overlayDark: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.62)",
    },
    overlayLight: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(255,255,255,0.88)",
    },
    scroll: {
      flex: 1,
      zIndex: 2,
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SPACING.screen,
      paddingVertical: 32,
    },
  });
}

export function ImageOverlayGate({ backgroundImage, children, style }: Props) {
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isLight = colorScheme === "light";

  return (
    <View style={[styles.screen, style]}>
      <Image source={{ uri: backgroundImage }} style={styles.background} contentFit="cover" />
      <View
        style={isLight ? styles.overlayLight : styles.overlayDark}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
