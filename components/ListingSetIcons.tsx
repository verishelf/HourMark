import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { resolveListingAccessories } from "@/lib/listingAccessories";
import type { Listing } from "@/types";

type IconName = keyof typeof Ionicons.glyphMap;

const SET_ITEMS: {
  key: keyof ReturnType<typeof resolveListingAccessories>;
  label: string;
  icon: IconName;
}[] = [
  { key: "includesBox", label: "Box", icon: "cube-outline" },
  { key: "includesPapers", label: "Papers", icon: "document-text-outline" },
  { key: "includesWarrantyCard", label: "Card", icon: "ribbon-outline" },
];

type Props = {
  listing: Pick<
    Listing,
    | "includes_box"
    | "includes_papers"
    | "includes_warranty_card"
    | "trust_badges"
  >;
  compact?: boolean;
  /** Sits beside title on cards — no block margins */
  inline?: boolean;
};

export function ListingSetIcons({ listing, compact = false, inline = false }: Props) {
  const accessories = resolveListingAccessories(listing as Listing);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: compact || inline ? 6 : 16,
        flexShrink: 0,
        marginTop: inline ? 0 : compact ? 6 : 0,
        marginBottom: inline ? 0 : compact ? 4 : 8,
      }}
    >
      {SET_ITEMS.map((item) => {
        const included = accessories[item.key];
        return (
          <View
            key={item.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: compact ? 4 : 6,
              opacity: included ? 1 : 0.28,
            }}
          >
            <Ionicons
              name={item.icon}
              size={compact ? 14 : 18}
              color={included ? Colors.textPrimary : Colors.textMuted}
            />
            {!compact && (
              <Text
                style={{
                  ...Typography.caption,
                  fontSize: 11,
                  color: included ? Colors.textSecondary : Colors.textMuted,
                  letterSpacing: 0.3,
                }}
              >
                {item.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
