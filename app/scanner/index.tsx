import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { consumePendingScanResult } from "@/lib/scannerSession";
import { Ionicons } from "@expo/vector-icons";
import { FeatureFormField } from "@/components/FeatureFormField";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { HorizontalListingScroll } from "@/components/HorizontalListingScroll";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionHeader } from "@/components/SectionHeader";
import { WatchScannerCameraModal } from "@/components/WatchScannerCameraModal";
import { Colors } from "@/constants/colors";
import { formatPrice } from "@/lib/stripe";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { scanWatchFromImage, scanWatchFromText } from "@/services/scanner";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { WatchScanResult } from "@/types";

export default function ScannerScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<WatchScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    const pending = consumePendingScanResult();
    if (pending) setResult(pending);
  }, []);

  const runTextScan = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      setResult(await scanWatchFromText(query.trim()));
    } finally {
      setLoading(false);
    }
  };

  const runPhotoScan = async (uri: string) => {
    setCameraOpen(false);
    setLoading(true);
    try {
      setResult(await scanWatchFromImage(uri));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FeatureScreenScaffold
        title="Watch Scanner"
        subtitle="Identify watches and browse Crownly verified listings"
      >
        <Pressable style={styles.dashedAction} onPress={() => router.push("/scanner/camera")}>
          <View style={styles.iconTile}>
            <Ionicons name="camera-outline" size={26} color={Colors.textPrimary} />
          </View>
          <Text style={styles.rowTitle}>Scan with camera</Text>
          <Text style={styles.rowSub}>Point at dial or case for identification</Text>
        </Pressable>

        <Text style={styles.orDivider}>or search by name / reference</Text>

        <View style={styles.formCard}>
          <FeatureFormField
            label="Watch"
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. Rolex Submariner 126610LN"
          />
          <LuxuryButton
            label={loading ? "Scanning…" : "Identify watch"}
            onPress={runTextScan}
            disabled={loading}
            variant="outline"
          />
        </View>

        {result ? (
          <View style={styles.resultCard}>
            {result.brand || result.model ? (
              <>
                <Text style={styles.resultTitle}>
                  {result.brand ?? "Unknown"} {result.model ?? ""}
                </Text>
                {result.reference_number ? (
                  <Text style={styles.rowSub}>Ref. {result.reference_number}</Text>
                ) : null}
                <Text style={styles.rowBody}>
                  Confidence {Math.round(result.confidence * 100)}% ·{" "}
                  {result.verified_listings_count} verified listing
                  {result.verified_listings_count === 1 ? "" : "s"}
                </Text>
                {result.estimated_value_min != null ? (
                  <Text style={[styles.rowTitle, { marginTop: 8 }]}>
                    {formatPrice(result.estimated_value_min)}
                    {result.estimated_value_max !== result.estimated_value_min
                      ? ` – ${formatPrice(result.estimated_value_max!)}`
                      : ""}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.resultTitle}>Could not identify watch</Text>
                <Text style={styles.rowBody}>
                  Photo recognition is not available yet. Search by brand or reference below instead.
                </Text>
              </>
            )}

            {result.active_listings.length > 0 ? (
              <>
                <SectionHeader title="Available now" compact topSpacing={16} />
                <HorizontalListingScroll listings={result.active_listings} />
              </>
            ) : null}

            <View style={{ gap: 10, marginTop: 16 }}>
              <LuxuryButton
                label="Create price alert"
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: "/alerts",
                    params: { ref: result.reference_number ?? "", brand: result.brand ?? "" },
                  })
                }
              />
              <LuxuryButton
                label="Add to collection"
                variant="ghost"
                onPress={() => router.push("/collection/add")}
              />
            </View>
          </View>
        ) : null}
      </FeatureScreenScaffold>

      <WatchScannerCameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={runPhotoScan}
        loading={loading}
      />
    </>
  );
}
