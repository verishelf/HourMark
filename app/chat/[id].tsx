import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
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
} from "@/services/messaging";
import type { Message } from "@/types";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    getMessages(id).then(setMessages);
    if (user) markMessagesAsRead(id, user.id);

    const unsubscribe = subscribeToMessages(id, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return unsubscribe;
  }, [id, user]);

  const handleSend = async () => {
    if (!text.trim() || !user || !id) return;
    const msg = await sendMessage(id, user.id, text.trim());
    setMessages((prev) => [...prev, msg]);
    setText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>
          Conversation
        </Text>
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
