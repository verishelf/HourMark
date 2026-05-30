import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Props = {
  posts: number;
  followers: number;
  following: number;
  variant?: "default" | "inline";
  onPostsPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
};

function Stat({
  value,
  label,
  onPress,
  compact = false,
}: {
  value: number;
  label: string;
  onPress?: () => void;
  compact?: boolean;
}) {
  const content = (
    <>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  const statStyle = [styles.stat, compact && styles.statCompact];

  if (!onPress) {
    return <View style={statStyle}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [...statStyle, pressed && styles.statPressed]}
      hitSlop={8}
    >
      {content}
    </Pressable>
  );
}

export function ProfileFollowStats({
  posts,
  followers,
  following,
  variant = "default",
  onPostsPress,
  onFollowersPress,
  onFollowingPress,
}: Props) {
  const inline = variant === "inline";

  return (
    <View style={[styles.row, inline && styles.rowInline]}>
      <Stat value={posts} label="Posts" onPress={onPostsPress} compact={inline} />
      <Stat value={followers} label="Followers" onPress={onFollowersPress} compact={inline} />
      <Stat value={following} label="Following" onPress={onFollowingPress} compact={inline} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    gap: 32,
  },
  rowInline: {
    flexShrink: 0,
    justifyContent: "space-between",
    alignSelf: "center",
    width: "auto",
    minWidth: 168,
    gap: 12,
    paddingLeft: 4,
  },
  stat: {
    alignItems: "center",
    minWidth: 72,
    paddingVertical: 2,
  },
  statCompact: {
    minWidth: 0,
    flex: 1,
  },
  statPressed: {
    opacity: 0.7,
  },
  value: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 18,
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
