import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LuxuryButton } from "@/components/LuxuryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LUXURY_BRANDS, CONDITIONS } from "@/constants/brands";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { getListingById, updateListing } from "@/services/listings";
import { dollarsToCents } from "@/lib/stripe";
import { screenContentPadding } from "@/styles/layout";

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getListingById(id).then((listing) => {
      if (!listing) {
        Alert.alert("Not found", "This listing could not be found.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }
      if (user && listing.seller_id !== user.id) {
        Alert.alert("Unauthorized", "You can only edit your own listings.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }
      setBrand(listing.brand);
      setModel(listing.model);
      setReferenceNumber(listing.reference_number ?? "");
      setYear(listing.year ? String(listing.year) : "");
      setCondition(listing.condition);
      setDescription(listing.description ?? "");
      setPrice(String(listing.price / 100));
      setCoverImage(listing.images[0] ?? null);
      setLoading(false);
    });
  }, [id, user, router]);

  const inputStyle = {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  };

  const handleSave = async () => {
    if (!user || !id) return;
    if (!brand.trim() || !model.trim() || !price.trim()) {
      Alert.alert("Missing fields", "Brand, model, and price are required.");
      return;
    }

    setSaving(true);
    try {
      await updateListing(id, user.id, {
        brand: brand.trim(),
        model: model.trim(),
        reference_number: referenceNumber.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        condition,
        description: description.trim() || undefined,
        price: dollarsToCents(parseFloat(price)),
      });
      Alert.alert("Saved", "Your listing has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: Colors.textMuted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          ...screenContentPadding(insets.bottom),
        }}
        {...HIDE_SCROLL_INDICATORS}
      >
        <ScreenHeader title="Edit Listing" subtitle="Update your listing details" padded={false} />

        {coverImage && (
          <Image
            source={{ uri: coverImage }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: RADIUS.md,
              marginBottom: 20,
            }}
            contentFit="cover"
          />
        )}

        <View
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: RADIUS.md,
            padding: 16,
            marginBottom: 16,
            backgroundColor: Colors.card,
          }}
        >
          <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 12 }}>
            Watch Details
          </Text>

          <ScrollView
            horizontal
            {...HIDE_SCROLL_INDICATORS}
            style={{ marginBottom: 12 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {LUXURY_BRANDS.slice(0, 6).map((b) => (
              <Pressable
                key={b}
                onPress={() => setBrand(b)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: brand === b ? Colors.textPrimary : Colors.border,
                  borderRadius: RADIUS.pill,
                }}
              >
                <Text
                  style={{
                    color: brand === b ? Colors.textPrimary : Colors.textMuted,
                    fontSize: 12,
                  }}
                >
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
            style={inputStyle}
          />
          <TextInput
            placeholder="Model"
            placeholderTextColor={Colors.textMuted}
            value={model}
            onChangeText={setModel}
            style={inputStyle}
          />
          <TextInput
            placeholder="Reference Number"
            placeholderTextColor={Colors.textMuted}
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            style={inputStyle}
          />
          <TextInput
            placeholder="Year"
            placeholderTextColor={Colors.textMuted}
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            style={inputStyle}
          />
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: RADIUS.md,
            padding: 16,
            marginBottom: 16,
            backgroundColor: Colors.card,
          }}
        >
          <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 12 }}>
            Condition
          </Text>
          <ScrollView
            horizontal
            {...HIDE_SCROLL_INDICATORS}
            contentContainerStyle={{ gap: 8 }}
          >
            {CONDITIONS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCondition(c)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: condition === c ? Colors.textPrimary : Colors.border,
                  borderRadius: RADIUS.pill,
                }}
              >
                <Text
                  style={{
                    color: condition === c ? Colors.textPrimary : Colors.textMuted,
                    fontSize: 12,
                  }}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: RADIUS.md,
            padding: 16,
            marginBottom: 24,
            backgroundColor: Colors.card,
          }}
        >
          <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 12 }}>
            Pricing & Description
          </Text>
          <TextInput
            placeholder="Asking Price (USD)"
            placeholderTextColor={Colors.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            style={inputStyle}
          />
          <TextInput
            placeholder="Description"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[inputStyle, { minHeight: 100, marginBottom: 0 }]}
          />
        </View>

        <LuxuryButton label="Save Changes" onPress={handleSave} loading={saving} variant="primary" />
        <View style={{ height: 12 }} />
        <LuxuryButton label="Cancel" onPress={() => router.back()} variant="outline" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
