import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { HorizontalListingScroll } from "@/components/HorizontalListingScroll";
import { PostGrid } from "@/components/PostGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getListingsByReference, getPostsByReference } from "@/services/grails";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { Listing, UserPost } from "@/types";

export default function ReferenceFeedScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [listings, setListings] = useState<Listing[]>([]);
  const [posts, setPosts] = useState<UserPost[]>([]);

  useEffect(() => {
    if (!ref) return;
    getListingsByReference(ref).then(setListings);
    getPostsByReference(ref).then((rows) => setPosts(rows as UserPost[]));
  }, [ref]);

  return (
    <FeatureScreenScaffold
      title={`Ref. ${ref ?? ""}`}
      subtitle="Listings and community posts"
    >
      {listings.length > 0 ? (
        <>
          <SectionHeader title="Verified listings" compact topSpacing={8} />
          <HorizontalListingScroll listings={listings} />
        </>
      ) : (
        <EmptyState
          icon="watch-outline"
          title="No listings yet"
          body="No verified listings for this reference on Crownly."
        />
      )}

      {posts.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Community</Text>
          <PostGrid posts={posts} />
        </>
      ) : null}
    </FeatureScreenScaffold>
  );
}
