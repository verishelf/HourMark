import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type Props = {
  title: string;
  subtitle: string;
  backgroundImage: string;
  onSignIn: () => void;
  onSignUp: () => void;
};

export function LoggedOutGate({
  title,
  subtitle,
  backgroundImage,
  onSignIn,
  onSignUp,
}: Props) {
  return (
    <View style={styles.screen}>
      <Image source={{ uri: backgroundImage }} style={styles.background} contentFit="cover" />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.buttons}>
          <LuxuryButton label="Sign In" onPress={onSignIn} variant="primary" size="large" />
          <View style={styles.gap} />
          <LuxuryButton label="Create Account" onPress={onSignUp} variant="outline" size="large" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.screen,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontSize: 42,
    lineHeight: 46,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 26,
  },
  buttons: {
    width: "100%",
    maxWidth: 340,
  },
  gap: {
    height: 12,
  },
});
