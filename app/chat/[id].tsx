import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageBubble } from "@/components/MessageBubble";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  getConversationById,
} from "@/services/messaging";
import type { Message, UserProfile } from "@/types";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200";

function upsertMessageById(list: Message[], incoming: Message): Message[] {
  if (list.some((item) => item.id === incoming.id)) return list;
  return [...list, incoming];
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !user) return;
    getMessages(id).then(setMessages);
    markMessagesAsRead(id, user.id);
    getConversationById(id, user.id)
      .then((conversation) => setOtherUser(conversation?.other_user ?? null))
      .catch(() => setOtherUser(null));

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
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

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
        <Image
          source={{ uri: otherUser?.avatar_url ?? DEFAULT_AVATAR }}
          style={styles.headerAvatar}
          contentFit="cover"
        />
        <View>
          <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>
            {otherUser?.username ? `@${otherUser.username}` : "Conversation"}
          </Text>
          <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
            Chat
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 16,
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.sender_id === (user?.id ?? "buyer-1")}
            avatarUri={
              item.sender_id === (user?.id ?? "buyer-1")
                ? (profile?.avatar_url ?? undefined)
                : (otherUser?.avatar_url ?? undefined)
            }
            onAvatarPress={() => {
              if (item.sender_id === user?.id) {
                router.push("/(tabs)/profile");
                return;
              }
              router.push(`/seller/${item.sender_id}`);
            }}
          />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

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
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
