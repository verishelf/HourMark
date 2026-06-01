import { View } from "react-native";
import { FirstListingPlaceholderCard } from "@/components/FirstListingPlaceholderCard";
import { GRID_GAP } from "@/styles/layout";

type Props = {
  count?: number;
  onPress?: () => void;
};

export function ListingPlaceholderGrid({ count = 4, onPress }: Props) {
  const placeholders = Array.from({ length: count }, (_, i) => i);
  const rows: number[][] = [];
  for (let i = 0; i < placeholders.length; i += 2) {
    rows.push(placeholders.slice(i, i + 2));
  }

  return (
    <View style={{ gap: GRID_GAP }}>
      {rows.map((row) => (
        <View key={row.join("-")} style={{ flexDirection: "row", gap: GRID_GAP }}>
          {row.map((index) => (
            <View key={index} style={{ flex: 1, minWidth: 0 }}>
              <FirstListingPlaceholderCard variant="grid" onPress={onPress} />
            </View>
          ))}
          {row.length === 1 ? <View style={{ flex: 1, minWidth: 0 }} /> : null}
        </View>
      ))}
    </View>
  );
}
