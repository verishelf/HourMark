import { Alert, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { LISTING_CARD_RADIUS, RADIUS, SPACING } from "@/constants/layout";
import { GRID_GAP } from "@/styles/layout";
import type { UserPost } from "@/types";

const COMPACT_GAP = 2;
const COLUMNS = 3;

function chunkPosts<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }
  return rows;
}

type Props = {
  posts: UserPost[];
  editable?: boolean;
  onEdit?: (post: UserPost) => void;
  onDelete?: (post: UserPost) => void;
  /** Tight 3-column thumbnails for profile grids */
  variant?: "compact" | "default";
  /** No top gap — sits flush under profile tabs */
  flushTop?: boolean;
};

export function PostGrid({
  posts,
  editable,
  onEdit,
  onDelete,
  variant = "default",
  flushTop = false,
}: Props) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = variant === "compact";
  const gap = isCompact ? COMPACT_GAP : GRID_GAP;
  const cellRadius = isCompact && flushTop ? 0 : isCompact ? RADIUS.sm : LISTING_CARD_RADIUS;
  const horizontalInset = isCompact && flushTop ? 0 : SPACING.screen * 2;
  const availableWidth = screenWidth - horizontalInset;
  const cellSize = Math.floor((availableWidth - gap * (COLUMNS - 1)) / COLUMNS);
  const gridContentWidth = cellSize * COLUMNS + gap * (COLUMNS - 1);

  const handleDelete = (post: UserPost) => {
    if (!onDelete) return;
    Alert.alert("Delete post", "Remove this post from your profile?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(post) },
    ]);
  };

  return (
    <View
      style={[
        styles.grid,
        { gap, width: gridContentWidth, alignSelf: "center" },
        flushTop && isCompact && styles.gridFlush,
      ]}
    >
      {chunkPosts(posts).map((row) => (
        <View
          key={row.map((p) => p.id).join("-")}
          style={[
            styles.row,
            { gap, width: gridContentWidth },
            row.length < COLUMNS && styles.rowCentered,
          ]}
        >
          {row.map((post) => (
            <View key={post.id} style={{ width: cellSize, height: cellSize }}>
              <Pressable
                onPress={() => router.push(`/post/${post.id}`)}
                style={({ pressed }) => [
                  styles.cell,
                  { width: cellSize, height: cellSize, borderRadius: cellRadius },
                  pressed && styles.cellPressed,
                ]}
              >
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.image}
                  contentFit="cover"
                  contentPosition="center"
                />
                {editable && (onEdit || onDelete) ? (
                  <View style={styles.cellActions}>
                    {onEdit ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          onEdit(post);
                        }}
                        hitSlop={8}
                        style={styles.actionButton}
                      >
                        <Ionicons name="pencil" size={14} color={Colors.textPrimary} />
                      </Pressable>
                    ) : null}
                    {onDelete ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(post);
                        }}
                        hitSlop={8}
                        style={styles.actionButton}
                      >
                        <Ionicons name="trash-outline" size={14} color={Colors.error} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {},
  gridFlush: {
    marginHorizontal: -SPACING.screen,
  },
  row: {
    flexDirection: "row",
  },
  rowCentered: {
    justifyContent: "center",
  },
  cell: {
    overflow: "hidden",
    backgroundColor: Colors.cardElevated,
  },
  cellPressed: {
    opacity: 0.92,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cellActions: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
});
