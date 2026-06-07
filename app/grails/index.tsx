import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { FeatureFormField } from "@/components/FeatureFormField";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { GrailRequestCard } from "@/components/GrailRequestCard";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LUXURY_BRANDS } from "@/constants/brands";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  createGrailRequest,
  deleteGrailRequest,
  getGrailRequests,
  getUserGrailRequests,
  updateGrailRequest,
} from "@/services/grails";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { GrailRequest } from "@/types";

type Tab = "community" | "mine";

export default function GrailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const localStyles = useThemedStyles(createGrailsLocalStyles);

  const [mine, setMine] = useState<GrailRequest[]>([]);
  const [community, setCommunity] = useState<GrailRequest[]>([]);
  const [tab, setTab] = useState<Tab>("community");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [ref, setRef] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setBrand("");
    setModel("");
    setRef("");
    setBudget("");
    setNotes("");
    setEditingId(null);
  }, []);

  const load = useCallback(async () => {
    setCommunity(await getGrailRequests("active"));
    if (user) setMine(await getUserGrailRequests(user.id));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const myActive = useMemo(() => mine.filter((g) => g.status === "active"), [mine]);
  const communityFiltered = useMemo(
    () => community.filter((g) => g.user_id !== user?.id),
    [community, user?.id]
  );

  const parseBudgetCents = () => {
    if (!budget.trim()) return undefined;
    return Math.round(parseFloat(budget.replace(/[^0-9.]/g, "")) * 100);
  };

  const buildGrailInput = () => ({
    brand: brand.trim() || undefined,
    model: model.trim() || undefined,
    reference_number: ref.trim() || undefined,
    max_budget: parseBudgetCents(),
    notes: notes.trim() || undefined,
  });

  const handleSubmit = async () => {
    if (!user) {
      router.push("/auth/welcome");
      return;
    }
    if (!brand.trim() && !model.trim() && !ref.trim()) {
      Alert.alert("Add details", "Enter at least a brand, model, or reference number.");
      return;
    }

    setPosting(true);
    try {
      if (editingId) {
        await updateGrailRequest(user.id, editingId, buildGrailInput());
        resetForm();
        void load();
        Alert.alert("Grail updated", "Your hunt has been saved.");
      } else {
        await createGrailRequest(user.id, buildGrailInput());
        resetForm();
        void load();
        setTab("mine");
        Alert.alert("Grail posted", "Sellers will be notified when matching listings appear.");
      }
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : editingId ? "Could not update grail hunt" : "Could not post grail hunt"
      );
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (grail: GrailRequest) => {
    setEditingId(grail.id);
    setBrand(grail.brand ?? "");
    setModel(grail.model ?? "");
    setRef(grail.reference_number ?? "");
    setBudget(grail.max_budget != null ? String(grail.max_budget / 100) : "");
    setNotes(grail.notes ?? "");
    setTab("mine");
  };

  const handleDelete = (grailId: string) => {
    if (!user) return;
    Alert.alert("Delete hunt", "Permanently remove this grail hunt?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGrailRequest(user.id, grailId);
            if (editingId === grailId) resetForm();
            void load();
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not delete grail hunt");
          }
        },
      },
    ]);
  };

  const isOwnerActive = (grail: GrailRequest) =>
    Boolean(user && grail.user_id === user.id && grail.status === "active");

  const visibleHunts = tab === "mine" ? myActive : communityFiltered.slice(0, 30);
  const submitLabel = posting
    ? editingId
      ? "Saving…"
      : "Posting…"
    : editingId
      ? "Save changes"
      : "Post grail hunt";

  return (
    <FeatureScreenScaffold title="Grail Board" subtitle="Post what you're hunting for">
      <View style={styles.statRow}>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Community</Text>
          <Text style={styles.statValue}>{communityFiltered.length}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statLabel}>Your hunts</Text>
          <Text style={styles.statValue}>{myActive.length}</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={localStyles.formHeading}>{editingId ? "Edit hunt" : "Post a hunt"}</Text>
        <Text style={styles.label}>Popular brands</Text>
        <ScrollView
          horizontal
          {...HIDE_SCROLL_INDICATORS}
          style={localStyles.chipScroll}
          contentContainerStyle={localStyles.chipRow}
        >
          {LUXURY_BRANDS.slice(0, 8).map((b) => (
            <Pressable
              key={b}
              onPress={() => setBrand(b)}
              style={[localStyles.chip, brand === b && localStyles.chipActive]}
            >
              <Text style={[localStyles.chipText, brand === b && localStyles.chipTextActive]}>
                {b}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <FeatureFormField label="Brand" value={brand} onChangeText={setBrand} placeholder="Rolex" />
        <FeatureFormField
          label="Model"
          value={model}
          onChangeText={setModel}
          placeholder="Submariner Date"
        />
        <FeatureFormField
          label="Reference"
          value={ref}
          onChangeText={setRef}
          placeholder="126610LN"
          autoCapitalize="characters"
        />
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
        <LuxuryButton label={submitLabel} onPress={handleSubmit} loading={posting} />
        {editingId ? (
          <Pressable onPress={resetForm} style={localStyles.cancelEditBtn} hitSlop={8}>
            <Text style={localStyles.cancelEditText}>Cancel editing</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={localStyles.tabRow}>
        {(
          [
            { id: "community" as const, label: "Community", count: communityFiltered.length },
            { id: "mine" as const, label: "Your hunts", count: myActive.length },
          ] as const
        ).map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[localStyles.tab, active && localStyles.tabActive]}
            >
              <Text style={[localStyles.tabText, active && localStyles.tabTextActive]}>
                {item.label}
              </Text>
              <View style={[localStyles.tabBadge, active && localStyles.tabBadgeActive]}>
                <Text style={[localStyles.tabBadgeText, active && localStyles.tabBadgeTextActive]}>
                  {item.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {visibleHunts.length === 0 ? (
        <EmptyState
          compact
          icon="search-outline"
          title={tab === "mine" ? "No active hunts" : "No community hunts yet"}
          body={
            tab === "mine"
              ? "Post what you're looking for and we'll alert you when a match appears."
              : "Be the first to post a grail hunt collectors are searching for."
          }
        />
      ) : (
        visibleHunts.map((g) => (
          <GrailRequestCard
            key={g.id}
            grail={g}
            onEdit={isOwnerActive(g) ? () => startEdit(g) : undefined}
            onDelete={isOwnerActive(g) ? () => handleDelete(g.id) : undefined}
          />
        ))
      )}
    </FeatureScreenScaffold>
  );
}

function createGrailsLocalStyles() {
  return StyleSheet.create({
    formHeading: {
      ...Typography.label,
      color: Colors.textMuted,
      marginBottom: 14,
      letterSpacing: 0.6,
    },
    chipScroll: {
      marginBottom: 14,
    },
    chipRow: {
      flexDirection: "row",
      paddingRight: 8,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.pill,
      flexShrink: 0,
    },
    chipActive: {
      borderColor: Colors.textPrimary,
      backgroundColor: Colors.cardElevated,
    },
    chipText: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontSize: 12,
    },
    chipTextActive: {
      color: Colors.textPrimary,
      fontWeight: "600",
    },
    tabRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      backgroundColor: Colors.card,
    },
    tabActive: {
      backgroundColor: Colors.cardElevated,
      borderColor: Colors.borderLight,
    },
    tabText: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontWeight: "600",
      fontSize: 12,
    },
    tabTextActive: {
      color: Colors.textPrimary,
    },
    tabBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    tabBadgeActive: {
      backgroundColor: Colors.textPrimary,
      borderColor: Colors.textPrimary,
    },
    tabBadgeText: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 11,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    tabBadgeTextActive: {
      color: Colors.background,
    },
    cancelEditBtn: {
      alignItems: "center",
      marginTop: 12,
      paddingVertical: 4,
    },
    cancelEditText: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 12,
      fontWeight: "500",
    },
  });
}
