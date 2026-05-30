import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type Props = {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
};

export function SwipeToDeleteRow({ children, onDelete, deleteLabel = "Delete" }: Props) {
  const renderRightActions = () => (
    <Pressable onPress={onDelete} style={styles.deleteAction}>
      <Ionicons name="trash-outline" size={22} color={Colors.textPrimary} />
      <Text style={styles.deleteLabel}>{deleteLabel}</Text>
    </Pressable>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      containerStyle={styles.swipeContainer}
    >
      <View style={styles.rowContent}>{children}</View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    width: 88,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderTopRightRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  deleteLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
});
