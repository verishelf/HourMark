import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";

type Props = {
  following: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  /** Connections/search row: wide pill, no icon (Instagram-style) */
  compact?: boolean;
};

const IG_BLUE = "#3897F0";

export function FollowButton({
  following,
  loading = false,
  onPress,
  style,
  compact = false,
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => {
        if (loading) return;
        Haptics.selectionAsync();
        onPress();
      }}
      disabled={loading}
      style={({ pressed }) => [
        styles.base,
        compact && styles.baseCompact,
        compact
          ? following
            ? styles.following
            : styles.followCompact
          : following
            ? styles.following
            : styles.follow,
        style,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textPrimary} />
      ) : compact ? (
        <Text
          style={[
            styles.label,
            compact && styles.labelCompact,
            following ? styles.labelFollowing : styles.labelFollow,
            compact && !following && styles.labelFollowCompact,
          ]}
        >
          {following ? "Following" : "Follow"}
        </Text>
      ) : (
        <View style={styles.inner}>
          <Ionicons
            name={following ? "checkmark-circle-outline" : "person-add-outline"}
            size={17}
            color={Colors.textPrimary}
          />
          <Text style={[styles.label, following ? styles.labelFollowing : styles.labelFollow]}>
            {following ? "Following" : "Follow"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  baseCompact: {
    minWidth: 96,
    minHeight: 40,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 12,
  },
  follow: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.textPrimary,
  },
  followCompact: {
    backgroundColor: IG_BLUE,
    borderWidth: 0,
  },
  following: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pressed: {
    opacity: 0.86,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    ...Typography.caption,
    fontSize: 14,
    fontWeight: "600",
  },
  labelFollow: {
    color: Colors.textPrimary,
  },
  labelFollowing: {
    color: Colors.textPrimary,
  },
  labelCompact: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelFollowCompact: {
    color: "#FFFFFF",
  },
  });
}
