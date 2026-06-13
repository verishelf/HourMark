import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { EmptyState } from "@/components/EmptyState";
import { HomeFixedHeader } from "@/components/HomeFixedHeader";
import { TrustAssuranceCarousel } from "@/components/TrustAssuranceCarousel";
import { StoryHomeSection } from "@/components/stories/StoryHomeSection";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { FilterChip } from "@/components/FilterChip";
import { HorizontalListingScroll } from "@/components/HorizontalListingScroll";
import { ListingGrid } from "@/components/ListingGrid";
import { CrownlyHomeWordmark } from "@/components/CrownlyHomeWordmark";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchCardSkeleton, ListingGridSkeleton } from "@/components/SkeletonLoader";
import { LUXURY_BRANDS } from "@/constants/brands";
import { HOME_MARKET_TABS, type HomeMarketTab } from "@/constants/homeMarketTabs";
import { subscribeContentRefresh } from "@/lib/contentRefresh";
import { getFeaturedListings, getListings, getListingsFromFollowing, getAuctionListings } from "@/services/listings";
import { useAuth } from "@/hooks/useAuth";
import { useHomeScroll, HomeScrollProvider } from "@/hooks/useCollapsingMarqueeScroll";
import { getUnreadCount } from "@/services/notifications";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { isDisplayableListing } from "@/lib/listingImages";
import { tabContentPadding } from "@/styles/layout";
import type { Listing } from "@/types";

const HomeScrollView = Animated.createAnimatedComponent(ScrollView);

function HomeScreenContent() {
  const insets = useSafeAreaInsets();
  const [pagerWidth, setPagerWidth] = useState(() => Dimensions.get("window").width);
  const router = useRouter();
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [followingListings, setFollowingListings] = useState<Listing[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [newArrivals, setNewArrivals] = useState<Listing[]>([]);
  const [verified, setVerified] = useState<Listing[]>([]);
  const [rareCollections, setRareCollections] = useState<Listing[]>([]);
  const [gridListings, setGridListings] = useState<Listing[]>([]);
  const [auctionListings, setAuctionListings] = useState<Listing[]>([]);
  const [bestSellerListings, setBestSellerListings] = useState<Listing[]>([]);
  const [lowPriceListings, setLowPriceListings] = useState<Listing[]>([]);
  const [newArrivalFeed, setNewArrivalFeed] = useState<Listing[]>([]);
  const [rareFindListings, setRareFindListings] = useState<Listing[]>([]);
  const [marketplaceEmpty, setMarketplaceEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HomeMarketTab>("marketplace");
  const activeTabRef = useRef<HomeMarketTab>("marketplace");
  const loadRequestId = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const isFirstFocusRef = useRef(true);
  const pagerRef = useRef<ScrollView>(null);
  const verticalScrollRefs = useRef<(ScrollView | null)[]>([]);
  const { scrollHandler, resetMarquee, headerInsetStyle } = useHomeScroll();

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const applyHomeData = useCallback((feat: Listing[], all: Listing[]) => {
    const displayable = all.filter(isDisplayableListing);

    const newArr = displayable.slice(0, 6);
    const verifiedList = displayable
      .filter((l) => l.seller?.verified)
      .slice(0, 6);
    const rare = displayable
      .filter((l) => l.authenticated || (l.price ?? 0) > 5_000_000)
      .slice(0, 6);

    const bestSellers = [...displayable]
      .sort((a, b) => {
        const salesDiff = (b.seller?.total_sales ?? 0) - (a.seller?.total_sales ?? 0);
        if (salesDiff !== 0) return salesDiff;
        return (b.seller?.seller_rating ?? 0) - (a.seller?.seller_rating ?? 0);
      })
      .slice(0, 24);

    const lowPrice = [...displayable].sort((a, b) => a.price - b.price).slice(0, 24);

    const newest = [...displayable]
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 24);

    const rareFinds = [...displayable]
      .filter(
        (l) =>
          l.authenticated ||
          (l.ai_trust_score ?? 0) >= 80 ||
          (l.price ?? 0) > 5_000_000
      )
      .sort((a, b) => b.price - a.price)
      .slice(0, 24);

    setMarketplaceEmpty(displayable.length === 0);
    setFeatured(feat.filter(isDisplayableListing));
    setNewArrivals(newArr);
    setVerified(verifiedList);
    setRareCollections(rare);
    setGridListings(displayable.slice(0, 12));
    setBestSellerListings(bestSellers);
    setLowPriceListings(lowPrice);
    setNewArrivalFeed(newest);
    setRareFindListings(rareFinds);
  }, []);

  const loadHome = useCallback(async (options?: { showLoading?: boolean }) => {
    const requestId = ++loadRequestId.current;
    const isStale = () => requestId !== loadRequestId.current;
    const showLoading = options?.showLoading ?? !hasLoadedOnceRef.current;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const maxAttempts = 3;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const [feat, all, auctions] = await Promise.all([
            getFeaturedListings(),
            getListings(),
            getAuctionListings(),
          ]);
          if (isStale()) return;

          applyHomeData(feat, all);
          setAuctionListings(auctions.filter(isDisplayableListing));
          hasLoadedOnceRef.current = true;
          return;
        } catch {
          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
          }
        }
      }

      if (isStale()) return;

      if (!hasLoadedOnceRef.current) {
        setMarketplaceEmpty(true);
        setFeatured([]);
        setNewArrivals([]);
        setVerified([]);
        setRareCollections([]);
        setGridListings([]);
        setAuctionListings([]);
        setBestSellerListings([]);
        setLowPriceListings([]);
        setNewArrivalFeed([]);
        setRareFindListings([]);
      }
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, [applyHomeData]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (!user?.id) {
      setFollowingListings([]);
      setUnreadNotifs(0);
      return;
    }

    let cancelled = false;
    const userId = user.id;

    Promise.all([getListingsFromFollowing(userId), getUnreadCount(userId)]).then(
      ([following, unread]) => {
        if (!cancelled) {
          setFollowingListings(following);
          setUnreadNotifs(unread);
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const scrollPagerToIndex = useCallback((index: number, animated: boolean) => {
    if (pagerWidth <= 0 || index < 0) return;
    pagerRef.current?.scrollTo({ x: index * pagerWidth, animated });
  }, [pagerWidth]);

  useEffect(() => {
    if (pagerWidth <= 0) return;
    const index = HOME_MARKET_TABS.findIndex((tab) => tab.key === activeTabRef.current);
    if (index >= 0) {
      scrollPagerToIndex(index, false);
    }
  }, [pagerWidth, scrollPagerToIndex]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
      } else {
        void loadHome({ showLoading: false });
      }

      return subscribeContentRefresh(() => {
        void loadHome({ showLoading: false });
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

  const handleTabPress = useCallback(
    (tab: HomeMarketTab) => {
      const index = HOME_MARKET_TABS.findIndex((t) => t.key === tab);
      if (index < 0) return;

      setActiveTab(tab);
      resetMarquee();
      scrollPagerToIndex(index, true);
      verticalScrollRefs.current[index]?.scrollTo({ y: 0, animated: false });
    },
    [resetMarquee, scrollPagerToIndex]
  );

  const syncTabFromPagerOffset = useCallback(
    (offsetX: number) => {
      if (pagerWidth <= 0) return;
      const index = Math.round(offsetX / pagerWidth);
      const tab = HOME_MARKET_TABS[index]?.key;
      if (tab && tab !== activeTabRef.current) {
        setActiveTab(tab);
        resetMarquee();
        verticalScrollRefs.current[index]?.scrollTo({ y: 0, animated: false });
      }
    },
    [pagerWidth, resetMarquee]
  );

  const handlePagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncTabFromPagerOffset(event.nativeEvent.contentOffset.x);
    },
    [syncTabFromPagerOffset]
  );

  const renderMarketplacePanel = () => (
    <>
      <View style={styles.marketplaceHero}>
        <CrownlyHomeWordmark />

        <View style={styles.sliderLayer}>
          {loading ? (
            <View style={{ paddingHorizontal: SPACING.screen }}>
              <WatchCardSkeleton variant="featured" />
            </View>
          ) : (
            <FeaturedCarousel listings={featured} showEmptyPlaceholder={marketplaceEmpty} />
          )}
        </View>
      </View>

      <TrustAssuranceCarousel />
      <StoryHomeSection />

      {followingListings.length > 0 ? (
        <View style={{ paddingHorizontal: SPACING.screen, marginTop: 24 }}>
          <SectionHeader title="From Collectors You Follow" subtitle="Personalized for you" />
          <HorizontalListingScroll listings={followingListings} />
        </View>
      ) : null}

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
        <HorizontalListingScroll
          listings={newArrivals}
          loading={loading}
          showEmptyPlaceholder={marketplaceEmpty}
        />

        <SectionHeader
          title="Verified Sellers"
          subtitle="Trusted collectors & dealers"
          topSpacing={32}
        />
        <HorizontalListingScroll
          listings={verified}
          loading={loading}
          showEmptyPlaceholder={marketplaceEmpty}
        />

        <SectionHeader
          title="Rare Collections"
          subtitle="Exceptional pieces, limited availability"
          topSpacing={32}
        />
        <HorizontalListingScroll
          listings={rareCollections}
          loading={loading}
          showEmptyPlaceholder={marketplaceEmpty}
        />

        <SectionHeader
          title="Explore Watches"
          subtitle="Browse the marketplace"
          actionLabel="View all"
          onAction={() => router.push("/search")}
          topSpacing={32}
        />
        {loading ? (
          <ListingGridSkeleton rows={3} />
        ) : (
          <ListingGrid listings={gridListings} showEmptyPlaceholder={marketplaceEmpty} />
        )}
      </View>
    </>
  );

  const renderTabPanel = (tab: HomeMarketTab) => {
    switch (tab) {
      case "marketplace":
        return renderMarketplacePanel();
      case "auctions":
        return (
          <View style={{ paddingHorizontal: SPACING.screen, paddingTop: 0 }}>
            {loading ? (
              <ListingGridSkeleton rows={3} />
            ) : auctionListings.length ? (
              <>
                <SectionHeader
                  title="Live Auctions"
                  subtitle="Bid on verified timepieces before time runs out"
                  topSpacing={0}
                />
                <ListingGrid listings={auctionListings} showBuy />
              </>
            ) : (
              <EmptyState
                icon="hammer-outline"
                title="No live auctions"
                body="Check back soon — sellers can list watches as timed auctions from the Sell tab."
                fill
              />
            )}
          </View>
        );
      case "best_sellers":
        return (
          <View style={{ paddingHorizontal: SPACING.screen, paddingTop: 0 }}>
            {loading ? (
              <ListingGridSkeleton rows={3} />
            ) : bestSellerListings.length ? (
              <>
                <SectionHeader
                  title="Best Sellers"
                  subtitle="Top pieces from our most trusted sellers"
                  topSpacing={0}
                />
                <ListingGrid listings={bestSellerListings} showBuy />
              </>
            ) : (
              <EmptyState
                icon="trophy-outline"
                title="No best sellers yet"
                body="Listings from top-rated sellers with the most sales will appear here."
                fill
              />
            )}
          </View>
        );
      case "low_price":
        return (
          <View style={{ paddingHorizontal: SPACING.screen, paddingTop: 0 }}>
            {loading ? (
              <ListingGridSkeleton rows={3} />
            ) : lowPriceListings.length ? (
              <>
                <SectionHeader
                  title="Low Price"
                  subtitle="Verified watches at the most accessible price points"
                  topSpacing={0}
                />
                <ListingGrid listings={lowPriceListings} showBuy />
              </>
            ) : (
              <EmptyState
                icon="pricetag-outline"
                title="No listings yet"
                body="Affordable verified listings will show up here as sellers join Crownly."
                fill
              />
            )}
          </View>
        );
      case "new_arrivals":
        return (
          <View style={{ paddingHorizontal: SPACING.screen, paddingTop: 0 }}>
            {loading ? (
              <ListingGridSkeleton rows={3} />
            ) : newArrivalFeed.length ? (
              <>
                <SectionHeader
                  title="New Arrivals"
                  subtitle="The latest verified listings from Crownly sellers"
                  topSpacing={0}
                />
                <ListingGrid listings={newArrivalFeed} showBuy />
              </>
            ) : (
              <EmptyState
                icon="sparkles-outline"
                title="No new arrivals"
                body="Fresh listings will appear here as sellers publish on Crownly."
                fill
              />
            )}
          </View>
        );
      case "rare_finds":
        return (
          <View style={{ paddingHorizontal: SPACING.screen, paddingTop: 0 }}>
            {loading ? (
              <ListingGridSkeleton rows={3} />
            ) : rareFindListings.length ? (
              <>
                <SectionHeader
                  title="Rare Finds"
                  subtitle="Authenticated grails and exceptional collector pieces"
                  topSpacing={0}
                />
                <ListingGrid listings={rareFindListings} showBuy />
              </>
            ) : (
              <EmptyState
                icon="diamond-outline"
                title="No rare finds yet"
                body="High-trust and premium listings will surface here as the marketplace grows."
                fill
              />
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <HomeFixedHeader
          activeTab={activeTab}
          onTabChange={handleTabPress}
          unreadNotifs={unreadNotifs}
          onNotifications={() => router.push("/notifications")}
          onScanner={() => router.push("/scanner/camera")}
          onCreatePost={openCreatePost}
        />
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        decelerationRate="fast"
        {...HIDE_SCROLL_INDICATORS}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          if (width > 0 && width !== pagerWidth) {
            setPagerWidth(width);
          }
        }}
        onMomentumScrollEnd={handlePagerScrollEnd}
        onScrollEndDrag={handlePagerScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {HOME_MARKET_TABS.map((tab, index) => (
          <View key={tab.key} style={{ width: pagerWidth, flex: 1 }}>
            <HomeScrollView
              ref={(ref) => {
                verticalScrollRefs.current[index] = ref;
              }}
              {...HIDE_SCROLL_INDICATORS}
              directionalLockEnabled
              onScroll={activeTab === tab.key ? scrollHandler : undefined}
              scrollEventThrottle={16}
              contentContainerStyle={tabContentPadding(insets.bottom)}
            >
              <Animated.View style={headerInsetStyle}>{renderTabPanel(tab.key)}</Animated.View>
            </HomeScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  marketplaceHero: {
    position: "relative",
    zIndex: 0,
  },
  sliderLayer: {
    position: "relative",
    zIndex: 1,
    elevation: 2,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <HomeScrollProvider topInset={insets.top}>
      <HomeScreenContent />
    </HomeScrollProvider>
  );
}
