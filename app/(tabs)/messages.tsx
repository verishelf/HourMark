import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { EmptyState } from "@/components/EmptyState";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatRelativeTime } from "@/lib/utils";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useAuth } from "@/hooks/useAuth";
import { getConversations } from "@/services/messaging";
import { tabContentPadding } from "@/styles/layout";
import type { Conversation } from "@/types";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    getConversations(user.id).then(setConversations);
  }, [user]);

  if (!isAuthenticated && !loading) {
    return (
      <LoggedOutGate
        title="Messages"
        subtitle="Sign in to connect with buyers and sellers about listings."
        backgroundImage={LOGGED_OUT_GATE_IMAGES.messages}
        onSignIn={() => router.push("/auth/login")}
        onSignUp={() => router.push("/auth/signup")}
      />
    );
  }

  const isUnread = (item: Conversation) =>
    Boolean(
      item.last_message &&
        item.last_message.sender_id !== user?.id &&
        !item.last_message.read_at
    );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader title="Messages" subtitle="Your conversations" />

      <FlashList
        data={conversations}
        keyExtractor={(item) => item.id}
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          ...tabContentPadding(insets.bottom),
          paddingHorizontal: SPACING.screen,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-outline"
            title="No conversations yet"
            body="Message a seller from any listing to start a conversation."
          />
        }
        renderItem={({ item }) => {
          const unread = isUnread(item);
          const listingTitle = item.listing
            ? `${item.listing.brand} ${item.listing.model}`
            : "Conversation";
          const otherUser = item.other_user?.username ?? "User";

          return (
            <Pressable
              onPress={() => router.push(`/chat/${item.id}`)}
              style={({ pressed }) => ({
                flexDirection: "row",
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
                opacity: pressed ? 0.8 : 1,
                gap: 12,
              })}
            >
              {item.listing?.images[0] ? (
                <Image
                  source={{ uri: item.listing.images[0] }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: RADIUS.sm,
                    backgroundColor: Colors.cardElevated,
                  }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: RADIUS.sm,
                    backgroundColor: Colors.cardElevated,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                />
              )}
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      ...Typography.h3,
                      color: Colors.textPrimary,
                      fontSize: 15,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {listingTitle}
                  </Text>
                  {item.last_message && (
                    <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
                      {formatRelativeTime(item.last_message.created_at)}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    ...Typography.caption,
                    color: Colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  @{otherUser}
                </Text>
                {item.last_message && (
                  <Text
                    style={{
                      ...Typography.body,
                      color: unread ? Colors.textPrimary : Colors.textMuted,
                      marginTop: 4,
                      fontSize: 14,
                      fontWeight: unread ? "500" : "400",
                    }}
                    numberOfLines={1}
                  >
                    {item.last_message.text}
                  </Text>
                )}
              </View>
              {unread && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.textPrimary,
                    alignSelf: "center",
                  }}
                />
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
