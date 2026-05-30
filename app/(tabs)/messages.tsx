import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { EmptyState } from "@/components/EmptyState";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  CONVERSATION_DEFAULT_AVATAR,
  getConversationAvatarUri,
  getConversationPrimaryTitle,
  getConversationSubtitle,
  isWatchConversation,
} from "@/lib/conversationDisplay";
import { formatRelativeTime } from "@/lib/utils";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useAuth } from "@/hooks/useAuth";
import { deleteConversation, getConversations } from "@/services/messaging";
import { tabContentPadding } from "@/styles/layout";
import type { Conversation } from "@/types";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setConversations(await getConversations(user.id));
    } catch {
      setConversations([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const confirmDeleteConversation = (conversationId: string) => {
    if (!user) return;
    Alert.alert("Delete conversation", "This will remove the entire thread and all messages.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteConversation(conversationId, user.id);
            setConversations((prev) => prev.filter((c) => c.id !== conversationId));
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not delete conversation");
          }
        },
      },
    ]);
  };

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
          const aboutWatch = isWatchConversation(item);
          const avatarUri = getConversationAvatarUri(item);
          const primaryTitle = getConversationPrimaryTitle(item);
          const subtitle = getConversationSubtitle(item);

          return (
            <SwipeToDeleteRow onDelete={() => confirmDeleteConversation(item.id)}>
            <Pressable
              onPress={() => router.push(`/chat/${item.id}`)}
              style={({ pressed }) => ({
                flexDirection: "row",
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
                backgroundColor: Colors.background,
                opacity: pressed ? 0.8 : 1,
                gap: 12,
              })}
            >
              <Image
                source={{ uri: avatarUri || CONVERSATION_DEFAULT_AVATAR }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: aboutWatch ? RADIUS.sm : 28,
                  backgroundColor: Colors.cardElevated,
                  borderWidth: aboutWatch ? 0 : 1,
                  borderColor: Colors.border,
                }}
                contentFit="cover"
              />
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
                    {primaryTitle}
                  </Text>
                  {item.last_message && (
                    <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
                      {formatRelativeTime(item.last_message.created_at)}
                    </Text>
                  )}
                </View>
                {subtitle ? (
                  <Text
                    style={{
                      ...Typography.caption,
                      color: Colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    {subtitle}
                  </Text>
                ) : null}
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
            </SwipeToDeleteRow>
          );
        }}
      />
    </View>
  );
}
