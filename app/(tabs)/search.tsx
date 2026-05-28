import { useMemo, useRef, useState, useEffect } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { EmptyState } from "@/components/EmptyState";
import { FilterDropdown } from "@/components/FilterDropdown";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchBar } from "@/components/SearchBar";
import { WatchCard } from "@/components/WatchCard";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { FILTER_CHIPS, CONDITIONS } from "@/constants/brands";
import { useListings } from "@/hooks/useListings";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { tabContentPadding, gridItemStyle, screenContentPadding } from "@/styles/layout";
import type { Listing } from "@/types";

const PRICE_OPTIONS = [
  { label: "All", value: "any" },
  { label: "Under $10K", value: "1000000" },
  { label: "Under $50K", value: "5000000" },
  { label: "Under $100K", value: "10000000" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low", value: "price_asc" },
  { label: "Price: High", value: "price_desc" },
];

const PILL_ROW_HEIGHT = 36;

type SortKey = "newest" | "price_asc" | "price_desc";

function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  const copy = [...listings];
  if (sort === "price_asc") return copy.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") return copy.sort((a, b) => b.price - a.price);
  return copy.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { brand: brandParam } = useLocalSearchParams<{ brand?: string }>();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [condition, setCondition] = useState("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [pillsVisible, setPillsVisible] = useState(true);
  const pillAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (brandParam && typeof brandParam === "string") {
      setBrand(brandParam);
    }
  }, [brandParam]);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      brand: brand !== "All" ? brand : undefined,
      maxPrice,
      condition: condition !== "All" ? condition : undefined,
    }),
    [search, brand, maxPrice, condition]
  );

  const { listings, loading } = useListings(filters);
  const sortedListings = useMemo(
    () => sortListings(listings, sort),
    [listings, sort]
  );

  const brandOptions = FILTER_CHIPS.map((chip) => ({ label: chip, value: chip }));
  const conditionOptions = [
    { label: "All", value: "All" },
    ...CONDITIONS.map((c) => ({ label: c, value: c })),
  ];
  const priceValue = maxPrice ? String(maxPrice) : "any";

  const setPillsShown = (shown: boolean) => {
    if (shown === pillsVisible) return;
    setPillsVisible(shown);
    Animated.timing(pillAnim, {
      toValue: shown ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 32 && y > lastScrollY.current) setPillsShown(false);
    if (y < 8) setPillsShown(true);
    lastScrollY.current = y;
  };

  const pillHeight = pillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PILL_ROW_HEIGHT],
  });

  const listHeader = (
    <View style={{ paddingBottom: 8 }}>
      <Animated.View
        style={{
          height: pillHeight,
          opacity: pillAnim,
          overflow: "hidden",
          marginBottom: pillAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8],
          }),
        }}
      >
        <ScrollView
          horizontal
          {...HIDE_SCROLL_INDICATORS}
          contentContainerStyle={{
            gap: 6,
            alignItems: "center",
            height: PILL_ROW_HEIGHT,
          }}
        >
          <FilterDropdown
            compact
            title="Brand"
            value={brand}
            options={brandOptions}
            onSelect={setBrand}
          />
          <FilterDropdown
            compact
            title="Price"
            value={priceValue}
            options={PRICE_OPTIONS}
            onSelect={(v) => setMaxPrice(v === "any" ? undefined : Number(v))}
          />
          <FilterDropdown
            compact
            title="Condition"
            value={condition}
            options={conditionOptions}
            onSelect={setCondition}
          />
        </ScrollView>
      </Animated.View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ ...Typography.caption, color: Colors.textMuted, fontSize: 12 }}>
          {sortedListings.length} timepiece{sortedListings.length === 1 ? "" : "s"}
        </Text>
        <FilterDropdown
          compact
          title="Sort"
          value={sort}
          options={SORT_OPTIONS}
          onSelect={(v) => setSort(v as SortKey)}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScreenHeader
        title="Search"
        bottomContent={
          <SearchBar
            compact
            value={search}
            onChangeText={setSearch}
            placeholder="Search watches…"
          />
        }
      />

      <View style={{ flex: 1, paddingHorizontal: SPACING.screen }}>
        {loading ? (
          <>
            {listHeader}
            <WatchCardSkeleton variant="grid" />
            <WatchCardSkeleton variant="grid" />
          </>
        ) : (
          <FlashList
            data={sortedListings}
            numColumns={2}
            keyExtractor={(item) => item.id}
            {...HIDE_SCROLL_INDICATORS}
            contentContainerStyle={tabContentPadding(insets.bottom)}
            ListHeaderComponent={listHeader}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              <EmptyState
                icon="search-outline"
                title="No watches found"
                body="Try adjusting your filters or search terms."
              />
            }
            renderItem={({ item, index }) => (
              <View style={gridItemStyle(index)}>
                <WatchCard listing={item} variant="grid" index={index} showBuy={false} />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
