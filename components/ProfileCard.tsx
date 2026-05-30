import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/Badge";
import { FollowButton } from "@/components/FollowButton";
import { MessageButton } from "@/components/MessageButton";
import { ProfileFollowStats } from "@/components/ProfileFollowStats";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type FollowAction = {
  following: boolean;
  loading: boolean;
  onPress: () => void;
};

type Props = {
  fullName?: string | null;
  username: string;
  avatarUrl: string;
  verified?: boolean;
  verifiedLabel?: string;
  bio?: string | null;
  sellerRating?: number | null;
  posts: number;
  followers: number;
  following: number;
  onPostsPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onAvatarPress?: () => void;
  showAvatarEdit?: boolean;
  followAction?: FollowAction;
  onMessagePress?: () => void;
  messageLoading?: boolean;
  /** When false, username is shown elsewhere (e.g. nav bar). */
  showUsernameInCard?: boolean;
  /** `aboveBio` shows full name between stats and bio instead of beside the avatar. */
  namePlacement?: "inline" | "aboveBio";
  /** `belowAvatar` stacks username under the profile photo. */
  usernamePlacement?: "beside" | "belowAvatar";
};

export function ProfileCard({
  fullName,
  username,
  avatarUrl,
  verified = false,
  verifiedLabel = "Verified",
  bio,
  sellerRating,
  posts,
  followers,
  following,
  onPostsPress,
  onFollowersPress,
  onFollowingPress,
  onAvatarPress,
  showAvatarEdit = false,
  followAction,
  onMessagePress,
  messageLoading = false,
  showUsernameInCard = true,
  namePlacement = "inline",
  usernamePlacement = "beside",
}: Props) {
  const nameAboveBio = namePlacement === "aboveBio";
  const usernameBelowAvatar = usernamePlacement === "belowAvatar";
  const displayName = fullName?.trim() || null;

  const identityBlock = showUsernameInCard ? (
    <View style={[styles.identity, usernameBelowAvatar && styles.identityBelowAvatar]}>
      <View style={styles.usernameRow}>
        <Text
          style={[styles.username, usernameBelowAvatar && styles.usernameBelowAvatar]}
          numberOfLines={1}
        >
          {username}
        </Text>
        {verified ? <Ionicons name="checkmark-circle" size={16} color="#3897F0" /> : null}
      </View>
      {!nameAboveBio && displayName ? (
        <Text style={styles.displayName} numberOfLines={1}>
          {displayName}
        </Text>
      ) : null}
    </View>
  ) : null;
  const avatar = (
    <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.headerLeft, usernameBelowAvatar && styles.headerLeftStacked]}>
          {onAvatarPress ? (
            <Pressable onPress={onAvatarPress} style={styles.avatarWrap}>
              {avatar}
              {showAvatarEdit ? (
                <View style={styles.editDot}>
                  <Ionicons name="pencil" size={11} color={Colors.textPrimary} />
                </View>
              ) : null}
            </Pressable>
          ) : (
            avatar
          )}

          {identityBlock}
        </View>

        <ProfileFollowStats
          variant="inline"
          posts={posts}
          followers={followers}
          following={following}
          onPostsPress={onPostsPress}
          onFollowersPress={onFollowersPress}
          onFollowingPress={onFollowingPress}
        />
      </View>

      {verified ? <Badge label={verifiedLabel} variant="success" /> : null}
      {nameAboveBio && displayName ? (
        <Text style={styles.nameAboveBio} numberOfLines={2}>
          {displayName}
        </Text>
      ) : null}
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      {sellerRating != null ? (
        <Text style={styles.rating}>{sellerRating.toFixed(1)} seller rating</Text>
      ) : null}

      {followAction || onMessagePress ? (
        <View style={styles.actionsRow}>
          {followAction ? (
            <FollowButton
              following={followAction.following}
              loading={followAction.loading}
              onPress={followAction.onPress}
              style={styles.actionButton}
            />
          ) : null}
          {onMessagePress ? (
            <MessageButton
              onPress={onMessagePress}
              loading={messageLoading}
              style={styles.actionButton}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: Colors.card,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerLeftStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    flexShrink: 0,
    maxWidth: 140,
  },
  avatarWrap: {
    position: "relative",
    flexShrink: 0,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  editDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 2,
  },
  identityBelowAvatar: {
    flex: 0,
    width: "100%",
    alignItems: "flex-start",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },
  username: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontSize: 20,
    lineHeight: 26,
    flexShrink: 1,
  },
  usernameBelowAvatar: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  displayName: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
  },
  nameAboveBio: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  bio: {
    ...Typography.body,
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  rating: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    gap: 32,
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 8,
  },
  actionButton: {
    flex: 1,
    maxWidth: "46%",
  },
});
