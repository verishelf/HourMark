import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SELLER_FEE_RATE } from "@/constants/colors";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import {
  calculateCommission,
  calculateSellerPayout,
  dollarsToCents,
  formatPrice,
} from "@/lib/stripe";

type Props = {
  priceDollars: string;
  /** Matches List a Watch glass sections vs standard cards */
  tone?: "glass" | "surface";
};

const GLASS_TEXT = "#FFFFFF";
const GLASS_MUTED = "rgba(255,255,255,0.65)";

export function SellerPayoutBreakdown({ priceDollars, tone = "surface" }: Props) {
  const onGlass = tone === "glass";
  const feePercent = (SELLER_FEE_RATE * 100).toFixed(0);

  const { priceCents, feeCents, payoutCents } = useMemo(() => {
    const parsed = parseFloat(priceDollars.replace(/[^0-9.]/g, ""));
    const cents = Number.isFinite(parsed) && parsed > 0 ? dollarsToCents(parsed) : 0;
    return {
      priceCents: cents,
      feeCents: cents > 0 ? calculateCommission(cents) : 0,
      payoutCents: cents > 0 ? calculateSellerPayout(cents) : 0,
    };
  }, [priceDollars]);

  if (priceCents <= 0) {
    return (
      <Text style={[styles.hint, onGlass && styles.hintGlass]}>
        Enter your asking price to see the {feePercent}% selling fee and estimated payout.
      </Text>
    );
  }

  return (
    <View style={[styles.box, onGlass && styles.boxGlass]}>
      <Text style={[styles.title, onGlass && styles.textGlass]}>Estimated payout</Text>
      <View style={styles.row}>
        <Text style={[styles.label, onGlass && styles.textMutedGlass]}>List price</Text>
        <Text style={[styles.value, onGlass && styles.textGlass]}>{formatPrice(priceCents)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, onGlass && styles.textMutedGlass]}>
          Selling fee ({feePercent}%)
        </Text>
        <Text style={[styles.value, onGlass && styles.textMutedGlass]}>
          −{formatPrice(feeCents)}
        </Text>
      </View>
      <View style={[styles.row, styles.totalRow, onGlass && styles.totalRowGlass]}>
        <Text style={[styles.totalLabel, onGlass && styles.textGlass]}>You receive</Text>
        <Text style={[styles.totalValue, onGlass && styles.textGlass]}>
          {formatPrice(payoutCents)}
        </Text>
      </View>
      <Text style={[styles.footnote, onGlass && styles.textMutedGlass]}>
        The selling fee is deducted from your payout when the watch sells. Stripe processing fees
        may also apply.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.sm,
    backgroundColor: Colors.cardElevated,
    gap: 8,
  },
  boxGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  title: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
  },
  value: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRowGlass: {
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  totalLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  totalValue: {
    ...Typography.price,
    color: Colors.textPrimary,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  footnote: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  hintGlass: {
    color: GLASS_MUTED,
  },
  textGlass: {
    color: GLASS_TEXT,
  },
  textMutedGlass: {
    color: GLASS_MUTED,
  },
});
