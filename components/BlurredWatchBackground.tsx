import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  imageUri: string;
  children: ReactNode;
};

export function BlurredWatchBackground({ imageUri, children }: Props) {
  const { colorScheme } = useTheme();
  const isLight = colorScheme === "light";

  return (
    <View style={styles.screen}>
      <Image source={{ uri: imageUri }} style={styles.background} contentFit="cover" />
      <BlurView
        intensity={isLight ? 52 : 40}
        tint={isLight ? "light" : "dark"}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isLight ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.48)",
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
