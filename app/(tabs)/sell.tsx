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
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/EmptyState";
import { BlurredWatchBackground } from "@/components/BlurredWatchBackground";
import { ImageOverlayGate } from "@/components/ImageOverlayGate";
import { LoggedOutGate } from "@/components/LoggedOutGate";
import { SellerVerificationTrustPanel } from "@/components/SellerVerificationTrustPanel";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LUXURY_BRANDS, CONDITIONS } from "@/constants/brands";
import { Colors } from "@/constants/colors";
import { LOGGED_OUT_GATE_IMAGES } from "@/constants/loggedOutGate";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { notifyContentRefresh } from "@/lib/contentRefresh";
import { ListingSetIcons } from "@/components/ListingSetIcons";
import { SellerPayoutBreakdown } from "@/components/SellerPayoutBreakdown";
import { createListing, uploadListingImage } from "@/services/listings";
import { isSellerKycApproved } from "@/services/kyc";
import { dollarsToCents } from "@/lib/stripe";
import { ensurePhotoLibraryPermission, pickManyFromPhotoLibrary } from "@/lib/imagePicker";

const STEPS = ["Photos", "Details", "Review"] as const;
type Step = (typeof STEPS)[number];

const FOOTER_HEIGHT = 104;
const PHOTO_GAP = 10;
const GLASS_TEXT = "#FFFFFF";
const GLASS_PLACEHOLDER = "rgba(255,255,255,0.55)";

function StepProgress({
  current,
  styles,
}: {
  current: Step;
  styles: ReturnType<typeof createSellStyles>;
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

function FormSection({
  title,
  children,
  styles,
  surfaceStyle,
  titleStyle,
}: {
  title: string;
  children: ReactNode;
  styles: ReturnType<typeof createSellStyles>;
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

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, isAuthenticated, loading: authLoading, refreshProfile } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [includesBox, setIncludesBox] = useState(true);
  const [includesPapers, setIncludesPapers] = useState(true);
  const [includesWarrantyCard, setIncludesWarrantyCard] = useState(false);
  const [step, setStep] = useState<Step>("Photos");
  const [loading, setLoading] = useState(false);
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createSellStyles);
  const glassSurface = useMemo(() => createGlassSurface(colorScheme), [colorScheme]);
  const glassInset = useMemo(() => createGlassInset(colorScheme), [colorScheme]);

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
    const allowed = await ensurePhotoLibraryPermission(
      "Allow photo access to add listing photos."
    );
    if (!allowed) return;

    const assets = await pickManyFromPhotoLibrary({
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.9,
    });
    if (assets.length) {
      setImages((prev) =>
        [...prev, ...assets.map((a) => a.uri)].slice(0, 8)
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
      router.push("/auth/welcome");
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

      const listing = await createListing(user!.id, {
        brand,
        model,
        reference_number: referenceNumber || undefined,
        year: year ? parseInt(year, 10) : undefined,
        condition,
        description,
        price: dollarsToCents(parseFloat(price)),
        images: uploaded,
        serial_number: serialNumber || undefined,
        includes_box: includesBox,
        includes_papers: includesPapers,
        includes_warranty_card: includesWarrantyCard,
      });

      notifyContentRefresh();
      router.push(`/listing/trust-verify/${listing.id}`);
      Alert.alert(
        "Almost there",
        "Complete AI authentication uploads to publish your listing."
      );
      setStep("Photos");
      setImages([]);
      setBrand("");
      setModel("");
      setPrice("");
      setDescription("");
      setIncludesBox(true);
      setIncludesPapers(true);
      setIncludesWarrantyCard(false);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  const footerBottom = insets.bottom + SPACING.tabBarHeight;

  if (!isAuthenticated && !authLoading) {
    return (
      <LoggedOutGate
        title="Sell on Crownly"
        subtitle="List your timepieces to collectors worldwide."
        backgroundImage={LOGGED_OUT_GATE_IMAGES.sell}
        onSignIn={() => router.push("/auth/welcome")}
        onSignUp={() => router.push("/auth/signup")}
      />
    );
  }

  if (!profile?.verified) {
    return (
      <ImageOverlayGate backgroundImage={LOGGED_OUT_GATE_IMAGES.sellerVerification}>
        <EmptyState
          fill
          onDark
          icon="shield-checkmark-outline"
          title="Complete seller verification"
          body="Join verified sellers on Crownly. We confirm your identity and connect secure payouts so collectors can buy with confidence."
          footer={<SellerVerificationTrustPanel />}
          actionLabel="Start Verification"
          onAction={handleStartVerification}
        />
      </ImageOverlayGate>
    );
  }

  if (!isSellerKycApproved(profile)) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Sell" subtitle="List your timepieces to collectors worldwide" />
        <View style={styles.loggedOutBody}>
          <EmptyState
            fill
            icon="id-card-outline"
            title="Government ID verification"
            body="Upload your ID and selfie for automated KYC. Verified sellers can publish listings."
            actionLabel="Verify identity"
            actionVariant="outline"
            onAction={() => router.push("/kyc")}
          />
        </View>
      </View>
    );
  }

  return (
    <BlurredWatchBackground imageUri={LOGGED_OUT_GATE_IMAGES.sell}>
      <KeyboardAvoidingView
        style={styles.screenTransparent}
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

        <StepProgress current={step} styles={styles} />

        {step === "Photos" && (
          <FormSection title="Photos" styles={styles} surfaceStyle={glassSurface}>
            <Pressable onPress={pickImages} style={[styles.uploadArea, glassInset]}>
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
            <FormSection
              title="Watch Details"
              styles={styles}
              surfaceStyle={glassSurface}
              titleStyle={styles.textOnGlass}
            >
              <Text style={[styles.fieldLabel, styles.textOnGlass]}>Brand</Text>
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
                placeholderTextColor={GLASS_PLACEHOLDER}
                value={brand}
                onChangeText={setBrand}
                style={[styles.input, styles.inputClear]}
              />
              <TextInput
                placeholder="Model"
                placeholderTextColor={GLASS_PLACEHOLDER}
                value={model}
                onChangeText={setModel}
                style={[styles.input, styles.inputClear]}
              />
              <TextInput
                placeholder="Reference Number"
                placeholderTextColor={GLASS_PLACEHOLDER}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                style={[styles.input, styles.inputClear]}
              />
              <TextInput
                placeholder="Year"
                placeholderTextColor={GLASS_PLACEHOLDER}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                style={[styles.input, styles.inputClear]}
              />
            </FormSection>

            <FormSection
              title="Condition"
              styles={styles}
              surfaceStyle={glassSurface}
              titleStyle={styles.textOnGlass}
            >
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

            <FormSection
              title="What's included"
              styles={styles}
              surfaceStyle={glassSurface}
              titleStyle={styles.textOnGlass}
            >
              <Text style={[styles.fieldLabel, styles.textOnGlass]}>
                Tap to toggle — faded items are not included
              </Text>
              <ScrollView
                horizontal
                {...HIDE_SCROLL_INDICATORS}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
              >
                <Pressable
                  onPress={() => setIncludesBox((v) => !v)}
                  style={[styles.chip, styles.accessoryChip, includesBox && styles.chipActive]}
                >
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={includesBox ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      includesBox && styles.chipTextActive,
                      !includesBox && { opacity: 0.5 },
                    ]}
                  >
                    Box
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIncludesPapers((v) => !v)}
                  style={[styles.chip, styles.accessoryChip, includesPapers && styles.chipActive]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={includesPapers ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      includesPapers && styles.chipTextActive,
                      !includesPapers && { opacity: 0.5 },
                    ]}
                  >
                    Papers
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIncludesWarrantyCard((v) => !v)}
                  style={[
                    styles.chip,
                    styles.accessoryChip,
                    includesWarrantyCard && styles.chipActive,
                  ]}
                >
                  <Ionicons
                    name="ribbon-outline"
                    size={16}
                    color={includesWarrantyCard ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      includesWarrantyCard && styles.chipTextActive,
                      !includesWarrantyCard && { opacity: 0.5 },
                    ]}
                  >
                    Warranty card
                  </Text>
                </Pressable>
              </ScrollView>
            </FormSection>

            <FormSection
              title="Description"
              styles={styles}
              surfaceStyle={glassSurface}
              titleStyle={styles.textOnGlass}
            >
              <TextInput
                placeholder="Describe your watch, box & papers, service history…"
                placeholderTextColor={GLASS_PLACEHOLDER}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.inputClear, styles.textArea]}
              />
            </FormSection>
          </>
        )}

        {step === "Review" && (
          <>
            <FormSection
              title="Pricing"
              styles={styles}
              surfaceStyle={glassSurface}
              titleStyle={styles.textOnGlass}
            >
              <TextInput
                placeholder="Asking Price (USD)"
                placeholderTextColor={GLASS_PLACEHOLDER}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={[styles.input, styles.inputClear]}
              />
              <TextInput
                placeholder="Serial Number (optional)"
                placeholderTextColor={GLASS_PLACEHOLDER}
                value={serialNumber}
                onChangeText={setSerialNumber}
                style={[styles.input, styles.inputClear, { marginBottom: 0 }]}
              />
              <SellerPayoutBreakdown priceDollars={price} tone="glass" />
            </FormSection>

            {images[0] && (
              <Image
                source={{ uri: images[0] }}
                style={styles.previewHero}
                contentFit="cover"
              />
            )}
            <Text style={[styles.previewBrand, styles.textOnGlass]}>{brand}</Text>
            <Text style={[styles.previewModel, styles.textOnGlass]}>{model}</Text>
            <Text style={[styles.previewPrice, styles.textOnGlass]}>
              ${parseFloat(price || "0").toLocaleString()}
            </Text>
            {description ? (
              <Text style={[styles.previewDesc, styles.textOnGlassSecondary]}>{description}</Text>
            ) : null}
            <ListingSetIcons
              tone="glass"
              listing={{
                includes_box: includesBox,
                includes_papers: includesPapers,
                includes_warranty_card: includesWarrantyCard,
              }}
            />
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            bottom: footerBottom,
            paddingBottom: 16,
            backgroundColor:
              colorScheme === "light" ? "rgba(255, 255, 255, 0.72)" : "rgba(0, 0, 0, 0.72)",
            borderTopColor:
              colorScheme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)",
          },
        ]}
      >
        {step === "Photos" && (
          <LuxuryButton label="Next" onPress={goNext} variant="glass" size="large" />
        )}
        {step === "Details" && (
          <View style={styles.footerRow}>
            <View style={styles.footerBtn}>
              <LuxuryButton label="Back" onPress={goBack} variant="glass" size="large" />
            </View>
            <View style={styles.footerSpacer} />
            <View style={styles.footerBtn}>
              <LuxuryButton label="Next" onPress={goNext} variant="glass" size="large" />
            </View>
          </View>
        )}
        {step === "Review" && (
          <View style={styles.footerRow}>
            <View style={styles.footerBtn}>
              <LuxuryButton label="Back" onPress={goBack} variant="glass" size="large" />
            </View>
            <View style={styles.footerSpacer} />
            <View style={styles.footerBtn}>
              <LuxuryButton
                label="Publish"
                onPress={handlePublish}
                loading={loading}
                variant="glass"
                size="large"
              />
            </View>
          </View>
        )}
      </View>
      </KeyboardAvoidingView>
    </BlurredWatchBackground>
  );
}

function createSellStyles() {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenTransparent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loggedOutBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.screen,
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
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  textOnGlass: {
    color: GLASS_TEXT,
  },
  textOnGlassSecondary: {
    color: "rgba(255,255,255,0.8)",
  },
  chipScroll: {
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: "row",
    paddingRight: 8,
  },
  accessoryChip: {
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.pill,
    marginRight: 8,
    flexShrink: 0,
  },
  chipActive: {
    borderColor: Colors.textPrimary,
    backgroundColor: Colors.cardElevated,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  chipTextActive: {
    color: "#FFFFFF",
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
  inputClear: {
    backgroundColor: "transparent",
    color: GLASS_TEXT,
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
}
