import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { FeatureFormField } from "@/components/FeatureFormField";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  deleteSavedSearch,
  getSavedSearches,
  saveSearch,
  toggleSearchAlert,
} from "@/services/savedSearches";
import { createFeatureScreenStyles } from "@/styles/featureScreen";

export default function AlertsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const { brand: brandParam, ref: refParam } = useLocalSearchParams<{
    brand?: string;
    ref?: string;
  }>();
  const [searches, setSearches] = useState<Awaited<ReturnType<typeof getSavedSearches>>>([]);
  const [brand, setBrand] = useState(brandParam ?? "");
  const [ref, setRef] = useState(refParam ?? "");

  const load = useCallback(async () => {
    if (!user) return;
    setSearches(await getSavedSearches(user.id));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!user) {
      router.push("/auth/welcome");
      return;
    }
    await saveSearch(user.id, {
      brand: brand.trim() || undefined,
      reference_number: ref.trim() || undefined,
    });
    setBrand("");
    setRef("");
    void load();
    Alert.alert("Saved", "You'll be notified when AI-verified listings match.");
  };

  return (
    <FeatureScreenScaffold
      title="Saved Searches"
      subtitle="Alerts for AI-verified listings only"
    >
      <View style={styles.formCard}>
        <FeatureFormField label="Brand" value={brand} onChangeText={setBrand} placeholder="Rolex" />
        <FeatureFormField
          label="Reference number"
          value={ref}
          onChangeText={setRef}
          placeholder="126610LN"
        />
        <LuxuryButton label="Save search & enable alerts" onPress={handleSave} />
      </View>

      <Text style={styles.sectionTitle}>Your alerts</Text>

      {searches.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No alerts yet"
          body="Save a brand or reference to get notified when verified listings appear."
        />
      ) : (
        searches.map((s) => (
          <View key={s.id} style={styles.listRow}>
            <View style={styles.iconTile}>
              <Ionicons
                name={s.alert_enabled ? "notifications" : "notifications-off-outline"}
                size={22}
                color={Colors.textPrimary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{s.name ?? s.brand ?? "Search"}</Text>
              {s.reference_number ? (
                <Text style={styles.rowSub}>Ref. {s.reference_number}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => user && toggleSearchAlert(user.id, s.id, !s.alert_enabled).then(load)}
              hitSlop={8}
            >
              <Ionicons
                name={s.alert_enabled ? "volume-high-outline" : "volume-mute-outline"}
                size={20}
                color={Colors.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => user && deleteSavedSearch(user.id, s.id).then(load)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>
        ))
      )}
    </FeatureScreenScaffold>
  );
}
