import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { SPACING, RADIUS, STORY_GUTTER } from "@/constants/layout";
import type { StoryBlock } from "@/types";

const PARAGRAPH_INDENT = "\u2003\u2003";

type Props = {
  blocks: StoryBlock[];
};

function StoryParagraph({ text }: { text: string }) {
  return (
    <View style={styles.paragraphWrap}>
      <Text style={styles.paragraph}>
        {PARAGRAPH_INDENT}
        {text}
      </Text>
    </View>
  );
}

export function StoryArticleBody({ blocks }: Props) {
  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <Text
                key={i}
                style={block.level === 2 ? styles.h2 : styles.h3}
              >
                {block.text}
              </Text>
            );
          case "pull_quote":
            return (
              <View key={i} style={styles.quote}>
                <View style={styles.quoteBar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quoteText}>"{block.text}"</Text>
                  {block.attribution ? (
                    <Text style={styles.quoteAttr}>— {block.attribution}</Text>
                  ) : null}
                </View>
              </View>
            );
          case "image":
            return (
              <View key={i} style={styles.imageWrap}>
                <Image source={{ uri: block.url }} style={styles.image} contentFit="cover" />
                {block.caption ? <Text style={styles.caption}>{block.caption}</Text> : null}
              </View>
            );
          default:
            return <StoryParagraph key={i} text={block.text} />;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: STORY_GUTTER,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  paragraphWrap: {
    marginBottom: SPACING.xl,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 28,
  },
  h2: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  h3: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  quote: {
    flexDirection: "row",
    marginVertical: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: Colors.goldMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  quoteBar: {
    width: 3,
    backgroundColor: Colors.gold,
    marginRight: SPACING.md,
    borderRadius: 2,
  },
  quoteText: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.textPrimary,
    fontStyle: "italic",
    lineHeight: 28,
  },
  quoteAttr: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 8,
  },
  imageWrap: {
    marginVertical: SPACING.lg,
    marginHorizontal: -STORY_GUTTER,
  },
  image: { width: "100%", aspectRatio: 16 / 10 },
  caption: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
});
