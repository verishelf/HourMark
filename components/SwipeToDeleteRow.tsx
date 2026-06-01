import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";

type Props = {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
};

function createStyles() {
  return StyleSheet.create({
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
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "600",
    },
    swipeContainer: {
      backgroundColor: Colors.background,
    },
    rowContent: {
      flex: 1,
    },
  });
}

export function SwipeToDeleteRow({ children, onDelete, deleteLabel = "Delete" }: Props) {
  const styles = useThemedStyles(createStyles);

  const renderRightActions = () => (
    <Pressable onPress={onDelete} style={styles.deleteAction}>
      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
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
