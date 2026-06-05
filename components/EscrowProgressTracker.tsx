import { useEffect, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { getListingCoverImage } from "@/lib/listingImages";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import type { Listing, OrderStatus } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STEP_WIDTH = 132;
const STEP_GAP = 8;
const TIMELINE_PADDING = SPACING.screen;

const STEPS: {
  key: OrderStatus | "escrow";
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "payment_held", label: "Escrow", subtitle: "Funds secured", icon: "lock-closed" },
  { key: "shipped", label: "Shipped", subtitle: "In transit", icon: "airplane" },
  { key: "delivered", label: "Delivered", subtitle: "At your door", icon: "cube-outline" },
  { key: "inspection_period", label: "Inspect", subtitle: "3-day window", icon: "eye-outline" },
  { key: "completed", label: "Complete", subtitle: "Released", icon: "checkmark-done" },
];

export function getEscrowStepIndex(status: OrderStatus): number {
  if (status === "awaiting_payment" || status === "pending") return -1;
  if (status === "payment_held" || status === "paid") return 0;
  if (status === "shipped") return 1;
  if (status === "delivered") return 2;
  if (status === "inspection_period") return 3;
  if (status === "completed") return 4;
  return -1;
}

type Props = {
  status: OrderStatus;
  inspectionEndsAt?: string | null;
  listing?: Listing | null;
};

export function EscrowProgressTracker({ status, inspectionEndsAt, listing }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const current = getEscrowStepIndex(status);
  const activeIndex = current < 0 ? 0 : current;
  const coverImage = getListingCoverImage(listing?.images);
  const progressRatio = current < 0 ? 0 : current / (STEPS.length - 1);
  const trackWidth = STEPS.length * STEP_WIDTH + (STEPS.length - 1) * STEP_GAP;

  useEffect(() => {
    const targetX = Math.max(
      0,
      activeIndex * (STEP_WIDTH + STEP_GAP) - SCREEN_WIDTH / 2 + STEP_WIDTH / 2 + TIMELINE_PADDING
    );
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const statusLabel =
    current < 0
      ? "Awaiting payment"
      : current >= STEPS.length - 1
        ? "Purchase complete"
        : STEPS[activeIndex]?.label ?? "In progress";

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>ESCROW PROTECTION</Text>
          <Text style={styles.statusTitle}>{statusLabel}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.textPrimary} />
          <Text style={styles.badgeText}>Protected</Text>
        </View>
      </View>

      {inspectionEndsAt && status === "inspection_period" ? (
        <Text style={styles.inspectionNote}>
          Inspection ends {new Date(inspectionEndsAt).toLocaleDateString()}
        </Text>
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        <View style={[styles.trackWrap, { width: trackWidth }]}>
          <View style={styles.trackBase} />
          <MotiView
            animate={{ width: trackWidth * progressRatio }}
            transition={{ type: "timing", duration: 650 }}
            style={styles.trackFill}
          />

          <View style={styles.stepsRow}>
            {STEPS.map((step, index) => {
              const isDone = current >= index;
              const isActive = activeIndex === index && current >= 0;
              const isFirst = index === 0;

              return (
                <View key={step.key} style={styles.step}>
                  <MotiView
                    animate={{
                      scale: isActive ? 1.06 : 1,
                      opacity: current < 0 && index > 0 ? 0.45 : 1,
                    }}
                    transition={{ type: "timing", duration: 350 }}
                    style={[
                      styles.stepCard,
                      isDone && styles.stepCardDone,
                      isActive && styles.stepCardActive,
                    ]}
                  >
                    {isActive ? (
                      <MotiView
                        from={{ opacity: 0.35, scale: 0.92 }}
                        animate={{ opacity: 0, scale: 1.2 }}
                        transition={{ type: "timing", duration: 1400, loop: true }}
                        style={styles.pulseRing}
                      />
                    ) : null}

                    <View style={[styles.iconWrap, isDone && styles.iconWrapDone]}>
                      {isFirst && coverImage ? (
                        <Image
                          source={{ uri: coverImage }}
                          style={styles.listingThumb}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons
                          name={isDone ? "checkmark" : step.icon}
                          size={isFirst ? 18 : 16}
                          color={isDone ? Colors.background : Colors.textPrimary}
                        />
                      )}
                    </View>

                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                      {index === 0 && current < 0 ? "Payment" : step.label}
                    </Text>
                    <Text style={styles.stepSubtitle} numberOfLines={1}>
                      {index === 0 && current < 0 ? "Pending" : step.subtitle}
                    </Text>
                  </MotiView>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: TIMELINE_PADDING,
  },
  eyebrow: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    fontSize: 11,
  },
  statusTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 20,
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  inspectionNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: -4,
    paddingHorizontal: TIMELINE_PADDING,
  },
  scrollContent: {
    paddingHorizontal: TIMELINE_PADDING,
    paddingVertical: 4,
  },
  trackWrap: {
    position: "relative",
    paddingTop: 18,
  },
  trackBase: {
    position: "absolute",
    top: 38,
    left: STEP_WIDTH / 2,
    right: STEP_WIDTH / 2,
    height: 2,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  trackFill: {
    position: "absolute",
    top: 38,
    left: STEP_WIDTH / 2,
    height: 2,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  stepsRow: {
    flexDirection: "row",
    gap: STEP_GAP,
  },
  step: {
    width: STEP_WIDTH,
  },
  stepCard: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "rgba(10,10,10,0.72)",
    overflow: "hidden",
  },
  stepCardDone: {
    borderColor: Colors.borderLight,
  },
  stepCardActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pulseRing: {
    position: "absolute",
    top: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  iconWrapDone: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  listingThumb: {
    width: "100%",
    height: "100%",
  },
  stepLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  stepLabelActive: {
    color: Colors.textPrimary,
  },
  stepSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
});
