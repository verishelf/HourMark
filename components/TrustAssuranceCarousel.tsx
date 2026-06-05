import { useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ListingImage } from "@/components/ListingImage";
import { SectionHeader } from "@/components/SectionHeader";
import { TRUST_ASSURANCE_CARDS, type TrustAssuranceCard } from "@/constants/trustAssurance";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { smoothHorizontalScrollProps } from "@/constants/scroll";
import { Typography } from "@/constants/typography";

const CARD_HEIGHT = 248;
const CARD_GAP = 12;

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

function TrustAssuranceCardView({
  card,
  width,
}: {
  card: TrustAssuranceCard;
  width: number;
}) {
  const [left, right] = card.columns;

  return (
    <View style={[styles.card, { width, height: CARD_HEIGHT }]}>
      <ListingImage
        uri={card.imageUri}
        style={[styles.backgroundImage, { width, height: CARD_HEIGHT }]}
        contentFit="cover"
        recyclingKey={`trust-assurance-${card.id}`}
      />
      <View
        style={[styles.overlay, { width, height: CARD_HEIGHT }]}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.subtitle}>{card.subtitle}</Text>
        <View style={styles.columns}>
          <AssuranceColumn label={left.label} icon={left.icon} points={left.points} />
          <View style={styles.divider} />
          <AssuranceColumn label={right.label} icon={right.icon} points={right.points} />
        </View>
      </View>
    </View>
  );
}

export function TrustAssuranceCarousel() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - SPACING.screen * 2;
  const snapInterval = cardWidth + CARD_GAP;
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    if (index !== activeIndex && index >= 0 && index < TRUST_ASSURANCE_CARDS.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={{ paddingHorizontal: SPACING.screen }}>
        <SectionHeader
          title="Trust & Assurance"
          subtitle="How Crownly protects every transaction"
        />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        {...smoothHorizontalScrollProps(snapInterval)}
        onScroll={onScroll}
        contentContainerStyle={{
          paddingHorizontal: SPACING.screen,
          gap: CARD_GAP,
          paddingBottom: 4,
        }}
      >
        {TRUST_ASSURANCE_CARDS.map((card) => (
          <TrustAssuranceCardView key={card.id} card={card} width={cardWidth} />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {TRUST_ASSURANCE_CARDS.map((card, index) => (
          <View
            key={card.id}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: SPACING.screen,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.textPrimary,
  },
});
