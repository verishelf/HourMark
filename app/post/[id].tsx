import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getPostDetail } from "@/services/posts";
import type { UserPostDetail } from "@/types";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [post, setPost] = useState<UserPostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setPost(await getPostDetail(id, user?.id));
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!id || !post) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <PostCard postId={id} initialPost={post} />
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.screen,
  },
});
