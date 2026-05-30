import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

type Props = {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  filled?: boolean;
};

export function HeaderIconButton({ onPress, icon, filled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.overlay,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={icon}
        size={22}
        color={filled ? Colors.textPrimary : Colors.textSecondary}
      />
    </Pressable>
  );
}
