import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { StoryComment } from "@/types";

type Props = {
  comment: StoryComment;
};

function createStyles() {
  return StyleSheet.create({
    commentRow: {
      lineHeight: 20,
      marginBottom: 10,
    },
    username: {
      ...Typography.caption,
      color: Colors.textPrimary,
      fontWeight: "700",
      fontSize: 13,
    },
    text: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontSize: 13,
    },
  });
}

export function StoryCommentLine({ comment }: Props) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const username = comment.user?.username ?? comment.user?.full_name ?? "user";

  const openProfile = () => {
    if (comment.user_id) {
      router.push(`/seller/${comment.user_id}`);
    }
  };

  return (
    <Text style={styles.commentRow}>
      <Text onPress={openProfile} style={styles.username}>
        {username}{" "}
      </Text>
      <Text style={styles.text}>{comment.body}</Text>
    </Text>
  );
}
