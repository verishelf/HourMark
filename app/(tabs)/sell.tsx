import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LUXURY_BRANDS, CONDITIONS } from "@/constants/brands";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { createListing, uploadListingImage } from "@/services/listings";
import { dollarsToCents } from "@/lib/stripe";

const STEPS = ["Photos", "Details", "Review"] as const;
type Step = (typeof STEPS)[number];

const FOOTER_HEIGHT = 104;
const PHOTO_GAP = 10;

function StepProgress({ current }: { current: Step }) {
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
              styles.progressLabel,
              { color: i <= currentIndex ? Colors.textPrimary : Colors.textMuted },
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, isAuthenticated, refreshProfile } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [step, setStep] = useState<Step>("Photos");
  const [loading, setLoading] = useState(false);

  const handleStartVerification = () => {
    router.push("/verify?returnPath=sell");
  };

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  const photoSize = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    const horizontalPadding = SPACING.screen * 2;
    const sectionPadding = 16 * 2;
    const available = screenWidth - horizontalPadding - sectionPadding - PHOTO_GAP;
    return Math.floor(available / 2);
  }, []);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: 8,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (!result.canceled) {
      setImages((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 8)
      );
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const goNext = () => {
    if (step === "Photos") {
      if (!images.length) {
        Alert.alert("Photos required", "Add at least one photo to continue.");
        return;
      }
      setStep("Details");
    } else if (step === "Details") {
      if (!brand.trim() || !model.trim()) {
        Alert.alert("Missing fields", "Please enter brand and model.");
        return;
      }
      setStep("Review");
    }
  };

  const goBack = () => {
    if (step === "Details") setStep("Photos");
    else if (step === "Review") setStep("Details");
  };

  const handlePublish = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!profile?.verified) {
      Alert.alert(
        "Verification required",
        "Complete seller verification before publishing a listing."
      );
      return;
    }
    if (!images.length || !brand || !model || !price) {
      Alert.alert("Missing fields", "Please add photos, brand, model, and price.");
      return;
    }

    setLoading(true);
    try {
      const uploaded = await Promise.all(
        images.map((uri, i) => uploadListingImage(user!.id, uri, i))
      );

      await createListing(user!.id, {
        brand,
        model,
        reference_number: referenceNumber || undefined,
        year: year ? parseInt(year, 10) : undefined,
        condition,
        description,
        price: dollarsToCents(parseFloat(price)),
        images: uploaded,
        serial_number: serialNumber || undefined,
      });

      Alert.alert("Published", "Your listing is now live on HourMark.");
      setStep("Photos");
      setImages([]);
      setBrand("");
      setModel("");
      setPrice("");
      setDescription("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  const footerBottom = insets.bottom + SPACING.tabBarHeight;

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Sell on HourMark" />
        <View style={styles.loggedOutBody}>
          <Text style={styles.loggedOutText}>
            Sign in to list your timepieces to collectors worldwide.
          </Text>
          <LuxuryButton label="Sign In" onPress={() => router.push("/auth/login")} variant="primary" />
        </View>
      </View>
    );
  }

  if (!profile?.verified) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Sell on HourMark" />
        <View style={styles.loggedOutBody}>
          <EmptyState
            icon="shield-checkmark-outline"
            title="Complete seller verification"
            body="Verify your identity with name, address, and SSN, and connect payouts before listing watches."
            actionLabel="Start Verification"
            onAction={handleStartVerification}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          paddingHorizontal: SPACING.screen,
          paddingTop: insets.top + 16,
          paddingBottom: footerBottom + FOOTER_HEIGHT + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>List a Watch</Text>
        <Text style={styles.pageSubtitle}>Share your timepiece with discerning collectors</Text>

        <StepProgress current={step} />

        {step === "Photos" && (
          <FormSection title="Photos">
            <Pressable onPress={pickImages} style={styles.uploadArea}>
              <Ionicons name="camera-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.uploadLabel}>Add Photos</Text>
              <Text style={styles.uploadHint}>{images.length}/8 uploaded</Text>
            </Pressable>

            {images.length > 0 && (
              <View style={styles.photoGrid}>
                {images.map((uri, i) => (
                  <View
                    key={`${uri}-${i}`}
                    style={[
                      styles.photoCell,
                      {
                        width: photoSize,
                        height: photoSize,
                        marginRight: i % 2 === 0 ? PHOTO_GAP : 0,
                        marginBottom: PHOTO_GAP,
                      },
                    ]}
                  >
                    <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                    {i === 0 && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => removeImage(i)}
                      style={styles.removePhotoBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={14} color={Colors.textPrimary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </FormSection>
        )}

        {step === "Details" && (
          <>
            <FormSection title="Watch Details">
              <Text style={styles.fieldLabel}>Brand</Text>
              <ScrollView
                horizontal
                {...HIDE_SCROLL_INDICATORS}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
              >
                {LUXURY_BRANDS.slice(0, 6).map((b) => (
                  <Pressable
                    key={b}
                    onPress={() => setBrand(b)}
                    style={[styles.chip, brand === b && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, brand === b && styles.chipTextActive]}>
                      {b}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                placeholder="Brand"
                placeholderTextColor={Colors.textMuted}
                value={brand}
                onChangeText={setBrand}
                style={styles.input}
              />
              <TextInput
                placeholder="Model"
                placeholderTextColor={Colors.textMuted}
                value={model}
                onChangeText={setModel}
                style={styles.input}
              />
              <TextInput
                placeholder="Reference Number"
                placeholderTextColor={Colors.textMuted}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                style={styles.input}
              />
              <TextInput
                placeholder="Year"
                placeholderTextColor={Colors.textMuted}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                style={styles.input}
              />
            </FormSection>

            <FormSection title="Condition">
              <ScrollView
                horizontal
                {...HIDE_SCROLL_INDICATORS}
                contentContainerStyle={styles.chipRow}
              >
                {CONDITIONS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCondition(c)}
                    style={[styles.chip, condition === c && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </FormSection>

            <FormSection title="Description">
              <TextInput
                placeholder="Describe your watch, box & papers, service history…"
                placeholderTextColor={Colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
              />
            </FormSection>
          </>
        )}

        {step === "Review" && (
          <>
            <FormSection title="Pricing">
              <TextInput
                placeholder="Asking Price (USD)"
                placeholderTextColor={Colors.textMuted}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={styles.input}
              />
              <TextInput
                placeholder="Serial Number (optional)"
                placeholderTextColor={Colors.textMuted}
                value={serialNumber}
                onChangeText={setSerialNumber}
                style={[styles.input, { marginBottom: 0 }]}
              />
            </FormSection>

            {images[0] && (
              <Image
                source={{ uri: images[0] }}
                style={styles.previewHero}
                contentFit="cover"
              />
            )}
            <Text style={styles.previewBrand}>{brand}</Text>
            <Text style={styles.previewModel}>{model}</Text>
            <Text style={styles.previewPrice}>
              ${parseFloat(price || "0").toLocaleString()}
            </Text>
            {description ? <Text style={styles.previewDesc}>{description}</Text> : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { bottom: footerBottom, paddingBottom: 16 }]}>
        {step === "Photos" && (
          <LuxuryButton label="Next" onPress={goNext} variant="primary" size="large" />
        )}
        {step === "Details" && (
          <View style={styles.footerRow}>
            <View style={styles.footerBtn}>
              <LuxuryButton label="Back" onPress={goBack} variant="outline" size="large" />
            </View>
            <View style={styles.footerSpacer} />
            <View style={styles.footerBtn}>
              <LuxuryButton label="Next" onPress={goNext} variant="primary" size="large" />
            </View>
          </View>
        )}
        {step === "Review" && (
          <View style={styles.footerRow}>
            <View style={styles.footerBtn}>
              <LuxuryButton label="Back" onPress={goBack} variant="outline" size="large" />
            </View>
            <View style={styles.footerSpacer} />
            <View style={styles.footerBtn}>
              <LuxuryButton
                label="Publish"
                onPress={handlePublish}
                loading={loading}
                variant="primary"
                size="large"
              />
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loggedOutBody: {
    paddingHorizontal: SPACING.screen,
    flex: 1,
    justifyContent: "center",
  },
  loggedOutText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
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
  progressLabel: {
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
  uploadArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  uploadLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  uploadHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 6,
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  photoCell: {
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    backgroundColor: Colors.cardElevated,
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  coverBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  coverBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textPrimary,
  },
  removePhotoBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  chipScroll: {
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: "row",
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.pill,
    marginRight: 8,
  },
  chipActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.cardElevated,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    marginBottom: 0,
    textAlignVertical: "top",
  },
  previewHero: {
    width: "100%",
    height: 240,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    backgroundColor: Colors.cardElevated,
  },
  previewBrand: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  previewModel: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: 4,
    marginBottom: 8,
  },
  previewPrice: {
    ...Typography.price,
    color: Colors.textPrimary,
    fontSize: 24,
    marginBottom: 16,
  },
  previewDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.screen,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerBtn: {
    flex: 1,
  },
  footerSpacer: {
    width: 12,
  },
});
