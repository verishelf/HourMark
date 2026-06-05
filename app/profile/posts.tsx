import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { getPostDetail, getUserPosts } from "@/services/posts";
import type { UserPost, UserPostDetail } from "@/types";

function createStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      paddingHorizontal: SPACING.screen,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.background,
    },
    muted: {
      ...Typography.body,
      color: Colors.textMuted,
    },
  });
}

export default function ProfilePostsFeedScreen() {
  const { userId, postId } = useLocalSearchParams<{
    userId: string;
    postId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const listRef = useRef<FlatList<UserPost>>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [detailsById, setDetailsById] = useState<Record<string, UserPostDetail>>({});
  const [loading, setLoading] = useState(true);
  const [scrolledToInitial, setScrolledToInitial] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await fetchWithRetry(() => getUserPosts(userId));
      setPosts(list);

      const details = await fetchWithRetry(() =>
        Promise.all(list.map((p) => getPostDetail(p.id, user?.id)))
      );
      const map: Record<string, UserPostDetail> = {};
      for (const detail of details) {
        if (detail) map[detail.id] = detail;
      }
      setDetailsById(map);
    } catch {
      // Keep existing posts on transient failures.
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || scrolledToInitial || !postId || !posts.length) return;
    const index = posts.findIndex((p) => p.id === postId);
    if (index <= 0) {
      setScrolledToInitial(true);
      return;
    }
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
      setScrolledToInitial(true);
    }, 80);
    return () => clearTimeout(timer);
  }, [loading, postId, posts, scrolledToInitial]);

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: false,
        });
        setScrolledToInitial(true);
      }, 100);
    },
    []
  );

  if (!userId) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Invalid profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.textPrimary} />
        </View>
      ) : !posts.length ? (
        <View style={styles.centered}>
          <Text style={styles.muted}>No posts</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={(item) => item.id}
          {...HIDE_SCROLL_INDICATORS}
          style={{ backgroundColor: Colors.background }}
          contentContainerStyle={{ paddingTop: insets.top + 52, paddingBottom: insets.bottom + 24 }}
          onScrollToIndexFailed={onScrollToIndexFailed}
          renderItem={({ item, index }) => (
            <PostCard
              postId={item.id}
              initialPost={detailsById[item.id]}
              showFeedDivider={index < posts.length - 1}
            />
          )}
        />
      )}
    </View>
  );
}
