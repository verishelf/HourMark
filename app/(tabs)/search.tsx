import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { FilterChips } from "@/components/FilterChip";
import { SearchBar } from "@/components/SearchBar";
import { WatchCard } from "@/components/WatchCard";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { FILTER_CHIPS, CONDITIONS } from "@/constants/brands";
import { useListings } from "@/hooks/useListings";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [condition, setCondition] = useState<string | undefined>();

  const filters = useMemo(
    () => ({
      search: search || undefined,
      brand: brand !== "All" ? brand : undefined,
      maxPrice,
      condition,
    }),
    [search, brand, maxPrice, condition]
  );

  const { listings, loading } = useListings(filters);

  const priceRanges = [
    { label: "Any", value: undefined as number | undefined },
    { label: "Under $10K", value: 1000000 },
    { label: "Under $50K", value: 5000000 },
    { label: "Under $100K", value: 10000000 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        <Text style={{ ...Typography.h1, color: Colors.textPrimary, marginBottom: 20 }}>
          Search
        </Text>
        <SearchBar value={search} onChangeText={setSearch} />
        <FilterChips chips={FILTER_CHIPS} selected={brand} onSelect={setBrand} />

        <Text
          style={{
            ...Typography.label,
            color: Colors.textMuted,
            marginBottom: 10,
            marginTop: 8,
          }}
        >
          Price
        </Text>
        <FilterChips
          chips={priceRanges.map((r) => r.label)}
          selected={
            priceRanges.find((r) => r.value === maxPrice)?.label ?? "Any"
          }
          onSelect={(label) => {
            const range = priceRanges.find((r) => r.label === label);
            setMaxPrice(range?.value);
          }}
        />

        <Text
          style={{
            ...Typography.label,
            color: Colors.textMuted,
            marginBottom: 10,
          }}
        >
          Condition
        </Text>
        <FilterChips
          chips={["All", ...CONDITIONS]}
          selected={condition ?? "All"}
          onSelect={(c) => setCondition(c === "All" ? undefined : c)}
        />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {loading ? (
          <>
            <WatchCardSkeleton />
            <WatchCardSkeleton />
          </>
        ) : (
          <FlashList
            data={listings}
            
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            ListEmptyComponent={
              <Text
                style={{
                  ...Typography.body,
                  color: Colors.textMuted,
                  textAlign: "center",
                  marginTop: 48,
                }}
              >
                No watches match your search
              </Text>
            }
            renderItem={({ item, index }) => (
              <WatchCard listing={item} index={index} />
            )}
          />
        )}
      </View>
    </View>
  );
}
