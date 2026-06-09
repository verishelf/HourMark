import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { RADIUS, SPACING, STORY_GUTTER } from "@/constants/layout";

type Props = {
  imageUrl: string;
  title: string;
  subtitle?: string | null;
  category?: string;
  readTime?: number;
};

export function StoryHero({ imageUrl, title, subtitle, category, readTime }: Props) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.overlay}>
        {category ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{category}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {readTime ? <Text style={styles.meta}>{readTime} min read</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 4 / 5,
    maxHeight: 480,
    backgroundColor: Colors.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: STORY_GUTTER,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.goldMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  tagText: { ...Typography.label, fontSize: 10, color: Colors.gold },
  title: { ...Typography.hero, fontSize: 28, color: "#FFF", marginBottom: 8 },
  subtitle: { ...Typography.body, color: "rgba(255,255,255,0.8)", marginBottom: 8, lineHeight: 22 },
  meta: { ...Typography.caption, color: "rgba(255,255,255,0.6)" },
});
