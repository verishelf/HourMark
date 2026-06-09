import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ListingImage } from "@/components/ListingImage";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useRecentSales } from "@/hooks/useRecentSales";
import { resolveListingImageUrl } from "@/lib/listingImages";

function formatSalePrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US")}`;
  return `$${value.toFixed(0)}`;
}

function formatSoldDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function HomeChartsPanel() {
  const router = useRouter();
  const { items, loading } = useRecentSales();

  return (
    <View style={{ paddingHorizontal: SPACING.screen, paddingTop: 0 }}>
      <SectionHeader
        title="Recent Sales"
        subtitle="Closed deals across Crownly"
      />

      {loading ? (
        <Text style={styles.muted}>Loading market data…</Text>
      ) : items.length === 0 ? (
        <Text style={styles.muted}>No recent sales yet.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const imageUri = item.imageUrl ? resolveListingImageUrl(item.imageUrl) : null;

            return (
              <Pressable
                key={item.id}
                style={styles.row}
                onPress={() => router.push(`/listing/${item.listingId}`)}
              >
                <View style={styles.thumbWrap}>
                  {imageUri ? (
                    <ListingImage uri={imageUri} style={styles.thumb} recyclingKey={item.listingId} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Ionicons name="watch-outline" size={18} color={Colors.textMuted} />
                    </View>
                  )}
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.brand} {item.model}
                  </Text>
                  {item.reference ? (
                    <Text style={styles.rowRef} numberOfLines={1}>
                      Ref. {item.reference}
                    </Text>
                  ) : null}
                  <Text style={styles.rowDate}>{formatSoldDate(item.soldAt)}</Text>
                </View>
                <Text style={styles.rowPrice}>{formatSalePrice(item.price)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const THUMB_SIZE = 52;

const styles = StyleSheet.create({
  list: {
    gap: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thumbWrap: {
    borderRadius: THUMB_SIZE / 2,
    overflow: "hidden",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  rowRef: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  rowPrice: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  muted: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 24,
    textAlign: "center",
  },
});
