import { useCallback, useMemo, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { BuyerSellerAssuranceCard } from "@/components/BuyerSellerAssuranceCard";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { FilterChip } from "@/components/FilterChip";
import { HorizontalListingScroll } from "@/components/HorizontalListingScroll";
import { ListingGrid } from "@/components/ListingGrid";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { LUXURY_BRANDS } from "@/constants/brands";
import { subscribeContentRefresh } from "@/lib/contentRefresh";
import { getFeaturedListings, getListings } from "@/services/listings";
import { Colors } from "@/constants/colors";
import { CARD_GAP, SPACING } from "@/constants/layout";
import { isDisplayableListing } from "@/lib/listingImages";
import { tabContentPadding } from "@/styles/layout";
import type { Listing } from "@/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [newArrivals, setNewArrivals] = useState<Listing[]>([]);
  const [verified, setVerified] = useState<Listing[]>([]);
  const [rareCollections, setRareCollections] = useState<Listing[]>([]);
  const [gridListings, setGridListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { width: screenWidth } = useWindowDimensions();
  const gridColumnWidth = (screenWidth - SPACING.screen * 2 - CARD_GAP) / 2;

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const [feat, all] = await Promise.all([getFeaturedListings(), getListings()]);
      const displayable = all.filter(isDisplayableListing);

      const newArr = displayable.slice(0, 6);
      const verifiedList = displayable
        .filter((l) => l.seller?.verified)
        .slice(0, 6);
      const rare = displayable
        .filter((l) => l.authenticated || (l.price ?? 0) > 5_000_000)
        .slice(0, 6);

      const carouselIds = new Set(
        [...newArr, ...verifiedList, ...rare].map((l) => l.id)
      );
      const grid = displayable
        .filter((l) => !carouselIds.has(l.id))
        .slice(0, 12);

      setFeatured(feat);
      setNewArrivals(newArr);
      setVerified(verifiedList);
      setRareCollections(rare);
      setGridListings(grid.length ? grid : displayable.slice(0, 12));
    } catch {
      setFeatured([]);
      setNewArrivals([]);
      setVerified([]);
      setRareCollections([]);
      setGridListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const gridSkeletonRows = useMemo(() => [0, 1, 2], []);

  useFocusEffect(
    useCallback(() => {
      loadHome();
      return subscribeContentRefresh(() => {
        loadHome();
      });
    }, [loadHome])
  );

  const goToSearchWithBrand = (brand: string) => {
    router.push({ pathname: "/search", params: { brand } });
  };

  const openCreatePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/post/create");
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top + 12,
          paddingHorizontal: SPACING.screen,
          alignItems: "flex-end",
        }}
      >
        <HeaderIconButton icon="add" onPress={openCreatePost} />
      </View>

      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={tabContentPadding(insets.bottom)}
      >
        <ScreenHeader
          style={{ paddingRight: SPACING.screen + 48 }}
          label="Crownly"
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

        <BuyerSellerAssuranceCard />

        <View style={{ paddingHorizontal: SPACING.screen, marginTop: 24 }}>
          <SectionHeader title="Shop by Brand" subtitle="Explore top maisons" />
          <ScrollView
            horizontal
            {...HIDE_SCROLL_INDICATORS}
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

          <SectionHeader
            title="Explore Watches"
            subtitle="Browse the marketplace"
            actionLabel="View all"
            onAction={() => router.push("/search")}
          />
          {loading ? (
            <View style={{ gap: CARD_GAP }}>
              {gridSkeletonRows.map((row) => (
                <View key={row} style={{ flexDirection: "row", gap: CARD_GAP }}>
                  <View style={{ width: gridColumnWidth }}>
                    <WatchCardSkeleton variant="grid" />
                  </View>
                  <View style={{ width: gridColumnWidth }}>
                    <WatchCardSkeleton variant="grid" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <ListingGrid listings={gridListings} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
