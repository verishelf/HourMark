import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchCard } from "@/components/WatchCard";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { getFeaturedListings, getListings } from "@/services/listings";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { Listing } from "@/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [newArrivals, setNewArrivals] = useState<Listing[]>([]);
  const [verified, setVerified] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [feat, all] = await Promise.all([
        getFeaturedListings(),
        getListings(),
      ]);
      setFeatured(feat);
      setNewArrivals(all.slice(0, 3));
      setVerified(all.filter((l) => l.seller?.verified).slice(0, 4));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
          <Text
            style={{
              ...Typography.label,
              color: Colors.textSecondary,
              marginBottom: 4,
            }}
          >
            HourMark
          </Text>
          <Text
            style={{
              ...Typography.hero,
              color: Colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Curated
          </Text>
          <Text
            style={{
              ...Typography.hero,
              color: Colors.textSecondary,
              marginBottom: 32,
            }}
          >
            Timepieces
          </Text>
        </View>

        {loading ? (
          <WatchCardSkeleton />
        ) : (
          <FeaturedCarousel listings={featured} />
        )}

        <View style={{ paddingHorizontal: 20 }}>
          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh listings from verified sellers"
            actionLabel="View all"
          />
          {loading
            ? [0, 1].map((i) => <WatchCardSkeleton key={i} />)
            : newArrivals.map((listing, i) => (
                <WatchCard key={listing.id} listing={listing} index={i} />
              ))}

          <SectionHeader
            title="Verified Sellers"
            subtitle="Trusted collectors & dealers"
          />
          <View style={{ height: 320 }}>
            <FlashList
              data={verified}
              horizontal
              showsHorizontalScrollIndicator={false}
              
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={{ width: 260, marginRight: 16 }}>
                  <WatchCard listing={item} variant="compact" index={index} />
                </View>
              )}
            />
          </View>

          <SectionHeader
            title="Rare Collections"
            subtitle="Exceptional pieces, limited availability"
          />
          {verified.map((listing, i) => (
            <WatchCard
              key={`rare-${listing.id}`}
              listing={listing}
              variant="editorial"
              index={i}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
