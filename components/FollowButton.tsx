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

type Props = {
  following: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function FollowButton({ following, loading = false, onPress, style }: Props) {
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
        following ? styles.following : styles.follow,
        style,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textPrimary} />
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

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  follow: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.textPrimary,
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
});
