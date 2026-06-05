import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { LuxuryButton } from "@/components/LuxuryButton";
import { TrustScoreIndicator } from "@/components/TrustScoreIndicator";
import { VerificationStatusBanner } from "@/components/VerificationStatusBanner";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING } from "@/constants/layout";
import { notifyContentRefresh } from "@/lib/contentRefresh";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { analyzeListing, registerVerificationAsset } from "@/services/trust";
import { uploadTrustAsset } from "@/services/trustUpload";
import { createFeatureScreenStyles } from "@/styles/featureScreen";
import type { VerificationAssetType } from "@/types/trust";

const ASSETS: { type: VerificationAssetType; label: string; hint: string; video?: boolean }[] = [
  { type: "serial", label: "Serial number", hint: "Macro photo of caseback serial" },
  { type: "front", label: "Watch front", hint: "Full dial, well lit" },
  { type: "movement", label: "Movement / caseback", hint: "Open caseback or rotor view" },
  { type: "box_papers", label: "Box & papers", hint: "Warranty card and packaging" },
  { type: "video", label: "Rotating video", hint: "Timestamped 360° rotation", video: true },
];

export default function TrustVerifyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createFeatureScreenStyles);
  const [uris, setUris] = useState<Partial<Record<VerificationAssetType, string>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    trustScore: number;
    authenticationStatus: string;
  } | null>(null);

  const pickAsset = useCallback(async (type: VerificationAssetType, video?: boolean) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload verification media.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: video ? ["videos"] : ["images"],
      quality: 0.9,
    });
    if (!picked.canceled && picked.assets[0]?.uri) {
      setUris((prev) => ({ ...prev, [type]: picked.assets[0].uri }));
    }
  }, []);

  const handleSubmit = async () => {
    if (!id) return;
    const missing = ASSETS.filter((a) => !uris[a.type]);
    if (missing.length) {
      Alert.alert("Incomplete", `Add: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      for (const asset of ASSETS) {
        const uri = uris[asset.type]!;
        const mime = asset.video ? "video/mp4" : "image/jpeg";
        const path = await uploadTrustAsset(id, asset.type, uri, mime);
        await registerVerificationAsset(id, asset.type, path, mime);
      }

      const analysis = await analyzeListing(id);
      setResult({
        trustScore: analysis.trustScore,
        authenticationStatus: analysis.authenticationStatus,
      });
      notifyContentRefresh();

      if (analysis.authenticationStatus === "auto_verified") {
        Alert.alert("Verified", "Your listing is live with AI authentication.", [
          { text: "OK", onPress: () => router.replace("/(tabs)") },
        ]);
      } else if (analysis.authenticationStatus === "manual_review") {
        Alert.alert(
          "Under review",
          "Our team will review your listing shortly. You'll be notified when it's live."
        );
      } else {
        Alert.alert("Not approved", "Verification failed. Check your media and try again.");
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FeatureScreenScaffold
        title="AI Authentication"
        subtitle="Upload serial, movement, papers, and a rotating video for automated verification."
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {result ? (
          <View style={{ marginBottom: 8 }}>
            <VerificationStatusBanner
              status={result.authenticationStatus as "auto_verified"}
              trustScore={result.trustScore}
            />
            <TrustScoreIndicator score={result.trustScore} />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Verification media</Text>
        {ASSETS.map((asset) => (
          <Pressable
            key={asset.type}
            style={styles.listRow}
            onPress={() => pickAsset(asset.type, asset.video)}
          >
            {uris[asset.type] ? (
              <Image
                source={{ uri: uris[asset.type] }}
                style={{ width: 48, height: 48, borderRadius: RADIUS.sm }}
                contentFit="cover"
              />
            ) : (
              <View style={styles.iconTile}>
                <Ionicons name="cloud-upload-outline" size={22} color={Colors.textPrimary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{asset.label}</Text>
              <Text style={styles.rowSub}>{asset.hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Pressable>
        ))}
      </FeatureScreenScaffold>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: SPACING.screen,
          paddingBottom: insets.bottom + 16,
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <LuxuryButton
          label={loading ? "Publishing…" : "Run AI verification"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </View>
    </View>
  );
}
