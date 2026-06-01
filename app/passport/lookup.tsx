import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { FeatureFormField } from "@/components/FeatureFormField";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { lookupSerial } from "@/services/passport";
import { createFeatureScreenStyles } from "@/styles/featureScreen";

export default function SerialLookupScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [serial, setSerial] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof lookupSerial>> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!serial.trim()) return;
    setLoading(true);
    try {
      setResult(await lookupSerial(serial.trim()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureScreenScaffold>
      <ScreenHeader title="Serial Lookup" subtitle="Check Crownly registry" />

      <View style={styles.formCard}>
        <FeatureFormField
          label="Serial number"
          value={serial}
          onChangeText={setSerial}
          placeholder="Enter serial number"
          autoCapitalize="characters"
        />
        <LuxuryButton label={loading ? "Looking up…" : "Lookup"} onPress={handleLookup} disabled={loading} />
      </View>

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{result.serial_number}</Text>
          <Text style={styles.rowBody}>
            {result.found
              ? `${result.listings_count} listing${result.listings_count === 1 ? "" : "s"} on record`
              : "No Crownly history found"}
          </Text>
          {result.flagged ? (
            <Text style={styles.errorText}>Flagged in registry — proceed with caution</Text>
          ) : null}
          {result.passport_code ? (
            <LuxuryButton
              label={`View passport ${result.passport_code}`}
              variant="outline"
              onPress={() => router.push(`/passport/${result.passport_code}`)}
            />
          ) : null}
        </View>
      ) : null}
    </FeatureScreenScaffold>
  );
}
