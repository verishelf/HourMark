import { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { ConversationRow } from "@/components/ConversationRow";
import { EmptyState } from "@/components/EmptyState";
import { ProfileTabs } from "@/components/ProfileTabs";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { SPACING } from "@/constants/layout";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  isListingConversation,
  isProfileConversation,
} from "@/lib/conversationDisplay";
import {
  deleteConversation,
  getConversations,
  markMessagesAsRead,
} from "@/services/messaging";
import { emptyListContentStyle, tabContentPadding } from "@/styles/layout";
import type { Conversation } from "@/types";

type MessageTab = "listings" | "profile";

const MESSAGE_TABS: { key: MessageTab; label: string }[] = [
  { key: "listings", label: "Listings" },
  { key: "profile", label: "Profile" },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const { user, isAuthenticated, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tab, setTab] = useState<MessageTab>("listings");

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

  const filteredConversations = useMemo(() => {
    const filter =
      tab === "listings" ? isListingConversation : isProfileConversation;
    return conversations.filter(filter);
  }, [conversations, tab]);

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

  const openConversation = (item: Conversation) => {
    if (!user) return;

    if (isUnread(item)) {
      const readAt = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === item.id && c.last_message
            ? { ...c, last_message: { ...c.last_message, read_at: readAt } }
            : c
        )
      );
      void markMessagesAsRead(item.id, user.id);
    }

    router.push(`/chat/${item.id}`);
  };

  const emptyState =
    tab === "listings" ? (
      <EmptyState
        fill
        icon="watch-outline"
        title="No listing messages"
        body="Message a seller from any listing to start a conversation about a watch."
      />
    ) : (
      <EmptyState
        fill
        icon="person-outline"
        title="No profile messages"
        body="Direct messages with collectors and sellers will appear here."
      />
    );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader
        title="Messages"
        subtitle="Your conversations"
        style={{ paddingBottom: SPACING.screen / 2 }}
      />

      <View style={{ paddingHorizontal: SPACING.screen }}>
        <ProfileTabs tabs={MESSAGE_TABS} active={tab} onChange={setTab} />
      </View>

      <FlashList
        key={`${tab}-${colorScheme}`}
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={
          filteredConversations.length === 0
            ? emptyListContentStyle(insets.bottom)
            : {
                ...tabContentPadding(insets.bottom),
                paddingTop: 12,
                paddingHorizontal: SPACING.screen,
              }
        }
        ListEmptyComponent={emptyState}
        renderItem={({ item }) => (
          <SwipeToDeleteRow onDelete={() => confirmDeleteConversation(item.id)}>
            <ConversationRow
              conversation={item}
              unread={isUnread(item)}
              onPress={() => openConversation(item)}
            />
          </SwipeToDeleteRow>
        )}
      />
    </View>
  );
}
