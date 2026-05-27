import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { FilterChip } from "@/components/FilterChip";
import { HorizontalListingScroll } from "@/components/HorizontalListingScroll";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { LUXURY_BRANDS } from "@/constants/brands";
import { getFeaturedListings, getListings } from "@/services/listings";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { tabContentPadding } from "@/styles/layout";
import type { Listing } from "@/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [newArrivals, setNewArrivals] = useState<Listing[]>([]);
  const [verified, setVerified] = useState<Listing[]>([]);
  const [rareCollections, setRareCollections] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [feat, all] = await Promise.all([
        getFeaturedListings(),
        getListings(),
      ]);
      setFeatured(feat);
      setNewArrivals(all.slice(0, 6));
      setVerified(all.filter((l) => l.seller?.verified).slice(0, 6));
      setRareCollections(
        all
          .filter((l) => l.authenticated || (l.price ?? 0) > 5000000)
          .slice(0, 6)
      );
      setLoading(false);
    }
    load();
  }, []);

  const goToSearchWithBrand = (brand: string) => {
    router.push({ pathname: "/search", params: { brand } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tabContentPadding(insets.bottom)}
      >
        <ScreenHeader
          label="HourMark"
          title="Curated Timepieces"
          subtitle="Authenticated luxury watches from verified sellers"
        />

        {loading ? (
          <View style={{ paddingHorizontal: SPACING.screen }}>
            <WatchCardSkeleton />
          </View>
        ) : (
          <FeaturedCarousel listings={featured} />
        )}

        <View style={{ paddingHorizontal: SPACING.screen, marginTop: 24 }}>
          <SectionHeader title="Shop by Brand" subtitle="Explore top maisons" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            style={{ marginBottom: 24 }}
          >
            {LUXURY_BRANDS.slice(0, 8).map((brand) => (
              <FilterChip
                key={brand}
                label={brand}
                active={false}
                onPress={() => goToSearchWithBrand(brand)}
              />
            ))}
          </ScrollView>

          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh listings from verified sellers"
            actionLabel="View all"
            onAction={() => router.push("/search")}
          />
          <HorizontalListingScroll listings={newArrivals} loading={loading} />

          <SectionHeader
            title="Verified Sellers"
            subtitle="Trusted collectors & dealers"
          />
          <HorizontalListingScroll listings={verified} loading={loading} />

          <SectionHeader
            title="Rare Collections"
            subtitle="Exceptional pieces, limited availability"
          />
          <HorizontalListingScroll listings={rareCollections} loading={loading} />
        </View>
      </ScrollView>
    </View>
  );
}
