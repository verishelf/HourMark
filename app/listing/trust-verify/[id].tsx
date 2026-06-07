import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { BlurredWatchBackground } from "@/components/BlurredWatchBackground";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { LuxuryButton } from "@/components/LuxuryButton";
import { TrustScoreIndicator } from "@/components/TrustScoreIndicator";
import { VerificationStatusBanner } from "@/components/VerificationStatusBanner";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { notifyContentRefresh } from "@/lib/contentRefresh";
import { ensurePhotoLibraryPermission, pickFromPhotoLibrary } from "@/lib/imagePicker";
import { analyzeListing, registerVerificationAsset } from "@/services/trust";
import { uploadTrustAsset } from "@/services/trustUpload";
import type { VerificationAssetType } from "@/types/trust";

type AssetConfig = {
  type: VerificationAssetType;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  video?: boolean;
};

const ASSETS: AssetConfig[] = [
  {
    type: "front",
    label: "Dial & case front",
    hint: "Full watch face, sharp and well lit",
    icon: "eye-outline",
  },
  {
    type: "serial",
    label: "Serial number",
    hint: "Macro of engraved caseback serial",
    icon: "barcode-outline",
  },
  {
    type: "movement",
    label: "Movement",
    hint: "Open caseback or rotor detail",
    icon: "settings-outline",
  },
  {
    type: "box_papers",
    label: "Box & papers",
    hint: "Warranty card, tags, and packaging",
    icon: "cube-outline",
  },
  {
    type: "video",
    label: "360° rotation video",
    hint: "Slow spin showing dial, case, and serial",
    icon: "videocam-outline",
    video: true,
  },
];

const STEPS = ["Upload", "Verify"] as const;
type Step = (typeof STEPS)[number];
const FOOTER_HEIGHT = 132;
const TILE_WIDTH = 248;
const GLASS_TEXT = "#FFFFFF";
const GLASS_MUTED = "rgba(255,255,255,0.65)";

function createGlassSurface(colorScheme: "light" | "dark"): ViewStyle {
  return {
    backgroundColor:
      colorScheme === "light" ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.12)",
    borderColor:
      colorScheme === "light" ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.28)",
  };
}

function createGlassInset(colorScheme: "light" | "dark"): ViewStyle {
  return {
    backgroundColor:
      colorScheme === "light" ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.06)",
    borderColor:
      colorScheme === "light" ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.32)",
  };
}

function StepProgress({
  current,
  styles,
}: {
  current: Step;
  styles: ReturnType<typeof createTrustVerifyStyles>;
}) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <View style={styles.progressRow}>
      {STEPS.map((step, i) => (
        <View key={step} style={styles.progressStep}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: i <= currentIndex ? Colors.textPrimary : Colors.border },
            ]}
          />
          <Text
            style={[
              styles.progressStepLabel,
              { color: i <= currentIndex ? GLASS_TEXT : GLASS_MUTED },
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FormSection({
  title,
  children,
  styles,
  surfaceStyle,
  titleStyle,
}: {
  title: string;
  children: ReactNode;
  styles: ReturnType<typeof createTrustVerifyStyles>;
  surfaceStyle?: ViewStyle;
  titleStyle?: object;
}) {
  return (
    <View style={[styles.section, surfaceStyle]}>
      <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text>
      {children}
    </View>
  );
}

function UploadTile({
  asset,
  uri,
  onPress,
  styles,
  glassInset,
}: {
  asset: AssetConfig;
  uri?: string;
  onPress: () => void;
  styles: ReturnType<typeof createTrustVerifyStyles>;
  glassInset: ViewStyle;
}) {
  const complete = Boolean(uri);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        glassInset,
        { width: TILE_WIDTH },
        complete && styles.tileComplete,
        pressed && styles.tilePressed,
      ]}
    >
      <View style={styles.tileHeader}>
        <View style={[styles.stepBadge, glassInset, complete && styles.stepBadgeComplete]}>
          {complete ? (
            <Ionicons name="checkmark" size={12} color={Colors.background} />
          ) : (
            <Ionicons name={asset.icon} size={14} color={GLASS_TEXT} />
          )}
        </View>
        {complete ? (
          <View style={[styles.addedPill, glassInset]}>
            <Text style={styles.addedPillText}>Added</Text>
          </View>
        ) : (
          <Ionicons name="add-circle-outline" size={18} color={GLASS_MUTED} />
        )}
      </View>

      {uri && !asset.video ? (
        <Image source={{ uri }} style={styles.tilePreview} contentFit="cover" />
      ) : uri && asset.video ? (
        <View style={[styles.videoPreview, glassInset]}>
          <Ionicons name="play-circle" size={36} color={GLASS_TEXT} />
          <Text style={styles.videoPreviewText}>Video ready</Text>
        </View>
      ) : (
        <View style={[styles.tilePlaceholder, glassInset]}>
          <Ionicons name={asset.icon} size={28} color={GLASS_MUTED} />
          <Text style={styles.tapToUpload}>Tap to upload</Text>
        </View>
      )}

      <Text style={styles.tileLabel} numberOfLines={2}>
        {asset.label}
      </Text>
      <Text style={styles.tileHint} numberOfLines={2}>
        {asset.hint}
      </Text>
    </Pressable>
  );
}

export default function TrustVerifyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createTrustVerifyStyles);
  const glassSurface = useMemo(() => createGlassSurface(colorScheme), [colorScheme]);
  const glassInset = useMemo(() => createGlassInset(colorScheme), [colorScheme]);

  const [uris, setUris] = useState<Partial<Record<VerificationAssetType, string>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    trustScore: number;
    authenticationStatus: string;
  } | null>(null);

  const uploadedCount = ASSETS.filter((asset) => Boolean(uris[asset.type])).length;
  const progress = uploadedCount / ASSETS.length;
  const allComplete = uploadedCount === ASSETS.length;
  const step: Step = allComplete ? "Verify" : "Upload";

  const pickAsset = useCallback(async (type: VerificationAssetType, video?: boolean) => {
    const allowed = await ensurePhotoLibraryPermission(
      "Allow photo access to upload verification media."
    );
    if (!allowed) return;

    const asset = await pickFromPhotoLibrary({ video, quality: 0.9 });
    if (asset?.uri) {
      setUris((prev) => ({ ...prev, [type]: asset.uri }));
    }
  }, []);

  const handleSubmit = async () => {
    if (!id) return;
    const missing = ASSETS.filter((asset) => !uris[asset.type]);
    if (missing.length) {
      Alert.alert("Incomplete", `Add: ${missing.map((item) => item.label).join(", ")}`);
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

  const footerLabel = useMemo(() => {
    if (loading) return "Running AI verification…";
    if (!allComplete) return `Add ${ASSETS.length - uploadedCount} more to continue`;
    return "Run AI verification";
  }, [allComplete, loading, uploadedCount]);

  const footerInset = insets.bottom + 16;

  return (
    <BlurredWatchBackground imageUri={LOGGED_OUT_GATE_IMAGES.sell}>
      <View style={styles.screen}>
        <ScrollView
          {...HIDE_SCROLL_INDICATORS}
          contentContainerStyle={{
            paddingHorizontal: SPACING.screen,
            paddingTop: insets.top + 16,
            paddingBottom: footerInset + FOOTER_HEIGHT + 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
          </View>

          <Text style={styles.pageTitle}>AI Authentication</Text>
          <Text style={styles.pageSubtitle}>Secure your listing with provenance media</Text>

          {result ? (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.resultBlock}
            >
              <FormSection
                title="Verification result"
                styles={styles}
                surfaceStyle={glassSurface}
                titleStyle={styles.textOnGlass}
              >
                <VerificationStatusBanner
                  status={result.authenticationStatus as "auto_verified"}
                  trustScore={result.trustScore}
                />
                <TrustScoreIndicator score={result.trustScore} />
              </FormSection>
            </MotiView>
          ) : (
            <>
              <StepProgress current={step} styles={styles} />

              <FormSection
                title="About verification"
                styles={styles}
                surfaceStyle={glassSurface}
                titleStyle={styles.textOnGlass}
              >
                <Text style={styles.heroBody}>
                  Crownly AI checks serial consistency, dial details, and provenance. Listings
                  that pass appear with a trust badge in search.
                </Text>
              </FormSection>

              <FormSection
                title="Required media"
                styles={styles}
                surfaceStyle={glassSurface}
                titleStyle={styles.textOnGlass}
              >
                <Text style={[styles.fieldLabel, styles.textOnGlass]}>
                  {uploadedCount}/{ASSETS.length} uploaded
                </Text>
                <ScrollView
                  horizontal
                  {...HIDE_SCROLL_INDICATORS}
                  style={styles.mediaScroll}
                  contentContainerStyle={styles.mediaScrollContent}
                  decelerationRate="fast"
                >
                  {ASSETS.map((asset) => (
                    <UploadTile
                      key={asset.type}
                      asset={asset}
                      uri={uris[asset.type]}
                      onPress={() => pickAsset(asset.type, asset.video)}
                      styles={styles}
                      glassInset={glassInset}
                    />
                  ))}
                </ScrollView>
              </FormSection>

              <FormSection
                title="Tips for faster approval"
                styles={styles}
                surfaceStyle={glassSurface}
                titleStyle={styles.textOnGlass}
              >
                <ScrollView
                  horizontal
                  {...HIDE_SCROLL_INDICATORS}
                  contentContainerStyle={styles.tipRow}
                >
                  {[
                    { icon: "sunny-outline" as const, text: "Use daylight" },
                    { icon: "scan-outline" as const, text: "Keep serial in focus" },
                    { icon: "hand-left-outline" as const, text: "Steady rotation on video" },
                    { icon: "document-text-outline" as const, text: "Include warranty card" },
                  ].map((tip) => (
                    <View key={tip.text} style={[styles.tipChip, glassInset]}>
                      <Ionicons name={tip.icon} size={14} color={GLASS_TEXT} />
                      <Text style={styles.tipChipText}>{tip.text}</Text>
                    </View>
                  ))}
                </ScrollView>
              </FormSection>
            </>
          )}
        </ScrollView>

        {!result ? (
          <View
            style={[
              styles.footer,
              {
                paddingBottom: footerInset,
                backgroundColor:
                  colorScheme === "light" ? "rgba(255, 255, 255, 0.72)" : "rgba(0, 0, 0, 0.72)",
                borderTopColor:
                  colorScheme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)",
              },
            ]}
          >
            <View style={styles.footerProgress}>
              <View style={styles.uploadProgressHeader}>
                <Text style={styles.uploadProgressLabel}>Upload progress</Text>
                <Text style={styles.uploadProgressCount}>
                  {uploadedCount}/{ASSETS.length}
                </Text>
              </View>
              <View style={styles.uploadProgressTrack}>
                <MotiView
                  animate={{ width: `${Math.max(progress * 100, 4)}%` }}
                  transition={{ type: "timing", duration: 350 }}
                  style={styles.uploadProgressFill}
                />
              </View>
            </View>
            <LuxuryButton
              label={footerLabel}
              onPress={handleSubmit}
              disabled={loading || !allComplete}
              loading={loading}
              variant="glass"
              size="large"
            />
          </View>
        ) : null}
      </View>
    </BlurredWatchBackground>
  );
}

function createTrustVerifyStyles() {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: "transparent",
    },
    topRow: {
      marginBottom: 8,
      alignSelf: "flex-start",
    },
    pageTitle: {
      ...Typography.h2,
      color: Colors.textPrimary,
      fontSize: 28,
      marginBottom: 6,
    },
    pageSubtitle: {
      ...Typography.caption,
      color: Colors.textMuted,
      marginBottom: 24,
    },
    progressRow: {
      flexDirection: "row",
      marginBottom: 24,
    },
    progressStep: {
      flex: 1,
      marginHorizontal: 4,
    },
    progressBar: {
      height: 3,
      borderRadius: 2,
    },
    progressStepLabel: {
      ...Typography.caption,
      fontSize: 10,
      marginTop: 8,
      textAlign: "center",
    },
    section: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      padding: 16,
      marginBottom: 16,
      backgroundColor: Colors.card,
    },
    sectionTitle: {
      ...Typography.label,
      color: Colors.textMuted,
      marginBottom: 14,
    },
    textOnGlass: {
      color: GLASS_TEXT,
    },
    fieldLabel: {
      ...Typography.caption,
      color: Colors.textMuted,
      marginBottom: 12,
    },
    heroBody: {
      ...Typography.caption,
      color: GLASS_MUTED,
      lineHeight: 18,
    },
    mediaScroll: {
      marginHorizontal: -16,
    },
    mediaScrollContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    tile: {
      borderWidth: 1,
      borderRadius: RADIUS.md,
      padding: 12,
      minHeight: 196,
    },
    tileComplete: {
      borderColor: Colors.success,
    },
    tilePressed: {
      opacity: 0.92,
    },
    tileHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    stepBadgeComplete: {
      backgroundColor: Colors.success,
      borderColor: Colors.success,
    },
    addedPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
    },
    addedPillText: {
      ...Typography.caption,
      color: Colors.success,
      fontSize: 10,
      fontWeight: "600",
    },
    tilePreview: {
      width: "100%",
      height: 88,
      borderRadius: RADIUS.sm,
      marginBottom: 10,
      backgroundColor: "rgba(0,0,0,0.2)",
    },
    videoPreview: {
      width: "100%",
      height: 88,
      borderRadius: RADIUS.sm,
      marginBottom: 10,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderWidth: 1,
    },
    videoPreviewText: {
      ...Typography.caption,
      color: GLASS_MUTED,
      fontSize: 11,
    },
    tilePlaceholder: {
      width: "100%",
      height: 88,
      borderRadius: RADIUS.sm,
      marginBottom: 10,
      borderWidth: 1,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    tapToUpload: {
      ...Typography.caption,
      color: GLASS_MUTED,
      fontSize: 10,
    },
    tileLabel: {
      ...Typography.body,
      color: GLASS_TEXT,
      fontWeight: "600",
      fontSize: 13,
    },
    tileHint: {
      ...Typography.caption,
      color: GLASS_MUTED,
      marginTop: 4,
      lineHeight: 16,
      fontSize: 11,
    },
    tipRow: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 8,
    },
    tipChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      flexShrink: 0,
    },
    tipChipText: {
      ...Typography.caption,
      color: GLASS_TEXT,
      fontSize: 11,
    },
    resultBlock: {
      marginBottom: 8,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: SPACING.screen,
      paddingTop: 16,
      borderTopWidth: 1,
    },
    footerProgress: {
      marginBottom: 14,
    },
    uploadProgressHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    uploadProgressLabel: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    uploadProgressCount: {
      ...Typography.caption,
      color: Colors.textPrimary,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    uploadProgressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.border,
      overflow: "hidden",
    },
    uploadProgressFill: {
      height: "100%",
      backgroundColor: Colors.success,
      borderRadius: 2,
    },
  });
}
