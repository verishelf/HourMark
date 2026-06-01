import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { resolveAvatarUri } from "@/lib/avatar";

type Props = {
  uri?: string | null;
  size: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function UserAvatar({
  uri,
  size,
  borderRadius,
  borderWidth = 0,
  borderColor = Colors.border,
  style,
}: Props) {
  const radius = borderRadius ?? size / 2;
  const resolved = resolveAvatarUri(uri);
  const shellStyle = [
    styles.shell,
    {
      width: size,
      height: size,
      borderRadius: radius,
      borderWidth,
      borderColor,
    },
    style,
  ];

  if (resolved) {
    return (
      <View style={shellStyle}>
        <Image
          source={{ uri: resolved }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
        />
      </View>
    );
  }

  const iconSize = Math.max(16, Math.round(size * 0.48));

  return (
    <View style={shellStyle}>
      <Ionicons name="person" size={iconSize} color={Colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: Colors.cardElevated,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
