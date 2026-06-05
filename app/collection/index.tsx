import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CollectionItemCard } from "@/components/CollectionItemCard";
import { EmptyState } from "@/components/EmptyState";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { formatPrice } from "@/lib/stripe";
import { getCollection, getCollectionStats } from "@/services/collection";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { WatchCollectionItem } from "@/types";

export default function CollectionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [items, setItems] = useState<WatchCollectionItem[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setItems(await getCollection(user.id));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = getCollectionStats(items);

  return (
    <FeatureScreenScaffold
      title="My Collection"
      subtitle="Track value and provenance"
      trailing={
        <Pressable onPress={() => router.push("/scanner")}>
          <Text style={styles.linkText}>Scanner</Text>
        </Pressable>
      }
    >
      {items.length > 0 ? (
        <View style={styles.statRow}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Total value</Text>
            <Text style={styles.statValue}>{formatPrice(stats.totalValue)}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Gain / loss</Text>
            <Text
              style={[
                styles.statValue,
                stats.gainLoss >= 0 ? styles.successText : styles.errorText,
              ]}
            >
              {stats.gainLoss >= 0 ? "+" : "−"}
              {formatPrice(Math.abs(stats.gainLoss))}
            </Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Watches</Text>
            <Text style={styles.statValue}>{stats.count}</Text>
          </View>
        </View>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="Start your collection"
          body="Track watches you own, their value, and Crownly provenance."
          actionLabel="Add watch"
          onAction={() => router.push("/collection/add")}
        />
      ) : (
        <>
          {items.map((item) => (
            <CollectionItemCard key={item.id} item={item} />
          ))}
          <LuxuryButton
            label="Add watch"
            variant="outline"
            onPress={() => router.push("/collection/add")}
          />
        </>
      )}
    </FeatureScreenScaffold>
  );
}
