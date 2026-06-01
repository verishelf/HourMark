import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { FeatureFormField } from "@/components/FeatureFormField";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { GrailRequestCard } from "@/components/GrailRequestCard";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  cancelGrailRequest,
  createGrailRequest,
  getGrailRequests,
  getUserGrailRequests,
} from "@/services/grails";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { GrailRequest } from "@/types";

export default function GrailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [mine, setMine] = useState<GrailRequest[]>([]);
  const [community, setCommunity] = useState<GrailRequest[]>([]);
  const [brand, setBrand] = useState("");
  const [ref, setRef] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setCommunity(await getGrailRequests("active"));
    if (user) setMine(await getUserGrailRequests(user.id));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!user) {
      router.push("/auth/welcome");
      return;
    }
    const cents = budget
      ? Math.round(parseFloat(budget.replace(/[^0-9.]/g, "")) * 100)
      : undefined;
    await createGrailRequest(user.id, {
      brand: brand.trim() || undefined,
      reference_number: ref.trim() || undefined,
      max_budget: cents,
      notes: notes.trim() || undefined,
    });
    setBrand("");
    setRef("");
    setBudget("");
    setNotes("");
    void load();
    Alert.alert("Grail posted", "Sellers will be notified when matching listings appear.");
  };

  const communityFiltered = community.filter((g) => g.user_id !== user?.id).slice(0, 20);

  return (
    <FeatureScreenScaffold>
      <ScreenHeader title="Grail Board" subtitle="Post what you're hunting for" />

      <View style={styles.formCard}>
        <FeatureFormField label="Brand" value={brand} onChangeText={setBrand} placeholder="Rolex" />
        <FeatureFormField label="Reference" value={ref} onChangeText={setRef} placeholder="126610LN" />
        <FeatureFormField
          label="Max budget (USD)"
          value={budget}
          onChangeText={setBudget}
          placeholder="15000"
          keyboardType="decimal-pad"
        />
        <FeatureFormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Dial color, box & papers, etc."
          multiline
        />
        <LuxuryButton label="Post grail hunt" onPress={handleCreate} />
      </View>

      {mine.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Your hunts</Text>
          {mine.map((g) => (
            <GrailRequestCard
              key={g.id}
              grail={g}
              onCancel={
                g.status === "active" && user
                  ? () => cancelGrailRequest(user.id, g.id).then(load)
                  : undefined
              }
            />
          ))}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Community hunts</Text>
      {communityFiltered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No active hunts"
          body="Be the first to post what you're looking for."
        />
      ) : (
        communityFiltered.map((g) => <GrailRequestCard key={g.id} grail={g} />)
      )}
    </FeatureScreenScaffold>
  );
}
