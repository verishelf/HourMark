import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { OrderStatus } from "@/types";

const STEPS: { key: OrderStatus | "escrow"; label: string }[] = [
  { key: "payment_held", label: "Funds held" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "inspection_period", label: "Inspection" },
  { key: "completed", label: "Released" },
];

function stepIndex(status: OrderStatus): number {
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
};

export function EscrowProgressTracker({ status, inspectionEndsAt }: Props) {
  const current = stepIndex(status);

  return (
    <View>
      <Text style={{ ...Typography.caption, color: Colors.textMuted, letterSpacing: 1 }}>
        ESCROW PROTECTION
      </Text>
      {inspectionEndsAt && status === "inspection_period" && (
        <Text style={{ ...Typography.caption, color: Colors.textSecondary, marginTop: 4 }}>
          Inspection ends {new Date(inspectionEndsAt).toLocaleDateString()}
        </Text>
      )}
      <View style={{ marginTop: 16, gap: 12 }}>
        {STEPS.map((step, i) => {
          const done = current >= i;
          return (
            <View key={step.key} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Ionicons
                name={done ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={done ? Colors.textPrimary : Colors.textMuted}
              />
              <Text
                style={{
                  ...Typography.body,
                  color: done ? Colors.textPrimary : Colors.textMuted,
                }}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
