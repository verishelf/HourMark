import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { SPACING, RADIUS } from "@/constants/layout";

type Listing = {
  id: string;
  brand: string;
  model: string;
  price: number;
  images: string[];
};

type Props = {
  listings: Listing[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function SuggestedWatchesRow({ listings }: Props) {
  const router = useRouter();
  if (listings.length === 0) return null;

  return (
    <View style={{ marginTop: SPACING.xl, marginBottom: SPACING.xl }}>
      <SectionHeader title="Suggested Watches" compact style={{ paddingHorizontal: SPACING.screen }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.screen, gap: SPACING.md }}
      >
        {listings.map((listing) => (
          <Pressable
            key={listing.id}
            onPress={() => router.push(`/listing/${listing.id}`)}
            style={{
              width: 160,
              borderRadius: RADIUS.md,
              borderWidth: 1,
              borderColor: Colors.border,
              overflow: "hidden",
              backgroundColor: Colors.card,
            }}
          >
            <Image
              source={{ uri: listing.images[0] }}
              style={{ width: "100%", aspectRatio: 1 }}
              contentFit="cover"
            />
            <View style={{ padding: 10 }}>
              <Text style={{ ...Typography.label, fontSize: 10, color: Colors.textMuted }} numberOfLines={1}>
                {listing.brand}
              </Text>
              <Text style={{ ...Typography.caption, color: Colors.textPrimary }} numberOfLines={1}>
                {listing.model}
              </Text>
              <Text style={{ ...Typography.price, fontSize: 14, color: Colors.gold, marginTop: 4 }}>
                {formatPrice(listing.price)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
