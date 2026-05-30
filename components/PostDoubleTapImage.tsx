import { useRef, useState } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

const DOUBLE_TAP_MS = 280;
const HEART_VISIBLE_MS = 520;

type Props = {
  uri: string;
  width: number;
  height: number;
  onDoubleTapLike: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PostDoubleTapImage({ uri, width, height, onDoubleTapLike, style }: Props) {
  const lastTapRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heartKey, setHeartKey] = useState(0);

  const flashHeart = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setHeartKey((k) => k + 1);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hideTimerRef.current = setTimeout(() => {
      setHeartKey(0);
      hideTimerRef.current = null;
    }, HEART_VISIBLE_MS);
  };

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      flashHeart();
      onDoubleTapLike();
      return;
    }
    lastTapRef.current = now;
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.frame, { width, height }, style]}
      accessibilityLabel="Post image. Double tap to like."
    >
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="contain"
        contentPosition="center"
      />
      {heartKey > 0 ? (
        <View style={styles.heartOverlay} pointerEvents="none">
          <MotiView
            key={heartKey}
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0.85, 0], scale: [0.5, 1.15, 1.05, 0.9] }}
            transition={{
              opacity: { type: "timing", duration: HEART_VISIBLE_MS },
              scale: { type: "timing", duration: HEART_VISIBLE_MS },
            }}
            style={styles.heartWrap}
          >
            <View style={styles.heartGlow} />
            <Ionicons name="heart" size={92} color="#FF3040" />
          </MotiView>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: Colors.cardElevated,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  heartWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  heartGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
