import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable } from "react-native";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { SPACING, RADIUS } from "@/constants/layout";
import type { CelebrityProfile, CollectorProfile, WatchCollectionItem, StoryCard } from "@/types";

type Props = {
  profile: CelebrityProfile | CollectorProfile;
  featuredStories?: StoryCard[];
};

function isCelebrityProfile(
  profile: CelebrityProfile | CollectorProfile
): profile is CelebrityProfile {
  return "name" in profile;
}

export function ProfileSections({ profile, featuredStories = [] }: Props) {
  const router = useRouter();
  const name = isCelebrityProfile(profile) ? profile.name : profile.user?.full_name ?? "Collector";
  const avatar = isCelebrityProfile(profile) ? profile.avatar_url : profile.user?.avatar_url;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: Colors.border }]} />
        )}
        <Text style={styles.name}>{name}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {isCelebrityProfile(profile) && profile.favorite_quote ? (
          <View style={styles.quoteBox}>
            <Text style={styles.quote}>"{profile.favorite_quote}"</Text>
          </View>
        ) : null}
      </View>

      {profile.watch_collection?.length > 0 ? (
        <Section title="Watch Collection">
          {(profile.watch_collection as WatchCollectionItem[]).map((w, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.itemTitle}>{w.brand} {w.model}</Text>
              {w.notes ? <Text style={styles.itemSub}>{w.notes}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {profile.business_ventures?.length > 0 ? (
        <Section title="Business Ventures">
          {profile.business_ventures.map((v, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.itemTitle}>{v.name}</Text>
              {v.description ? <Text style={styles.itemSub}>{v.description}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {isCelebrityProfile(profile) && profile.career_highlights?.length > 0 ? (
        <Section title="Career Highlights">
          {profile.career_highlights.map((h, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.itemTitle}>{h.title}{h.year ? ` (${h.year})` : ""}</Text>
              {h.description ? <Text style={styles.itemSub}>{h.description}</Text> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {isCelebrityProfile(profile) && profile.networking_lessons ? (
        <Section title="Networking Lessons">
          <Text style={styles.bodyText}>{profile.networking_lessons}</Text>
        </Section>
      ) : null}

      {featuredStories.length > 0 ? (
        <Section title="Featured Stories">
          {featuredStories.map((s) => (
            <Pressable key={s.id} onPress={() => router.push(`/stories/${s.slug}`)} style={styles.storyRow}>
              <Image source={{ uri: s.hero_image_url }} style={styles.storyThumb} contentFit="cover" />
              <Text style={styles.itemTitle} numberOfLines={2}>{s.title}</Text>
            </Pressable>
          ))}
        </Section>
      ) : null}

      {isCelebrityProfile(profile) && profile.source_urls?.length > 0 ? (
        <Section title="Sources">
          {profile.source_urls.map((url, i) => (
            <Text key={i} style={styles.source}>{url}</Text>
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} compact style={{ marginBottom: 12 }} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", padding: SPACING.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: SPACING.md, borderWidth: 2, borderColor: Colors.gold },
  name: { ...Typography.h1, color: Colors.textPrimary, textAlign: "center" },
  bio: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", marginTop: SPACING.sm, lineHeight: 22 },
  quoteBox: { marginTop: SPACING.lg, padding: SPACING.md, backgroundColor: Colors.goldMuted, borderRadius: RADIUS.md, width: "100%" },
  quote: { ...Typography.h3, fontStyle: "italic", color: Colors.textPrimary, textAlign: "center" },
  section: { paddingHorizontal: SPACING.screen, marginTop: SPACING.lg },
  listItem: { paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemTitle: { ...Typography.body, color: Colors.textPrimary, fontWeight: "500" },
  itemSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  bodyText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },
  storyRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.sm },
  storyThumb: { width: 64, height: 64, borderRadius: RADIUS.sm },
  source: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
});
