import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ImageOverlayButtonColors } from "@/constants/colors";

type Props = {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  filled?: boolean;
  badge?: number;
  /** `surface` for page headers; `overlay` for buttons on photos; `ghost` for bare icons */
  variant?: "surface" | "overlay" | "ghost";
};

export function HeaderIconButton({
  onPress,
  icon,
  filled,
  badge,
  variant = "surface",
}: Props) {
  const isOverlay = variant === "overlay";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: isGhost ? 36 : 40,
        height: isGhost ? 36 : 40,
        borderRadius: isGhost ? 0 : 20,
        backgroundColor: isGhost
          ? "transparent"
          : isOverlay
            ? ImageOverlayButtonColors.background
            : Colors.cardElevated,
        borderWidth: isGhost || isOverlay ? 0 : 1,
        borderColor: isOverlay ? "transparent" : Colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={icon}
        size={isGhost ? 24 : 22}
        color={
          isGhost
            ? Colors.textPrimary
            : isOverlay
              ? filled
                ? ImageOverlayButtonColors.icon
                : ImageOverlayButtonColors.iconMuted
              : filled
                ? Colors.textPrimary
                : Colors.textSecondary
        }
      />
      {badge != null && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: Colors.textPrimary,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: Colors.background, fontSize: 10, fontWeight: "700" }}>
            {badge > 9 ? "9+" : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
