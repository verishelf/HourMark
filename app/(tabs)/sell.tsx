import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LUXURY_BRANDS, CONDITIONS } from "@/constants/brands";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { createListing, uploadListingImage } from "@/services/listings";
import { dollarsToCents } from "@/lib/stripe";

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [step, setStep] = useState<"form" | "preview">("form");
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: 8,
    });
    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        ...result.assets.map((a) => a.uri),
      ].slice(0, 8));
    }
  };

  const inputStyle = {
    ...Typography.body,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 20,
  };

  const handlePublish = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!images.length || !brand || !model || !price) {
      Alert.alert("Missing fields", "Please add photos, brand, model, and price.");
      return;
    }

    setLoading(true);
    try {
      const uploaded = await Promise.all(
        images.map((uri, i) =>
          uploadListingImage(user!.id, uri, i)
        )
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
      setStep("form");
      setImages([]);
      setBrand("");
      setModel("");
      setPrice("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          paddingTop: insets.top + 40,
          paddingHorizontal: 20,
          justifyContent: "center",
        }}
      >
        <Text style={{ ...Typography.h1, color: Colors.textPrimary, marginBottom: 12 }}>
          Sell on HourMark
        </Text>
        <Text
          style={{
            ...Typography.body,
            color: Colors.textSecondary,
            marginBottom: 32,
          }}
        >
          Sign in to list your timepieces to collectors worldwide.
        </Text>
        <LuxuryButton label="Sign In" onPress={() => router.push("/auth/login")} />
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
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ ...Typography.h1, color: Colors.textPrimary, marginBottom: 8 }}>
          {step === "form" ? "List a Watch" : "Preview"}
        </Text>
        <Text
          style={{
            ...Typography.caption,
            color: Colors.textMuted,
            marginBottom: 32,
          }}
        >
          {step === "form"
            ? "Share your timepiece with discerning collectors"
            : "Review before publishing"}
        </Text>

        {step === "form" ? (
          <>
            <Pressable
              onPress={pickImages}
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                borderStyle: "dashed",
                padding: 32,
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text style={{ ...Typography.label, color: Colors.textSecondary }}>
                + Add Photos ({images.length}/8)
              </Text>
            </Pressable>

            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                {images.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={{ width: 100, height: 100, marginRight: 8 }}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            )}

            <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 8 }}>
              Brand
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {LUXURY_BRANDS.slice(0, 6).map((b) => (
                <Pressable
                  key={b}
                  onPress={() => setBrand(b)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: brand === b ? Colors.textPrimary : Colors.border,
                  }}
                >
                  <Text style={{ color: brand === b ? Colors.textPrimary : Colors.textMuted, fontSize: 12 }}>
                    {b}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              placeholder="Or type brand"
              placeholderTextColor={Colors.textMuted}
              value={brand}
              onChangeText={setBrand}
              style={inputStyle}
            />

            <TextInput placeholder="Model" placeholderTextColor={Colors.textMuted} value={model} onChangeText={setModel} style={inputStyle} />
            <TextInput placeholder="Reference Number" placeholderTextColor={Colors.textMuted} value={referenceNumber} onChangeText={setReferenceNumber} style={inputStyle} />
            <TextInput placeholder="Year" placeholderTextColor={Colors.textMuted} value={year} onChangeText={setYear} keyboardType="number-pad" style={inputStyle} />

            <Text style={{ ...Typography.label, color: Colors.textMuted, marginBottom: 8 }}>Condition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CONDITIONS.map((c) => (
                <Pressable key={c} onPress={() => setCondition(c)} style={{ paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: condition === c ? Colors.textPrimary : Colors.border }}>
                  <Text style={{ color: condition === c ? Colors.textPrimary : Colors.textMuted, fontSize: 12 }}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput placeholder="Description" placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription} multiline numberOfLines={4} style={[inputStyle, { minHeight: 100 }]} />
            <TextInput placeholder="Asking Price (USD)" placeholderTextColor={Colors.textMuted} value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={inputStyle} />
            <TextInput placeholder="Serial Number (optional)" placeholderTextColor={Colors.textMuted} value={serialNumber} onChangeText={setSerialNumber} style={inputStyle} />

            <LuxuryButton label="Preview Listing" onPress={() => setStep("preview")} />
          </>
        ) : (
          <>
            {images[0] && (
              <Image source={{ uri: images[0] }} style={{ width: "100%", height: 320, marginBottom: 24 }} contentFit="cover" />
            )}
            <Text style={{ ...Typography.label, color: Colors.textSecondary }}>{brand}</Text>
            <Text style={{ ...Typography.h2, color: Colors.textPrimary, marginBottom: 8 }}>{model}</Text>
            <Text style={{ ...Typography.price, color: Colors.textPrimary, marginBottom: 24 }}>
              ${parseFloat(price || "0").toLocaleString()}
            </Text>
            <Text style={{ ...Typography.body, color: Colors.textSecondary, marginBottom: 32 }}>{description}</Text>

            <LuxuryButton label="Publish Listing" onPress={handlePublish} loading={loading} />
            <View style={{ height: 12 }} />
            <LuxuryButton label="Edit" onPress={() => setStep("form")} variant="outline" />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
