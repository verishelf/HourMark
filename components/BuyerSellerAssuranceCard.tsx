import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ListingImage } from "@/components/ListingImage";
import { RICHARD_MILLE_ASSURANCE_IMAGE } from "@/constants/homeImages";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";

const CARD_HEIGHT = 248;
const BACKGROUND_URI = RICHARD_MILLE_ASSURANCE_IMAGE;

const BUYER_POINTS = [
  "Escrow holds funds until delivery",
  "3-day inspection window",
  "AI-verified listings",
] as const;

const SELLER_POINTS = [
  "Identity-verified seller badge",
  "Secure Stripe Connect payouts",
  "Serial checks & trust scoring",
] as const;

function AssuranceColumn({
  label,
  icon,
  points,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  points: readonly string[];
}) {
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <Ionicons name={icon} size={18} color={Colors.textPrimary} />
        <Text style={styles.columnTitle}>{label}</Text>
      </View>
      {points.map((point) => (
        <View key={point} style={styles.pointRow}>
          <View style={styles.bullet} />
          <Text style={styles.pointText}>{point}</Text>
        </View>
      ))}
    </View>
  );
}

export function BuyerSellerAssuranceCard() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - SPACING.screen * 2;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { width: cardWidth, height: CARD_HEIGHT }]}>
        <ListingImage
          uri={BACKGROUND_URI}
          style={[styles.backgroundImage, { width: cardWidth, height: CARD_HEIGHT }]}
          contentFit="cover"
          recyclingKey="home-assurance-card"
        />
        <View
          style={[styles.overlay, { width: cardWidth, height: CARD_HEIGHT }]}
          pointerEvents="none"
        />
        <View style={styles.content}>
          <Text style={styles.title}>Buyer & Seller Assurance</Text>
          <Text style={styles.subtitle}>Protected transactions for collectors and dealers</Text>
          <View style={styles.columns}>
            <AssuranceColumn
              label="Buyers"
              icon="shield-checkmark-outline"
              points={BUYER_POINTS}
            />
            <View style={styles.divider} />
            <AssuranceColumn label="Sellers" icon="ribbon-outline" points={SELLER_POINTS} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.screen,
    marginBottom: 32,
  },
  card: {
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: Colors.cardElevated,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    zIndex: 2,
    flex: 1,
    padding: 18,
    gap: 12,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  columns: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  column: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  columnTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textSecondary,
    marginTop: 7,
  },
  pointText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "stretch",
  },
});
