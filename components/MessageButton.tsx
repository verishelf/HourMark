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
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
};

export function MessageButton({ onPress, loading = false, style }: Props) {
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
        style,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textPrimary} />
      ) : (
        <View style={styles.inner}>
          <Ionicons name="chatbubble-outline" size={17} color={Colors.textPrimary} />
          <Text style={styles.label}>Message</Text>
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
    color: Colors.textPrimary,
  },
});
