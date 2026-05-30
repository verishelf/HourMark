import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LuxuryButton } from "@/components/LuxuryButton";
import { TrustScoreIndicator } from "@/components/TrustScoreIndicator";
import { VerificationStatusBanner } from "@/components/VerificationStatusBanner";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { notifyContentRefresh } from "@/lib/contentRefresh";
import { analyzeListing, registerVerificationAsset } from "@/services/trust";
import { uploadTrustAsset } from "@/services/trustUpload";
import type { VerificationAssetType } from "@/types/trust";

const ASSETS: { type: VerificationAssetType; label: string; video?: boolean }[] = [
  { type: "serial", label: "Serial number (macro)" },
  { type: "front", label: "Watch front" },
  { type: "movement", label: "Movement / caseback" },
  { type: "box_papers", label: "Box & papers" },
  { type: "video", label: "Timestamped rotating video", video: true },
];

export default function TrustVerifyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          padding: SPACING.screen,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text style={{ ...Typography.h2, color: Colors.textPrimary, marginTop: 16 }}>
          AI Authentication
        </Text>
        <Text style={{ ...Typography.body, color: Colors.textMuted, marginTop: 8 }}>
          Upload serial, movement, papers, and a rotating video for automated verification.
        </Text>

        {result && (
          <View style={{ marginTop: 20 }}>
            <VerificationStatusBanner
              status={result.authenticationStatus as "auto_verified"}
              trustScore={result.trustScore}
            />
            <TrustScoreIndicator score={result.trustScore} />
          </View>
        )}

        <View style={{ marginTop: 24, gap: 16 }}>
          {ASSETS.map((asset) => (
            <Pressable
              key={asset.type}
              onPress={() => pickAsset(asset.type, asset.video)}
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              {uris[asset.type] ? (
                <Image
                  source={{ uri: uris[asset.type] }}
                  style={{ width: 48, height: 48 }}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="cloud-upload-outline" size={28} color={Colors.textMuted} />
              )}
              <Text style={{ ...Typography.body, color: Colors.textPrimary, flex: 1 }}>
                {asset.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

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
          label={loading ? "Analyzing…" : "Run AI verification"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </View>
    </View>
  );
}
