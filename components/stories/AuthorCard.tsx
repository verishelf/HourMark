import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { SPACING, RADIUS, STORY_GUTTER } from "@/constants/layout";
import type { Author } from "@/types";

type Props = {
  author: Author;
};

export function AuthorCard({ author }: Props) {
  return (
    <View style={styles.card}>
      {author.avatar_url ? (
        <Image source={{ uri: author.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{author.name}</Text>
        {author.title ? <Text style={styles.title}>{author.title}</Text> : null}
        {author.bio ? <Text style={styles.bio} numberOfLines={3}>{author.bio}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: SPACING.md,
    marginHorizontal: STORY_GUTTER,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: Colors.border },
  name: { ...Typography.h3, color: Colors.textPrimary },
  title: { ...Typography.caption, color: Colors.gold, marginTop: 2 },
  bio: { ...Typography.caption, color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },
});
