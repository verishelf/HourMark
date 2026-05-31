import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { ConversationRow } from "@/components/ConversationRow";
import { EmptyState } from "@/components/EmptyState";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { SPACING } from "@/constants/layout";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useAuth } from "@/hooks/useAuth";
import { deleteConversation, getConversations } from "@/services/messaging";
import { tabContentPadding } from "@/styles/layout";
import type { Conversation } from "@/types";

const ROW_ESTIMATED_HEIGHT = 96;

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
        onSignIn={() => router.push("/auth/welcome")}
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
      <ScreenHeader
        title="Messages"
        subtitle="Your conversations"
        style={{ paddingBottom: SPACING.screen / 2 }}
      />

      <FlashList
        data={conversations}
        keyExtractor={(item) => item.id}
        estimatedItemSize={ROW_ESTIMATED_HEIGHT}
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          ...tabContentPadding(insets.bottom),
          paddingTop: 4,
        }}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: SPACING.screen, paddingTop: 48 }}>
            <EmptyState
              icon="chatbubble-outline"
              title="No conversations yet"
              body="Message a seller from any listing to start a conversation."
            />
          </View>
        }
        renderItem={({ item }) => (
          <SwipeToDeleteRow onDelete={() => confirmDeleteConversation(item.id)}>
            <ConversationRow
              conversation={item}
              unread={isUnread(item)}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          </SwipeToDeleteRow>
        )}
      />
    </View>
  );
}
