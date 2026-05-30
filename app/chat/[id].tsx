import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatePresence, MotiView } from "moti";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageBubble } from "@/components/MessageBubble";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  deleteMessage,
  getConversationById,
} from "@/services/messaging";
import {
  CONVERSATION_DEFAULT_AVATAR,
  getConversationAvatarUri,
  getConversationPrimaryTitle,
  getConversationSubtitle,
  isWatchConversation,
} from "@/lib/conversationDisplay";
import type { Conversation, Message } from "@/types";

const MESSAGE_ENTER_TRANSITION = { type: "timing" as const, duration: 220 };
const MESSAGE_EXIT_TRANSITION = { type: "timing" as const, duration: 280 };

function upsertMessageById(list: Message[], incoming: Message): Message[] {
  if (list.some((item) => item.id === incoming.id)) return list;
  return [...list, incoming];
}

function removeMessageById(list: Message[], messageId: string): Message[] {
  return list.filter((m) => m.id !== messageId);
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id || !user) return;
    getMessages(id).then(setMessages);
    markMessagesAsRead(id, user.id);
    getConversationById(id, user.id)
      .then((conv) => setConversation(conv))
      .catch(() => setConversation(null));

    const unsubscribe = subscribeToMessages(id, (msg) => {
      setMessages((prev) => upsertMessageById(prev, msg));
    });

    return unsubscribe;
  }, [id, user]);

  const handleSend = async () => {
    if (!text.trim() || !user || !id) return;
    const msg = await sendMessage(id, user.id, text.trim());
    setMessages((prev) => upsertMessageById(prev, msg));
    setText("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleDeleteMessage = (message: Message) => {
    if (!user) return;
    Alert.alert("Delete message", "Remove this message from the conversation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const previous = messages;
          setMessages((prev) => removeMessageById(prev, message.id));
          try {
            await deleteMessage(message.id, user.id);
          } catch (e) {
            setMessages(previous);
            Alert.alert("Error", e instanceof Error ? e.message : "Could not delete message");
          }
        },
      },
    ]);
  };

  const otherUser = conversation?.other_user ?? null;
  const aboutWatch = conversation ? isWatchConversation(conversation) : false;
  const headerImageUri = conversation
    ? getConversationAvatarUri(conversation)
    : CONVERSATION_DEFAULT_AVATAR;
  const headerTitle = conversation
    ? getConversationPrimaryTitle(conversation)
    : "Conversation";
  const headerSubtitle = conversation ? getConversationSubtitle(conversation) : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 24 }}>←</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!otherUser) return;
            if (otherUser.id === user?.id) {
              router.push("/(tabs)/profile");
              return;
            }
            router.push(`/seller/${otherUser.id}`);
          }}
          style={styles.headerThumbPress}
        >
          <Image
            source={{ uri: headerImageUri }}
            style={aboutWatch ? styles.headerListingThumb : styles.headerAvatar}
            contentFit="cover"
          />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...Typography.h3, color: Colors.textPrimary }} numberOfLines={1}>
            {headerTitle}
          </Text>
          <Text style={{ ...Typography.caption, color: Colors.textMuted }} numberOfLines={1}>
            {headerSubtitle ?? (otherUser?.username ? `@${otherUser.username}` : "Chat")}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={[
          styles.listContent,
          messages.length === 0 && styles.listContentEmpty,
        ]}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatePresence initial={false}>
          {messages.map((item) => {
            const isOwn = item.sender_id === user?.id;
            const bubble = (
              <MessageBubble
                message={item}
                isOwn={isOwn}
                avatarUri={
                  isOwn
                    ? (profile?.avatar_url ?? undefined)
                    : (otherUser?.avatar_url ?? undefined)
                }
                onAvatarPress={() => {
                  if (isOwn) {
                    router.push("/(tabs)/profile");
                    return;
                  }
                  router.push(`/seller/${item.sender_id}`);
                }}
              />
            );

            return (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -8, height: 0, marginBottom: 0 }}
                transition={{
                  enter: MESSAGE_ENTER_TRANSITION,
                  exit: MESSAGE_EXIT_TRANSITION,
                }}
                style={styles.messageRow}
              >
                {isOwn ? (
                  <SwipeToDeleteRow onDelete={() => handleDeleteMessage(item)}>
                    {bubble}
                  </SwipeToDeleteRow>
                ) : (
                  bubble
                )}
              </MotiView>
            );
          })}
        </AnimatePresence>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          placeholderTextColor={Colors.textMuted}
          multiline
          style={{
            flex: 1,
            ...Typography.body,
            color: Colors.textPrimary,
            backgroundColor: Colors.card,
            borderWidth: 1,
            borderColor: Colors.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 999,
            maxHeight: 100,
          }}
        />
        <Pressable
          onPress={handleSend}
          style={{
            borderWidth: 1,
            borderColor: Colors.textPrimary,
            backgroundColor: "transparent",
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: Colors.textPrimary, fontSize: 12, fontWeight: "600" }}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  headerThumbPress: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerListingThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.cardElevated,
  },
  listContent: {
    padding: 20,
    paddingBottom: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  messageRow: {
    width: "100%",
    marginBottom: 12,
    overflow: "hidden",
  },
});
