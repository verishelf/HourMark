import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { formatRelativeTime } from "@/lib/utils";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getConversations } from "@/services/messaging";
import type { Conversation } from "@/types";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    getConversations(user.id).then(setConversations);
  }, [user]);

  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          paddingTop: insets.top + 40,
          paddingHorizontal: 20,
          justifyContent: "center",
        }}
      >
        <Text style={{ ...Typography.h1, color: Colors.textPrimary }}>
          Messages
        </Text>
        <Text
          style={{
            ...Typography.body,
            color: Colors.textSecondary,
            marginTop: 12,
          }}
        >
          Sign in to chat with buyers and sellers.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        <Text style={{ ...Typography.h1, color: Colors.textPrimary, marginBottom: 24 }}>
          Messages
        </Text>
      </View>

      <FlashList
        data={conversations}
        
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
        ListEmptyComponent={
          <Text
            style={{
              ...Typography.body,
              color: Colors.textMuted,
              textAlign: "center",
              marginTop: 48,
            }}
          >
            No conversations yet
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.id}`)}
            style={({ pressed }) => ({
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...Typography.h3, color: Colors.textPrimary }}>
                Conversation
              </Text>
              {item.last_message && (
                <Text style={{ ...Typography.caption, color: Colors.textMuted }}>
                  {formatRelativeTime(item.last_message.created_at)}
                </Text>
              )}
            </View>
            {item.last_message && (
              <Text
                style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  marginTop: 6,
                  fontSize: 14,
                }}
                numberOfLines={1}
              >
                {item.last_message.text}
              </Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
